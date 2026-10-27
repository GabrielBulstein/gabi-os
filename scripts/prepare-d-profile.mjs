import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {officePaths} from '../server/paths.mjs';
const p=officePaths();
const old='C:\\Users\\gabri\\AppData\\Local\\GabiOS';
for(const name of ['runtime','migration','runtime-original-snapshot','project']){
 const audit=JSON.parse(await readFile(join(p.base,'data','move-audit',name+'.json'),'utf8'));
 if(!audit.verified)throw new Error('The original copy is not verified: '+name);
}
function relocate(value){
 if(typeof value==='string'&&(value.toLowerCase()===old.toLowerCase()||value.toLowerCase().startsWith(old.toLowerCase()+'\\')))return join(p.base,'data',value.slice(old.length));
 if(Array.isArray(value))return value.map(relocate);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,relocate(item)]));
 return value;
}
const configPath=join(p.runtime,'openclaw.json');
const config=relocate(JSON.parse(await readFile(configPath,'utf8')));
config.logging={...config.logging,file:join(p.logs,'openclaw.log')};
await mkdir(p.logs,{recursive:true});
await writeFile(configPath,JSON.stringify(config,null,2));
for(const file of await readdir(p.migration))if(/^philco-transfer-.*\.json$/.test(file)){
 const path=join(p.migration,file);const receipt=relocate(JSON.parse(await readFile(path,'utf8')));
 await writeFile(path,JSON.stringify(receipt,null,2));
}
console.log(JSON.stringify({runtime:p.runtime,workspace:config.agents?.defaults?.workspace,logs:config.logging.file,migration:p.migration}));
