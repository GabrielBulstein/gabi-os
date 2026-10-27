import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {createChatService,validateMessage,gatewayConversation} from '../../server/chat.mjs';
import {buildMemoryIndex,retrieveMemory,redact} from '../../server/memory.mjs';
const documents=[{source:'fixture.md',text:'Mía: workshop. Materiales para comprar: papel azul y pegamento.',kind:'note'}];
async function temporary(t){const dir=await mkdtemp(join(process.platform==='win32'?'D:/GABI-OS/cache/tmp':tmpdir(),'chat-test-'));t.after(()=>rm(dir,{recursive:true,force:true}));return dir;}
test('retrieval handles accents, workshop aliases and preserves the recorded list',()=>{
 const found=retrieveMemory(buildMemoryIndex(documents),'¿Qué materiales debo comprar a Mia para su taller?');
 assert.equal(found.length,1);assert.equal(found[0].text,documents[0].text);
 assert.equal(retrieveMemory(buildMemoryIndex(documents),'receta empanadas').length,0);
 assert.ok(!redact('password=secretvalue sk-abcdefghijklmnop').includes('secretvalue'));
});
test('messages reject commands, extra fields, empty or excessive text',()=>{
 for(const text of ['/reset','','a'.repeat(4001)])assert.throws(()=>validateMessage({requestId:randomUUID(),text}));
 assert.throws(()=>validateMessage({requestId:randomUUID(),text:'hola',model:'astra'}));
});
test('conversation persists, deduplicates requests and does not call models on reads',async t=>{
 const directory=await temporary(t);let calls=0;
 const chat=await createChatService({directory,documents,transport:async req=>{calls++;assert.match(req.instructions,/papel azul/);return {text:'Papel azul y pegamento.',model:'fixture'};}});
 const payload={requestId:randomUUID(),text:'materiales de Mia workshop'};
 assert.equal(chat.status().agentResponseVerified,false);chat.history();assert.equal(calls,0);
 const first=await chat.send(payload);assert.equal(first.status.busy,false);assert.deepEqual((await chat.send(payload)).message,first.message);assert.equal(calls,1);
 const reopened=await createChatService({directory,documents,transport:async()=>{throw Error('must not call');}});
 assert.equal(reopened.history().messages.length,2);assert.equal(reopened.status().agentResponseVerified,true);assert.equal(reopened.status().actionsEnabled,false);
});
test('concurrent requests and uncertain replies never trigger an automatic retry',async t=>{
 const directory=await temporary(t);let release,calls=0;
 const wait=new Promise(resolve=>release=resolve);
 const chat=await createChatService({directory,documents,transport:async()=>{calls++;await wait;throw Error('interrupted');}});
 const payload={requestId:randomUUID(),text:'Mia workshop'},first=chat.send(payload);
 await assert.rejects(chat.send({requestId:randomUUID(),text:'otra'}),/busy/);
 release();await assert.rejects(first,/response_uncertain/);
 await assert.rejects(chat.send(payload),/response_uncertain/);assert.equal(calls,1);
 const reopened=await createChatService({directory,documents,transport:async()=>{calls++;}});
 await assert.rejects(reopened.send(payload),/response_uncertain/);assert.equal(calls,1);
});

