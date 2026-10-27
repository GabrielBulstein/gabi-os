import {officeBus,type Preferences} from '../core/types';
type Sound='step'|'keyboard'|'printer'|'coffee'|'select'|'paper';
// Original procedural chiptune and sound effects. No network audio or third-party recordings.
export class OfficeAudio {
  private context:AudioContext|null=null;
  private music:GainNode|null=null;
  private effects:GainNode|null=null;
  private timer:ReturnType<typeof setInterval>|null=null;
  private beat=0;private nextBeat=0;private lastSound=0;
  enabled=false;
  constructor(private preferences:Preferences){
    officeBus.addEventListener('sound',e=>this.sound((e as CustomEvent<Sound>).detail));
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden){this.clearTimer();void this.context?.suspend();}
      else if(this.enabled)void this.start().catch(()=>this.disable());
    });
  }
  setPreferences(p:Preferences){this.preferences=p;if(this.context){this.music!.gain.setTargetAtTime(p.musicVolume*.12,this.context.currentTime,.1);this.effects!.gain.setTargetAtTime(p.effectsVolume*.18,this.context.currentTime,.1);}}
  async toggle(){if(this.enabled){this.disable();return false;}await this.start();this.enabled=true;return true;}
  private async start(){
    if(!this.context){
      this.context=new AudioContext();this.music=this.context.createGain();this.effects=this.context.createGain();
      this.music.connect(this.context.destination);this.effects.connect(this.context.destination);this.setPreferences(this.preferences);
    }
    await this.context.resume();if(this.context.state!=='running')throw Error('Audio no disponible');
    this.clearTimer();this.nextBeat=this.context.currentTime+.08;this.schedule();this.timer=setInterval(()=>this.schedule(),150);
  }
  private clearTimer(){if(this.timer)clearInterval(this.timer);this.timer=null;}
  private disable(){this.enabled=false;this.clearTimer();void this.context?.suspend();officeBus.dispatchEvent(new CustomEvent('audio-state',{detail:false}));}
  private tone(frequency:number,start:number,duration:number,type:OscillatorType,gain:GainNode,volume=.35){
    const c=this.context!;const oscillator=c.createOscillator(),envelope=c.createGain();
    oscillator.type=type;oscillator.frequency.value=frequency;
    envelope.gain.setValueAtTime(0,start);envelope.gain.linearRampToValueAtTime(volume,start+.015);envelope.gain.exponentialRampToValueAtTime(.0001,start+duration);
    oscillator.connect(envelope);envelope.connect(gain);oscillator.start(start);oscillator.stop(start+duration+.02);
    oscillator.onended=()=>{oscillator.disconnect();envelope.disconnect();};
  }
  private schedule(){
    const c=this.context!;if(c.state!=='running')return;
    if(this.nextBeat<c.currentTime)this.nextBeat=c.currentTime+.05;
    const melody=[64,67,71,67,62,66,69,66,60,64,67,71,62,66,69,67];
    const bass=[48,48,43,43,45,45,47,47];
    while(this.nextBeat<c.currentTime+.35){
      const n=this.beat%16,frequency=440*2**((melody[n]-69)/12);
      this.tone(frequency,this.nextBeat,.38,'triangle',this.music!,.3);
      if(n%2===0)this.tone(440*2**((bass[Math.floor(n/2)]-69)/12),this.nextBeat,.65,'sine',this.music!,.5);
      this.nextBeat+=.375;this.beat++;
    }
  }
  sound(kind:Sound){
    const c=this.context;if(!this.enabled||!c||document.hidden||c.state!=='running'||this.preferences.effectsVolume===0)return;
    if(c.currentTime-this.lastSound<.13)return;this.lastSound=c.currentTime;
    const data:Record<Sound,[number,number,OscillatorType]>={step:[100,.05,'triangle'],keyboard:[780,.025,'square'],printer:[180,.5,'sawtooth'],coffee:[320,.35,'triangle'],select:[590,.09,'sine'],paper:[440,.06,'triangle']};
    const [f,d,t]=data[kind];this.tone(f,c.currentTime+.005,d,t,this.effects!,kind==='step'?.2:.3);
    if(kind==='select')this.tone(790,c.currentTime+.06,.12,'sine',this.effects!,.2);
  }
}
