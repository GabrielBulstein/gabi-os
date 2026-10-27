import {win32,posix} from 'node:path';
import {homedir} from 'node:os';

export function officePaths(platform=process.platform,env=process.env,userHome=homedir()){
  const path=platform==='win32'?win32:posix;
  const base=path.resolve(env.GABI_OS_HOME||(platform==='win32'?'D:\\GABI-OS':path.join(userHome,'.local','share','gabi-os')));
  if(platform==='win32'&&path.parse(base).root.toUpperCase()!=='D:\\')throw new Error('GABI OS debe guardar sus datos en D:. Revisá GABI_OS_HOME.');
  return {base,runtime:path.join(base,'data','runtime'),migration:path.join(base,'data','migration'),
    cache:path.join(base,'cache'),temp:path.join(base,'cache','tmp'),logs:path.join(base,'data','logs'),
    cli:env.GABI_OPENCLAW_ENTRY||path.join(base,'tools','openclaw-2026.10.1','node_modules','openclaw','openclaw.mjs')};
}
