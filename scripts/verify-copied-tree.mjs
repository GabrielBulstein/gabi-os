import {readdir,writeFile,mkdir} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {join,relative,dirname} from 'node:path';

const [source,target,report,excluded='']=process.argv.slice(2);
if(!source||!target||!report)throw new Error('Expected source, target and private report path.');
const exclude=new Set(excluded.split(',').filter(Boolean));
async function inventory(root){
  const files=new Map(),links=[];
  async function walk(directory){
    for(const entry of await readdir(directory,{withFileTypes:true})){
      const path=join(directory,entry.name),key=relative(root,path).replaceAll('\\','/');
      if(entry.isSymbolicLink()){links.push(key);continue;}
      if(entry.isDirectory()){if(!exclude.has(entry.name))await walk(path);continue;}
      const hash=createHash('sha256');let bytes=0;
      for await(const chunk of createReadStream(path)){hash.update(chunk);bytes+=chunk.length;}
      files.set(key,{bytes,sha256:hash.digest('hex')});
    }
  }
  await walk(root);return {files,links};
}
const before=await inventory(source),after=await inventory(target);
const mismatches=[...before.files].filter(([key,value])=>JSON.stringify(after.files.get(key))!==JSON.stringify(value)).map(([key])=>key);
const extras=[...after.files.keys()].filter(key=>!before.files.has(key));
const result={source,target,verified:!mismatches.length&&!extras.length,files:before.files.size,
  bytes:[...before.files.values()].reduce((sum,value)=>sum+value.bytes,0),skippedLinks:before.links,mismatches,extras,manifest:Object.fromEntries(before.files)};
await mkdir(dirname(report),{recursive:true});await writeFile(report,JSON.stringify(result,null,2));
console.log(JSON.stringify({verified:result.verified,files:result.files,bytes:result.bytes,skippedLinks:result.skippedLinks.length,mismatches:mismatches.length,extras:extras.length}));
if(!result.verified)process.exitCode=1;
