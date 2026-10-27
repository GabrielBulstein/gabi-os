import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDesktopServer} from '../../server/desktop.mjs';
test('chat requires local origin and ephemeral token, and rejects large or malformed bodies',async t=>{
 let calls=0;const chat={status:()=>({available:true}),history:()=>({messages:[]}),send:async()=>{calls++;return {ok:true};}};
 const server=createDesktopServer(undefined,{chat});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const url='http://127.0.0.1:'+server.address().port;
 assert.equal((await fetch(url+'/chat/session',{headers:{Origin:'https://foreign.test'}})).status,403);
 assert.equal((await fetch(url+'/chat/history')).status,403);
 const {token}=await (await fetch(url+'/chat/session')).json();
 const headers={'X-Gabi-Session':token,'Content-Type':'application/json',Origin:'http://localhost:5173'};
 assert.equal((await fetch(url+'/chat/send',{method:'POST',headers:{...headers,Origin:''},body:'{}'})).status,403);
 assert.equal((await fetch(url+'/chat/send',{method:'POST',headers,body:'x'.repeat(25000)})).status,413);
 assert.equal((await fetch(url+'/chat/send',{method:'POST',headers,body:'bad'})).status,400);
 assert.equal(calls,0);
 assert.equal((await fetch(url+'/chat/send',{method:'POST',headers,body:'{}'})).status,200);assert.equal(calls,1);
});

