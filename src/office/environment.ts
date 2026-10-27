import type { TimePreview } from '../core/types';
export const timezone='America/Argentina/Buenos_Aires';
export type OfficePhase='morning'|'day'|'evening'|'night';
export function environment(date:Date,preview:TimePreview='real'){
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:timezone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date);
  let hour=Number(parts.find(p=>p.type==='hour')!.value)+Number(parts.find(p=>p.type==='minute')!.value)/60;
  if(preview!=='real')hour={morning:9,day:15,evening:21,night:2}[preview];
  const phase:OfficePhase=hour<6?'night':hour<12?'morning':hour<19?'day':'evening';
  const darkness=phase==='night'?.78:phase==='evening'?.12+(hour-19)/5*.57:phase==='morning'?Math.max(0,(7-hour)/1.3):0;
  const tint=phase==='night'?0x697e98:phase==='evening'?mix(0xffe5b7,0x8290a1,(hour-19)/5):phase==='morning'?mix(0x8794a0,0xffefd4,Math.min(1,(hour-6)/1.5)):0xffffff;
  const population=phase==='night'?0:phase==='evening'?Math.max(0,Math.ceil(8*(24-hour)/5)):8;
  return {phase,hour,darkness,tint,population,preview:preview!=='real'};
}
function mix(a:number,b:number,t:number){return [16,8,0].reduce((n,shift)=>n|(Math.round(((a>>shift)&255)*(1-t)+((b>>shift)&255)*t)<<shift),0);}
