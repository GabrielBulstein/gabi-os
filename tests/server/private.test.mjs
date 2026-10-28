import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {request} from 'node:http';
import {createPrivateServer,validatePrivateAccess} from '../../server/private.mjs';
test('private config requires a Tailscale hostname and an explicit user',()=>{
 for(const config of [{schema:1,host:'example.com',login:'owner'},{schema:1,host:'office.tailnet.ts.net',login:''}])assert.throws(()=>validatePrivateAccess(config));
});
test('private office enforces identity, host, origin, static confinement and bounded API forwarding',async t=>{
 const directory=await mkdtemp(join(process.platform==='win32'?'D:/GABI-OS/cache/tmp':tmpdir(),'private-test-'));
 t.after(()=>rm(directory,{recursive:true,force:true}));
 await writeFile(join(directory,'index.html'),'<title>Office fixture</title>');await mkdir(join(directory,'assets'));await writeFile(join(directory,'assets','fixture.js'),'export const fixture=true;');
 let calls=0;
 const config={schema:1,host:'office.tailnet.ts.net',login:'owner@example.com'};
 const server=createPrivateServer({config,directory,upstream:async(url,options)=>{calls++;assert.equal(url,'http://127.0.0.1:8787/chat/send');assert.equal(options.headers.Origin,'http://localhost:5173');assert.equal(options.headers['X-Gabi-Session'],'fixture-token');return new Response('{"fixture":true}',{status:200});}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
 const headers={Host:config.host,'Tailscale-User-Login':config.login};
 const call=(path,extra={},method='GET',body='')=>new Promise((resolve,reject)=>{
  const req=request({hostname:'127.0.0.1',port:server.address().port,path,method,headers:{...headers,...extra}},res=>{let body='';res.on('data',chunk=>body+=chunk);res.on('end',()=>resolve({status:res.statusCode,body,headers:res.headers}));});req.on('error',reject);req.end(body);
 });
 assert.equal((await call('/gabi-os/',{'Tailscale-User-Login':''})).status,403);
 assert.equal((await call('/gabi-os/',{'Tailscale-User-Login':'other@example.com'})).status,403);
 assert.equal((await call('/gabi-os/',{Host:'evil.test'})).status,403);
 assert.equal((await call('/gabi-os/',{Origin:'https://evil.test'})).status,403);
 const index=await call('/gabi-os/');assert.equal(index.status,200);assert.match(index.body,/Office fixture/);assert.equal(index.headers['cache-control'],'no-store');
 assert.equal((await call('/gabi-os/assets/fixture.js')).status,200);
 assert.notEqual((await call('/gabi-os/%2e%2e/private-access.json')).status,200);
 assert.equal((await call('/__desktop/chat/send',{},'POST','{}')).status,403);
 const post={Origin:'https://'+config.host,'Content-Type':'application/json','X-Gabi-Session':'fixture-token'};
 assert.equal((await call('/__desktop/chat/send',{...post,'Content-Length':'25000'},'POST','x'.repeat(25000))).status,413);
 assert.equal(calls,0);
 assert.equal((await call('/__desktop/chat/send',post,'POST','{}')).status,200);assert.equal(calls,1);
 assert.equal((await call('/__desktop/arbitrary',post,'POST','{}')).status,404);
});
