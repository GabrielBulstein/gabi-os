import {readdir,readFile,mkdir,writeFile} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createInterface} from 'node:readline';
import {join,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {officePaths} from '../server/paths.mjs';
import {redact} from '../server/memory.mjs';

const paths=officePaths(),source=process.argv[2];
if(!source)throw new Error('Pass the restored state directory; never an active profile.');
const docs=[],seen=new Set();
function add(source,text,kind){
 text=redact(text).trim();
 if(!text)return;
 const key=createHash('sha256').update(text).digest('hex');
 if(seen.has(key))return;seen.add(key);docs.push({source,text,kind});
}
async function notes(folder){
 for(const entry of await readdir(folder,{withFileTypes:true})){
  if(entry.isSymbolicLink()||entry.name.startsWith('.')||['node_modules','media'].includes(entry.name))continue;
  const file=join(folder,entry.name);
  if(entry.isDirectory())await notes(file);
  else if(/\.(md|txt)$/i.test(entry.name)){const bytes=await readFile(file);if(bytes.length<1048576)add(relative(join(source,'workspace'),file).replaceAll('\\','/'),bytes.toString('utf8'),'note');}
 }
}
await notes(join(source,'workspace'));
let sessionFiles=0;
const sessionRoot=join(source,'agents','gabito','agent','codex-home','sessions');
async function* sessionPaths(dir){for(const entry of await readdir(dir,{withFileTypes:true}).catch(()=>[])){const file=join(dir,entry.name);if(entry.isDirectory())yield* sessionPaths(file);else if(entry.isFile()&&entry.name.endsWith('.jsonl'))yield file;}}
for await(const sessionFile of sessionPaths(sessionRoot)){
 sessionFiles++;
 let turn='',label='Conversación anterior';
 const lines=createInterface({input:createReadStream(sessionFile),crlfDelay:Infinity});
 for await(const line of lines){
  let row;try{row=JSON.parse(line);}catch{continue;}
  const message=row.type==='response_item'?row.payload:row.message;
  if(!['message','response_item'].includes(row.type)||message?.type&&message.type!=='message'||!message||!['user','assistant'].includes(message.role))continue;
  if(message.role==='assistant'&&message.channel!=='final')continue;
  if(message.role==='assistant'&&['toolUse','tool_use'].includes(message.stopReason))continue;
  let text=typeof message.content==='string'?message.content:(Array.isArray(message.content)?message.content:[]).filter(p=>['text','input_text','output_text'].includes(p.type)).map(p=>p.text||'').join('\n');
  text=text.replace(/(?:Conversation info|Sender) \(untrusted metadata\):\s*\x60{3}[\s\S]*?\x60{3}/g,'').replace(/\[message_id:[^\]]*\]/g,'').trim();
  if(!text)continue;
  if(message.role==='user'){
   if(turn)add(label,turn,'history');
   const date=new Date(row.timestamp??message.timestamp??0);
   label='Conversación anterior'+(Number.isFinite(date.getTime())?' · '+date.toISOString().slice(0,10):'');
   turn='Usuario: '+text.slice(0,6000);
  }else if(turn)turn+='\nGabito: '+text.slice(0,9000);
 }
 if(turn)add(label,turn,'history');
}
const destination=join(paths.base,'data','knowledge');
await mkdir(destination,{recursive:true,mode:0o700});
await writeFile(join(destination,'documents.json'),JSON.stringify({schema:1,sourceProfileActivated:false,documents:docs}));
console.log(JSON.stringify({documents:docs.length,noteDocuments:docs.filter(d=>d.kind==='note').length,historyDocuments:docs.filter(d=>d.kind==='history').length,sessionFiles}));

