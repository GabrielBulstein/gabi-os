import {createServer} from 'node:http';
import {readFile,realpath} from 'node:fs/promises';
import {resolve,sep,extname,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {officePaths} from './paths.mjs';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2'};
const apiRoutes=new Map([['/status','GET'],['/chat/session','GET'],['/chat/history','GET'],['/chat/send','POST']]);
export function validatePrivateAccess(config){
 if(config?.schema!==1||typeof config.host!=='string'||!/^[a-z0-9-]+\.[a-z0-9-]+\.ts\.net$/.test(config.host)||typeof config.login!=='string'||!config.login.trim()||/[^\x20-\x7e]/.test(config.login))throw new Error('Invalid private access configuration');
 return {host:config.host,login:config.login.toLowerCase()};
}
export function createPrivateServer({config,directory,upstream=fetch}){
 config=validatePrivateAccess(config);
 const origin='https://'+config.host;
 return createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');
  function error(code,status){res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify({error:code}));}
  // Serve strips caller-supplied identity headers and inserts verified identity.
  // Loopback-only binding is mandatory: these headers are not trusted on a LAN listener.
  if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress||''))return error('loopback_required',403);
  if(req.headers.host!==config.host&&req.headers.host!==config.host+':443')return error('host',403);
  if(String(req.headers['tailscale-user-login']||'').toLowerCase()!==config.login)return error('identity',403);
  if(req.headers.origin&&req.headers.origin!==origin)return error('origin',403);
  try{
   const url=new URL(req.url,origin);
   if(url.pathname.startsWith('/__desktop/')){
    const endpoint=url.pathname.slice('/__desktop'.length);
    if(apiRoutes.get(endpoint)!==req.method||url.search)return error('route',404);
    if(req.method==='POST'&&req.headers.origin!==origin)return error('origin',403);
    if(req.method==='POST'&&req.headers['content-type']?.split(';')[0]!=='application/json')return error('json_required',415);
    let size=0,chunks=[];
    if(Number(req.headers['content-length'])>24576){req.resume();return error('message_too_large',413);}
    for await(const chunk of req){size+=chunk.length;if(size>24576){chunks=[];req.resume();return error('message_too_large',413);}chunks.push(chunk);}
    const headers={Origin:'http://localhost:5173','Content-Type':'application/json'};
    if(req.headers['x-gabi-session'])headers['X-Gabi-Session']=String(req.headers['x-gabi-session']);
    const response=await upstream('http://127.0.0.1:8787'+endpoint,{method:req.method,headers,body:req.method==='POST'?Buffer.concat(chunks):undefined,redirect:'error',signal:AbortSignal.timeout(135000)});
    res.writeHead(response.status,{'Content-Type':'application/json; charset=utf-8'});res.end(await response.text());return;
   }
   if(!['GET','HEAD'].includes(req.method))return error('method',405);
   if(url.pathname==='/'){res.writeHead(302,{Location:'/gabi-os/'});res.end();return;}
   if(!url.pathname.startsWith('/gabi-os/'))return error('route',404);
   const relative=decodeURIComponent(url.pathname.slice('/gabi-os/'.length))||'index.html';
   if(relative.includes('\0')||relative.includes('\\')||relative.split('/').includes('..'))return error('path',400);
   const root=await realpath(directory),file=await realpath(resolve(root,relative));
   if(!file.startsWith(root+sep))return error('path',403);
   const type=mime[extname(file)];if(!type)return error('file_type',404);
   const content=await readFile(file);res.writeHead(200,{'Content-Type':type,'Content-Length':content.length});res.end(req.method==='HEAD'?undefined:content);
  }catch(err){if(!res.headersSent)error(err?.code==='ENOENT'?'not_found':'unavailable',err?.code==='ENOENT'?404:503);else res.destroy();}
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const paths=officePaths();
 const config=JSON.parse(await readFile(join(paths.base,'data','run','private-access.json'),'utf8'));
 const server=createPrivateServer({config,directory:join(paths.base,'project','gabi-os','dist-private')});
 server.requestTimeout=150000;
 server.on('error',()=>{console.error('No se pudo iniciar la oficina privada en loopback:8790.');process.exitCode=1;});
 server.listen(8790,'127.0.0.1',()=>console.log('GABI OS · oficina privada lista para Tailscale Serve · sin acceso publico'));
}
