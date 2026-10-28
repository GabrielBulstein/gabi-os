import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {officePaths} from '../server/paths.mjs';
import {validatePrivateAccess} from '../server/private.mjs';
const paths=officePaths(),cli=join(paths.base,'tools','tailscale','tailscale.exe'),run=promisify(execFile);
async function tailscale(args){return (await run(cli,args,{windowsHide:true,timeout:45000,maxBuffer:1048576})).stdout;}
const status=JSON.parse(await tailscale(['status','--json']));
if(status.BackendState!=='Running')throw new Error('Inicia sesion en Tailscale en esta PC.');
const host=String(status.Self?.DNSName||'').replace(/\.$/,'');
const login=status.User?.[status.Self?.UserID]?.LoginName;
const config={schema:1,host,login};
validatePrivateAccess(config);
const previous=JSON.parse(await tailscale(['serve','status','--json']));
if(Object.values(previous.AllowFunnel||{}).some(Boolean))throw new Error('Hay una configuracion publica previa; revisala antes de continuar.');
const services=Object.values(previous.Web||{}).flatMap(web=>Object.values(web.Handlers||{}));
if(services.some(handler=>handler.Proxy!=='http://127.0.0.1:8790'))throw new Error('Existe una configuracion Serve ajena. No se reemplazo.');
const root=join(paths.base,'data','run');await mkdir(root,{recursive:true});
await writeFile(join(root,'tailscale-serve-before.json'),JSON.stringify(previous));
await writeFile(join(root,'private-access.json'),JSON.stringify(config,null,2));
try{const result=await tailscale(['serve','--bg','--https=443','--yes','http://127.0.0.1:8790']);console.log(result.trim());}
catch(error){console.log('La configuracion privada esta preparada. Tailscale puede requerir habilitar HTTPS:');console.log(String(error.stdout||error.stderr||error.message));process.exitCode=1;}
console.log('Oficina privada: https://'+host+'/gabi-os/');
