import {createServer} from 'node:http';
import {cpus,totalmem,freemem} from 'node:os';
import {pathToFileURL} from 'node:url';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {createChatService,ChatError} from './chat.mjs';

export async function desktopStatus(fetcher=fetch){
 let gateway='unreachable';
 try{
  const response=await fetcher('http://127.0.0.1:18799/healthz',{signal:AbortSignal.timeout(2000),redirect:'error',headers:{Accept:'application/json'}});
  if(response.ok&&response.headers.get('content-type')?.includes('application/json'))gateway=(await response.json())?.ok===true?'live':'unverified';
  else gateway='unverified';
 }catch{}
 return {schema:1,checkedAt:new Date().toISOString(),host:'desktop',mode:'read-only',
  memory:{totalMB:Math.round(totalmem()/1048576),freeMB:Math.round(freemem()/1048576)},
  cpu:{model:cpus()[0]?.model??'CPU',logicalCores:cpus().length},gateway,agentResponseVerified:false,taskSubmission:false};
}
async function readJson(req){
 if(req.headers['content-type']?.split(';')[0]!=='application/json')throw new ChatError('json_required',415);
 if(Number(req.headers['content-length'])>24576){req.resume();throw new ChatError('message_too_large',413);}
 const raw=await new Promise((resolve,reject)=>{
  let bytes=0,parts=[],oversized=false;
  req.on('data',chunk=>{bytes+=chunk.length;if(bytes>24576){oversized=true;parts=[];}else if(!oversized)parts.push(chunk);});
  req.on('end',()=>oversized?reject(new ChatError('message_too_large',413)):resolve(Buffer.concat(parts).toString('utf8')));
  req.on('error',()=>reject(new ChatError('invalid_message',400)));
 });
 try{return JSON.parse(raw);}catch(error){if(error instanceof ChatError)throw error;throw new ChatError('invalid_message',400);}
}
export function createDesktopServer(probe=desktopStatus,{chat=null}={}){
 let pending,cached,expires=0;
 const sessionToken=randomBytes(32).toString('hex');
 const origins=['http://localhost:5173','http://127.0.0.1:5173'];
 return createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Type','application/json; charset=utf-8');
  const reply=(status,body)=>{if(!res.destroyed){res.writeHead(status);res.end(JSON.stringify(body));}};
  if(!/^127\.0\.0\.1:\d+$/.test(req.headers.host??''))return reply(403,{error:'host'});
  if(req.headers.origin&&!origins.includes(req.headers.origin))return reply(403,{error:'origin'});
  try{
   if(req.url?.startsWith('/chat/')){
    if(!chat)return reply(503,{error:'chat_unavailable'});
    if(req.method==='GET'&&req.url==='/chat/session')return reply(200,{token:sessionToken,status:chat.status()});
    const supplied=Buffer.from(String(req.headers['x-gabi-session']??''));
    const expected=Buffer.from(sessionToken);
    if(supplied.length!==expected.length||!timingSafeEqual(supplied,expected))return reply(403,{error:'session_required'});
    if(req.method==='GET'&&req.url==='/chat/history')return reply(200,chat.history());
    if(req.method==='POST'&&req.url==='/chat/send'){
     if(!origins.includes(req.headers.origin))return reply(403,{error:'origin'});
     return reply(200,await chat.send(await readJson(req)));
    }
    return reply(404,{error:'not-found'});
   }
   if(req.method!=='GET')return reply(405,{error:'read-only'});
   if(req.url!=='/status')return reply(404,{error:'not-found'});
   if(!cached||Date.now()>expires){pending??=Promise.resolve().then(probe);try{cached=await pending;expires=Date.now()+5000;}finally{pending=undefined;}}
   reply(200,cached);
  }catch(error){reply(error instanceof ChatError?error.status:503,{error:error instanceof ChatError?error.code:'unavailable'});}
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const chat=await createChatService();
 const server=createDesktopServer(desktopStatus,{chat});
 server.requestTimeout=150000;
 server.on('error',()=>{console.error('No se pudo iniciar el servidor local en 127.0.0.1:8787.');process.exitCode=1;});
 server.listen(8787,'127.0.0.1',()=>console.log('GABI OS · servidor local en 127.0.0.1:8787 · conversación sin acciones externas'));
}
