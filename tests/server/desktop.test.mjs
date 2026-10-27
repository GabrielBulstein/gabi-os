import {test} from 'node:test';
import assert from 'node:assert/strict';
import {request} from 'node:http';
import {createDesktopServer,desktopStatus} from '../../server/desktop.mjs';

test('gateway liveness never asserts an agent response or permits tasks',async()=>{
  const result=await desktopStatus(async()=>new Response(JSON.stringify({ok:true,token:'never export',channels:['private']}),{headers:{'Content-Type':'application/json'}}));
  assert.equal(result.gateway,'live');assert.equal(result.agentResponseVerified,false);assert.equal(result.taskSubmission,false);
  assert.ok(result.memory.totalMB>0);assert.ok(!JSON.stringify(result).includes('never export'));assert.ok(!JSON.stringify(result).includes('channels'));
});
test('offline, invalid and HTML responses do not report a live gateway',async()=>{
  for(const fetcher of [async()=>{throw new Error('offline');},async()=>new Response('<html/>'),async()=>new Response('{bad',{headers:{'Content-Type':'application/json'}})]){
    assert.notEqual((await desktopStatus(fetcher)).gateway,'live');
  }
});
test('loopback API rejects foreign origins, rebound hosts and mutations; coalesces reads',async t=>{
  let calls=0;
  const server=createDesktopServer(async()=>{calls++;return {schema:1,host:'desktop'};});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const port=server.address().port;
  const call=(headers={},method='GET',path='/status')=>new Promise((resolve,reject)=>{
    const req=request({hostname:'127.0.0.1',port,path,method,headers},res=>{let body='';res.on('data',b=>body+=b);res.on('end',()=>resolve({status:res.statusCode,body,headers:res.headers}));});req.on('error',reject);req.end();
  });
  assert.equal((await call({Origin:'https://evil.example'})).status,403);
  assert.equal((await call({Host:`evil.example:${port}`})).status,403);
  assert.equal((await call({},'POST')).status,405);
  assert.equal((await call({},'GET','/tasks')).status,404);
  assert.equal(calls,0);
  const reads=await Promise.all([call(),call({Origin:'http://localhost:5173'})]);
  assert.equal(reads[0].status,200);assert.equal(reads[0].headers['cache-control'],'no-store');assert.equal(calls,1);
});
