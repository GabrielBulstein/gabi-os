import {mkdir,readFile,writeFile,access} from 'node:fs/promises';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';
import {officePaths} from './paths.mjs';

// Private runtime lives outside Git/OneDrive. Never reuse the default OpenClaw profile.
const paths=officePaths();
const root=paths.runtime;
const configPath=join(root,'openclaw.json');
const login=process.argv.includes('--login');
const check=process.argv.includes('--check');
const cli=paths.cli;
if(!cli)throw new Error('Definí GABI_OPENCLAW_ENTRY con la ruta del openclaw.mjs instalado.');
await access(cli);
await mkdir(root,{recursive:true,mode:0o700});
await Promise.all([paths.temp,paths.logs,join(paths.cache,'npm'),join(paths.cache,'node')].map(path=>mkdir(path,{recursive:true,mode:0o700})));
let config;
try{config=JSON.parse(await readFile(configPath,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
if(!config){
  config={gateway:{mode:'local',port:18799,bind:'loopback',auth:{mode:'token',token:randomBytes(32).toString('hex')}},
    agents:{defaults:{workspace:join(root,'workspace')}},channels:{},plugins:{enabled:false}};
  await writeFile(configPath,JSON.stringify(config,null,2),{flag:'wx',mode:0o600});
}
const allowedPlugins=config.plugins?.enabled===false||(config.plugins?.enabled===true&&Array.isArray(config.plugins.allow)&&config.plugins.allow.every(id=>['openai','codex'].includes(id)));
if(config.gateway?.port!==18799||config.gateway?.bind!=='loopback'||config.gateway?.auth?.mode!=='token'||!config.gateway.auth.token||Object.keys(config.channels??{}).length||!allowedPlugins){
  throw new Error('El perfil dejó de ser aislado. Revisá su configuración local antes de iniciarlo.');
}
if(login||config.plugins?.enabled===true){
  // Native Codex plugin capture hits EEXIST symlink errors on this Windows host.
  // The documented embedded runtime also supports the saved ChatGPT OAuth profile.
  await writeFile(join(root,'openclaw.before-chatgpt.json'),JSON.stringify(config,null,2),{flag:'wx',mode:0o600}).catch(error=>{if(error.code!=='EEXIST')throw error;});
  config.plugins={enabled:true,allow:['openai'],entries:{openai:{enabled:true},codex:{enabled:false}}};
  const model=config.agents?.defaults?.model?.primary;
  if(typeof model==='string'&&model.startsWith('openai/')){
    config.agents.defaults.models??={};
    config.agents.defaults.models[model]={...config.agents.defaults.models[model],agentRuntime:{id:'openclaw'}};
  }
  await writeFile(configPath,JSON.stringify(config,null,2),{mode:0o600});
}
const env={};
// Explicit allowlist avoids importing channel/provider credentials from the parent shell.
for(const key of ['PATH','Path','SystemRoot','WINDIR','COMSPEC','PATHEXT','APPDATA','LOCALAPPDATA','USERPROFILE','HOME','TEMP','TMP','LANG'])if(process.env[key])env[key]=process.env[key];
Object.assign(env,{OPENCLAW_STATE_DIR:root,OPENCLAW_CONFIG_PATH:configPath});
Object.assign(env,{TEMP:paths.temp,TMP:paths.temp,NPM_CONFIG_CACHE:join(paths.cache,'npm'),NODE_COMPILE_CACHE:join(paths.cache,'node')});
console.log(check?'GABI OS · Verificando el proveedor con una consulta breve.':login?'GABI OS · Iniciá sesión con ChatGPT en el navegador. No compartas credenciales por chat.':'GABI OS · gateway aislado en 127.0.0.1:18799. Sin canales de mensajería. Ctrl+C para detener.');
const args=check?['models','status','--json','--probe','--probe-provider','openai','--probe-max-tokens','16','--probe-timeout','20000','--probe-concurrency','1']:login?['models','auth','login','--provider','openai','--set-default']:['--log-level','error','gateway','run','--port','18799','--bind','loopback'];
const child=spawn(process.execPath,[cli,...args],{env,cwd:root,stdio:check?['ignore','pipe','ignore']:'inherit',windowsHide:true,...check?{timeout:90000}:{} });
let output='';
if(check)child.stdout.on('data',chunk=>{if(output.length<1048576)output+=chunk.toString();});
child.on('error',()=>{console.error('No se pudo iniciar OpenClaw.');process.exitCode=1;});
child.on('exit',code=>{
  process.exitCode=code??1;
  if(check){
    try{
      const result=JSON.parse(output);
      const results=result.auth?.probes?.results??[];
      // Never echo the complete status: it can contain account identifiers or token hints.
      console.log(JSON.stringify({model:result.defaultModel,authenticationVerified:results.length>0&&results.every(p=>p.status==='ok'),probes:results.map(p=>({provider:p.provider,status:p.status})),agentResponseVerified:false}));
      if(!results.length||results.some(p=>p.status!=='ok'))process.exitCode=1;
    }catch{console.error('No se pudo verificar el proveedor. Los detalles privados no se muestran.');process.exitCode=1;}
  }
});
process.on('SIGINT',()=>child.kill('SIGINT'));
process.on('SIGTERM',()=>child.kill('SIGTERM'));
