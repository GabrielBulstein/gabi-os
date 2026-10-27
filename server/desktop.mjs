import {createServer} from 'node:http';
import {cpus,totalmem,freemem} from 'node:os';
import {pathToFileURL} from 'node:url';

// This process deliberately has no shell execution or task submission API.
export async function desktopStatus(fetcher=fetch) {
  let gateway='unreachable';
  try {
    const response=await fetcher('http://127.0.0.1:18799/healthz',{
      signal:AbortSignal.timeout(2000),redirect:'error',headers:{Accept:'application/json'},
    });
    if(response.ok&&response.headers.get('content-type')?.includes('application/json')) {
      const body=await response.json();
      gateway=body?.ok===true?'live':'unverified';
    }else gateway='unverified';
  }catch { /* Unconfigured/offline is a normal first-run state. */ }
  return {schema:1,checkedAt:new Date().toISOString(),host:'desktop',mode:'read-only',
    memory:{totalMB:Math.round(totalmem()/1048576),freeMB:Math.round(freemem()/1048576)},
    cpu:{model:cpus()[0]?.model??'CPU',logicalCores:cpus().length},
    gateway,agentResponseVerified:false,taskSubmission:false};
}

export function createDesktopServer(probe=desktopStatus) {
  let pending;
  let cached;
  let expires=0;
  return createServer(async(req,res)=>{
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Content-Type','application/json; charset=utf-8');
    const reply=(status,body)=>{res.writeHead(status);res.end(JSON.stringify(body));};
    // Loopback binding + Host/Origin checks prevent LAN exposure and browser rebinding.
    if(!/^127\.0\.0\.1:\d+$/.test(req.headers.host??''))return reply(403,{error:'host'});
    if(req.headers.origin&&!['http://localhost:5173','http://127.0.0.1:5173'].includes(req.headers.origin))return reply(403,{error:'origin'});
    if(req.method!=='GET')return reply(405,{error:'read-only'});
    if(req.url!=='/status')return reply(404,{error:'not-found'});
    try {
      if(!cached||Date.now()>expires){
        pending??=Promise.resolve().then(probe);
        try{cached=await pending;expires=Date.now()+5000;}finally{pending=undefined;}
      }
      reply(200,cached);
    }catch{reply(503,{error:'unavailable'});}
  });
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const server=createDesktopServer();
  server.on('error',()=>{console.error('No se pudo iniciar el servidor local en 127.0.0.1:8787.');process.exitCode=1;});
  server.listen(8787,'127.0.0.1',()=>console.log('GABI OS · servidor de escritorio: http://127.0.0.1:8787/status (solo lectura)'));
}
