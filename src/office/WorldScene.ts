import Phaser from 'phaser';
import {characterSheet,FRAME_W,FRAME_H,frameIndex,modes} from '../art/characters';
import {floorArt,furnitureArt,screenLightArt,type FurnitureKind} from '../art/pixel';
import {iso,unproject,footprints,type Footprint} from './grid';
import {Crowd,type Walker} from './crowd';
import {environment} from './environment';
import {cast} from '../content/cast';
import {scenes} from '../content/scenes';
import {characterIds,officeBus,select,type AnimationMode,type CharacterId,type OfficeCommand,type OfficeSelection,type OfficeStatus,type Point,type Preferences,type SceneId} from '../core/types';

type Actor={id:CharacterId;walker:Walker;sprite:Phaser.GameObjects.Sprite;shadow:Phaser.GameObjects.Ellipse;label:Phaser.GameObjects.Text;direction:number;mode:AnimationMode;arrival:AnimationMode;actionUntil:number;nextRoutine:number;manualUntil:number;quoteCursor:number};
type Hotspot={id:OfficeSelection;point:Point;footprint?:Footprint};
const center={x:40,y:185},bounds={left:-465,right:560,top:-145,bottom:515};
const isCharacter=(id:OfficeSelection):id is CharacterId=>characterIds.includes(id as CharacterId);
export class OfficeScene extends Phaser.Scene{
  private prefs:Preferences;
  private actors=new Map<CharacterId,Actor>();
  private crowd=new Crowd();
  private hotspots:Hotspot[]=[];
  private selected:OfficeSelection|null=null;
  private ring!:Phaser.GameObjects.Ellipse;
  private following:CharacterId|null=null;
  private fitZoom=1;
  private pointerMap=new Map<number,{x:number;y:number;startX:number;startY:number;moved:boolean}>();
  private pinchDistance=0;private gestureWasPinch=false;
  private lastQuote=-10000;private lastScene=0;private sceneCursor=0;private textureVersion=0;
  private cleanups:(()=>void)[]=[];private ready=false;
  private surfaces:Phaser.GameObjects.Image[]=[];private details:Phaser.GameObjects.Image[]=[];
  private lamps:Phaser.GameObjects.Ellipse[]=[];
  private screens:Phaser.GameObjects.Image[]=[];
  private activeScene:{id:SceneId;started:number;announced:boolean}|null=null;
  private nextEnvironment=0;private light=environment(new Date());
  private welcomePending=false;
  private lastStepSound=0;private lastKeyboardSound=0;private routineCursor=0;
  private paper!:Phaser.GameObjects.Rectangle;
  constructor(preferences:Preferences){super('office');this.prefs=structuredClone(preferences);}
  create(){
    this.textures.addCanvas('office-floor',floorArt().canvas);
    this.surfaces.push(this.add.image(-480,-160,'office-floor').setOrigin(0).setScale(2).setDepth(-10000));
    const kinds:FurnitureKind[]=['desk','gabitoDesk','profeDesk','migueDesk','dexterDesk','nachoDesk','kevinDesk','meeting','plant','books','coffee','reception','frame','board','copier','fridge','diagram'];
    for(const kind of kinds)this.textures.addCanvas(`prop-${kind}`,furnitureArt(kind).canvas);
    const prop=(kind:FurnitureKind,x:number,y:number,depth=48,detail=false)=>{
      const p=iso(x,y),image=this.add.image(p.x,p.y,`prop-${kind}`).setOrigin(.5,160/280).setScale(2).setDepth(p.y+depth);
      this.surfaces.push(image);if(detail)this.details.push(image);
      if(kind.endsWith('Desk')||kind==='desk'||kind==='reception'){
        const key=`screen-${kind}`;if(!this.textures.exists(key))this.textures.addCanvas(key,screenLightArt(kind).canvas);
        this.screens.push(this.add.image(p.x,p.y,key).setOrigin(.5,160/280).setScale(2).setDepth(p.y+depth+.1).setAlpha(0));
      }
      return image;
    };
    prop('books',0,0,40);prop('desk',4,2,52);prop('gabitoDesk',1,3,46);
    prop('profeDesk',0,6,44);prop('board',0,6.6,10);
    prop('migueDesk',3,7,52);prop('dexterDesk',9,6,52);prop('diagram',11.8,5.9,10);
    prop('nachoDesk',13,7,45);prop('kevinDesk',10,10,46);
    prop('meeting',11,1,75);prop('coffee',13,10,52);prop('fridge',15,10,52);
    prop('reception',3,11,55);prop('copier',1,10,30);prop('frame',.2,2.4,-100);
    for(const p of [{x:8,y:1},{x:0,y:9},{x:15,y:5},{x:1,y:12}])prop('plant',p.x+.4,p.y+.4,20,true);
    this.hotspots=[
      {id:'desk',point:iso(5,3),footprint:{x:4,y:2,w:3,h:2}},
      {id:'thermos',point:{x:iso(2.65,4.15).x,y:iso(2.65,4.15).y-49}},
      {id:'coffee',point:iso(14,11),footprint:{x:13,y:10,w:2,h:2}},
      {id:'meeting',point:iso(12.5,2.5),footprint:{x:11,y:1,w:3,h:3}},
      {id:'board',point:{x:iso(.2,7.6).x,y:iso(.2,7.6).y-52}},
      {id:'copier',point:iso(1.5,10.5),footprint:{x:1,y:10,w:1,h:1}},
      {id:'reception',point:iso(4.5,11.5),footprint:{x:3,y:11,w:3,h:1}},
      {id:'frame',point:{x:iso(.2,2.4).x,y:iso(.2,2.4).y-44}},
    ];
    let welcomed=false;try{welcomed=sessionStorage.getItem('pixel-office:welcome')==='1';}catch{welcomed=true;}
    this.welcomePending=!welcomed&&this.prefs.welcome&&this.prefs.humor&&!this.prefs.reducedMotion&&environment(new Date(),this.prefs.timePreview).population>0;
    for(const id of characterIds)this.addCharacter(id,id==='gabi'&&this.welcomePending?{x:8,y:12}:cast[id].start);
    for(const [x,y]of[[6.5,2.4],[1.8,3.4],[3.8,7.4],[10,6.4],[13.8,10.5]]){
      const p=iso(x,y);this.lamps.push(this.add.ellipse(p.x,p.y-34,85,42,0xffd68c,0).setDepth(p.y+200).setBlendMode(Phaser.BlendModes.ADD));
    }
    const copier=iso(1.5,10.9);this.paper=this.add.rectangle(copier.x,copier.y-25,12,8,0xe9debd).setVisible(false).setDepth(copier.y+60);
    this.ring=this.add.ellipse(0,0,36,18,0xe8bc71,.16).setStrokeStyle(2,0xe8bc71,.95).setVisible(false);
    this.applyPreferences(this.prefs);this.resetCamera();this.bindPointers();
    const listener=(e:Event)=>this.handle((e as CustomEvent<OfficeCommand>).detail);
    officeBus.addEventListener('command',listener);this.cleanups.push(()=>officeBus.removeEventListener('command',listener));
    const line=(e:Event)=>{const detail=(e as CustomEvent<{speaker:CharacterId;reaction?:CharacterId}>).detail;for(const id of this.activeScene?scenes[this.activeScene.id].participants:[]){const a=this.actors.get(id)!;if(!a.walker.step&&!a.walker.goal)this.play(a,id===detail.speaker?'talk':'idle');}if(detail.reaction){const a=this.actors.get(detail.reaction)!;this.play(a,detail.reaction==='pame'?'look':'react');a.actionUntil=this.time.now+4000;}};
    officeBus.addEventListener('scene-line',line);this.cleanups.push(()=>officeBus.removeEventListener('scene-line',line));
    this.scale.on('resize',this.resize,this);this.cleanups.push(()=>this.scale.off('resize',this.resize,this));
    const visibility=()=>{if(document.hidden)this.game.loop.sleep();else{this.nextEnvironment=0;this.game.loop.wake();}};
    document.addEventListener('visibilitychange',visibility);this.cleanups.push(()=>document.removeEventListener('visibilitychange',visibility));
    this.events.once('shutdown',()=>this.cleanups.forEach(fn=>fn()));
    this.ready=true;this.refreshEnvironment();this.publishStatus();
    this.game.canvas.setAttribute('aria-label','Mapa isométrico de la oficina con ocho personajes. Arrastrá para explorar; también podés usar los botones de equipo y lugares.');this.game.canvas.setAttribute('role','img');
    officeBus.dispatchEvent(new Event('ready'));
    if(this.welcomePending){
      // Intro timing follows elapsed wall time, not the renderer's smoothed frame delta.
      const welcomeTimer=window.setTimeout(()=>{
        if(this.ready&&!document.hidden&&!this.activeScene&&this.selected===null&&this.prefs.welcome&&this.prefs.humor){
          this.startScene('welcome');try{sessionStorage.setItem('pixel-office:welcome','1');}catch{}
        }
      },3000);
      this.cleanups.push(()=>window.clearTimeout(welcomeTimer));
    }
  }
  private addCharacter(id:CharacterId,cell:Point){
    const key=this.makeCharacterTexture(id),p=iso(cell.x+.5,cell.y+.5);
    const shadow=this.add.ellipse(p.x,p.y,28,12,0x354538,.24),sprite=this.add.sprite(p.x,p.y,key,0).setOrigin(.5,58/64);
    const label=this.add.text(p.x,p.y-67,cast[id].name.toUpperCase(),{fontFamily:'monospace',fontSize:'9px',color:'#f4e4bd',backgroundColor:'#39483c',padding:{x:5,y:3}}).setOrigin(.5,1).setVisible(false);
    const a:Actor={id,walker:this.crowd.add(id,cell),sprite,shadow,label,direction:0,mode:'idle',arrival:'idle',actionUntil:0,nextRoutine:this.time.now+14000+characterIds.indexOf(id)*1700,manualUntil:0,quoteCursor:0};
    this.actors.set(id,a);this.play(a,id==='gabi'?'idle':id==='gabito'?'mate':id==='pame'?'look':'specialty');a.actionUntil=this.time.now+6500;
  }
  private makeCharacterTexture(id:CharacterId){
    const key=`${id}-${this.textureVersion}`,sheet=characterSheet(id,this.prefs.appearance),texture=this.textures.addCanvas(key,sheet)!;
    for(let row=0;row<modes.length*4;row++)for(let col=0;col<8;col++)texture.add(row*8+col,0,col*FRAME_W,row*FRAME_H,FRAME_W,FRAME_H);
    for(const mode of modes)for(let d=0;d<4;d++)this.anims.create({key:`${key}-${mode}-${d}`,frames:this.anims.generateFrameNumbers(key,{start:frameIndex(mode,d),end:frameIndex(mode,d,7)}),frameRate:mode==='walk'?9:mode==='idle'?3:6,repeat:-1});
    return key;
  }
  private play(a:Actor,mode:AnimationMode){
    a.mode=mode;a.sprite.setCrop(0,0,48,mode==='work'?48:64);
    if(this.prefs.reducedMotion){a.sprite.stop();a.sprite.setFrame(frameIndex(mode,a.direction));}
    else a.sprite.play(`${a.sprite.texture.key}-${mode}-${a.direction}`,true);
  }
  private travel(a:Actor,goal:Point,arrival:AnimationMode='idle'){
    a.arrival=arrival;a.actionUntil=0;
    if(!this.crowd.go(a.id,goal))a.nextRoutine=this.time.now+4000;
  }
  update(time:number,delta:number){
    if(!this.ready)return;
    if(time>this.nextEnvironment){this.refreshEnvironment();this.nextEnvironment=time+15000;}
    this.crowd.update(Math.min(delta,80),this.prefs.reducedMotion?500:440);
    let moving=false,working=false;
    for(const a of this.actors.values()){
      const w=a.walker;
      if(w.step){
        const dx=w.step.x-w.cell.x,dy=w.step.y-w.cell.y,d=dx>0?1:dy>0?0:dx<0?3:2;
        if(a.mode!=='walk'||d!==a.direction){a.direction=d;this.play(a,'walk');}
        const p=iso(w.cell.x+.5+dx*w.progress,w.cell.y+.5+dy*w.progress);a.sprite.setPosition(p.x,p.y);moving ||= a.sprite.visible;
      }else{
        const p=iso(w.cell.x+.5,w.cell.y+.5);a.sprite.setPosition(p.x,p.y);
        if(w.arrived){a.direction=0;this.play(a,a.arrival);a.actionUntil=time+8000;a.nextRoutine=time+16000+characterIds.indexOf(a.id)*900;}
        if(!w.goal&&time>a.actionUntil&&a.mode!=='idle'&&!this.inScene(a.id)){this.play(a,'idle');}
        if(!w.goal&&!this.prefs.reducedMotion&&time>a.nextRoutine&&!this.inScene(a.id)&&a.sprite.visible){
          const phase=this.routineCursor++%4;
          if(phase===0)this.travel(a,{x:12,y:10},'mate');
          else if(phase===1)this.travel(a,cast[a.id].home,'work');
          else if(phase===2){this.play(a,cast[a.id].routine);a.actionUntil=time+6000;}
          else this.travel(a,cast[a.id].start,a.id==='pame'?'look':'idle');
          a.nextRoutine=time+18000+characterIds.indexOf(a.id)*1100;
        }
      }
      const visible=characterIds.indexOf(a.id)<this.light.population||time<a.manualUntil||this.inScene(a.id);
      a.sprite.setVisible(visible);a.shadow.setPosition(a.sprite.x,a.sprite.y).setDepth(a.sprite.y-1).setVisible(visible&&this.game.loop.fpsLimit!==30);
      let depth=a.sprite.y+1+(a.mode==='work'?38:0);
      // Long counters cannot be sorted by their farthest corner alone: someone just in front must remain visible.
      const ax=w.cell.x+.5+(w.step?(w.step.x-w.cell.x)*w.progress:0),ay=w.cell.y+.5+(w.step?(w.step.y-w.cell.y)*w.progress:0);
      for(const f of footprints){
        const south=ay>=f.y+f.h&&ay<f.y+f.h+1.5&&ax>=f.x&&ax<=f.x+f.w;
        const east=ax>=f.x+f.w&&ax<f.x+f.w+1.5&&ay>=f.y&&ay<=f.y+f.h;
        if(south||east)depth=Math.max(depth,iso(f.x,f.y).y+f.w*16+f.h*16+2);
      }
      a.sprite.setDepth(depth);
      a.label.setPosition(a.sprite.x,a.sprite.y-63).setDepth(a.sprite.y+1000).setVisible(visible&&this.selected===a.id);
      working ||= visible&&a.mode==='work';
    }
    if(moving&&time-this.lastStepSound>430){this.lastStepSound=time;officeBus.dispatchEvent(new CustomEvent('sound',{detail:'step'}));}
    if(working&&time-this.lastKeyboardSound>1300){this.lastKeyboardSound=time;officeBus.dispatchEvent(new CustomEvent('sound',{detail:'keyboard'}));}
    if(this.selected&&isCharacter(this.selected)){const a=this.actors.get(this.selected)!;this.ring.setPosition(a.sprite.x,a.sprite.y).setDepth(a.sprite.y-.5).setVisible(a.sprite.visible);}
    if(this.following){const a=this.actors.get(this.following)!;this.cameras.main.centerOn(a.sprite.x,a.sprite.y-22);this.clampCamera();}
    if(this.activeScene&&!this.activeScene.announced){
      const data=scenes[this.activeScene.id];
      if(data.participants.every(id=>!this.actors.get(id)!.walker.goal)){this.activeScene.announced=true;officeBus.dispatchEvent(new CustomEvent('scene-ready',{detail:this.activeScene.id}));}
      else if(time-this.activeScene.started>24000){this.stopScene();officeBus.dispatchEvent(new Event('scene-failed'));}
    }
    const interval=this.prefs.humorFrequency==='low'?180000:90000;
    if(this.prefs.humor&&!this.prefs.reducedMotion&&this.light.population>4&&!this.activeScene&&time-this.lastScene>interval){const ids:SceneId[]=['budget','bugs','lesson','recruit'];this.startScene(ids[this.sceneCursor++%ids.length]);}
  }
  private inScene(id:CharacterId){return !!this.activeScene&&scenes[this.activeScene.id].participants.includes(id);}
  private quote(id:CharacterId){
    if(id==='gabi'||!this.prefs.humor)return;
    const a=this.actors.get(id)!,quotes=cast[id].quotes;
    this.lastQuote=this.time.now;officeBus.dispatchEvent(new CustomEvent('ambient',{detail:{kind:'ambient',character:id,text:quotes[a.quoteCursor++%quotes.length]}}));
  }
  private stopScene(){
    const welcome=this.activeScene?.id==='welcome';
    if(this.activeScene)for(const id of scenes[this.activeScene.id].participants){const a=this.actors.get(id)!;this.crowd.cancel(id);a.arrival='idle';this.play(a,'idle');a.nextRoutine=this.time.now+16000;}
    this.activeScene=null;this.lastScene=this.time.now;officeBus.dispatchEvent(new Event('scene-stopped'));
    if(welcome&&!this.prefs.reducedMotion)this.travel(this.actors.get('gabi')!,cast.gabi.home,'work');
  }
  private startScene(id:SceneId){
    if(!this.prefs.humor)return;
    this.stopScene();this.activeScene={id,started:this.time.now,announced:false};
    const data=scenes[id];data.participants.forEach((who,i)=>{const a=this.actors.get(who)!;a.manualUntil=this.time.now+180000;this.travel(a,data.spots[i],who==='pame'?'look':'idle');});
    if(id==='printer'){
      officeBus.dispatchEvent(new CustomEvent('sound',{detail:'printer'}));this.paper.setVisible(true);
      if(!this.prefs.reducedMotion)this.tweens.add({targets:this.paper,y:this.paper.y+8,duration:250,yoyo:true,repeat:5,onComplete:()=>this.paper.setVisible(false)});
      else this.time.delayedCall(1800,()=>this.paper.setVisible(false));
    }
    officeBus.dispatchEvent(new CustomEvent('scene-started',{detail:id}));
  }
  private handle(c:OfficeCommand){
    if(c.type==='select'){
      this.selected=c.id;this.ring.setVisible(isCharacter(c.id));if(isCharacter(c.id))this.actors.get(c.id)!.manualUntil=this.time.now+120000;
      select(c.id);officeBus.dispatchEvent(new CustomEvent('sound',{detail:'select'}));
      if(isCharacter(c.id)&&this.light.population===0)officeBus.dispatchEvent(new Event('manual-preview'));
    }
    if(c.type==='preferences')this.applyPreferences(c.value);
    if(c.type==='scene')this.startScene(c.id);
    if(c.type==='stop-scene')this.stopScene();
    if(c.type==='camera'){
      if(c.action==='reset')this.resetCamera();
      if(c.action==='in'||c.action==='out')this.zoomAt(this.cameras.main.zoom*(c.action==='in'?1.25:.8),this.scale.width/2,this.scale.height/2);
      if(c.action==='follow'&&c.id){this.following=c.id;this.actors.get(c.id)!.manualUntil=this.time.now+180000;this.cameras.main.setZoom(Math.max(this.cameras.main.zoom,1.4));}
      if(c.action==='stop')this.following=null;this.publishStatus();
    }
    if(c.type==='action'){
      if(this.inScene(c.id))this.stopScene();
      const a=this.actors.get(c.id)!;a.manualUntil=this.time.now+180000;
      if(this.light.population===0)officeBus.dispatchEvent(new Event('manual-preview'));
      if(c.action==='coffee'){this.travel(a,{x:12,y:10},'mate');officeBus.dispatchEvent(new CustomEvent('sound',{detail:'coffee'}));}
      else if(c.action==='tour')this.travel(a,{x:a.walker.cell.x>7?3:8,y:5},'wave');
      else if(c.action==='work')this.travel(a,cast[c.id].home,'work');
      else{this.crowd.cancel(c.id);a.arrival=c.action;this.play(a,c.action);a.actionUntil=this.time.now+6000;a.nextRoutine=this.time.now+18000;}
      if(!this.activeScene&&this.time.now-this.lastQuote>1000)this.quote(c.id);
    }
  }
  private refreshEnvironment(){
    this.light=environment(new Date(),this.prefs.timePreview);
    for(const image of this.surfaces)image.setTint(this.light.tint);
    for(const a of this.actors.values())a.sprite.setTint(this.light.tint);
    const low=this.prefs.quality==='low'||(this.prefs.quality==='auto'&&innerWidth<600);
    for(const lamp of this.lamps)lamp.setAlpha(this.prefs.details&&!low?this.light.darkness*.22:0);
    for(const screen of this.screens)screen.setAlpha(this.light.darkness*.8);
    for(const detail of this.details)detail.setAlpha(this.prefs.details?1:.65);
    document.body.dataset.phase=this.light.phase;
    officeBus.dispatchEvent(new CustomEvent('environment',{detail:this.light}));
  }
  private applyPreferences(value:Preferences){
    const changed=JSON.stringify(this.prefs.appearance)!==JSON.stringify(value.appearance),reduceChanged=value.reducedMotion&&!this.prefs.reducedMotion;
    this.prefs=structuredClone(value);
    if(changed&&this.actors.has('gabi')){
      const a=this.actors.get('gabi')!,old=a.sprite.texture.key;this.textureVersion++;a.sprite.stop();a.sprite.setTexture(this.makeCharacterTexture('gabi'));
      for(const mode of modes)for(let d=0;d<4;d++)this.anims.remove(`${old}-${mode}-${d}`);this.textures.remove(old);
    }
    if(!value.humor&&this.activeScene)this.stopScene();
    for(const a of this.actors.values()){if(reduceChanged){this.crowd.cancel(a.id);a.arrival='idle';if(!a.walker.step)this.play(a,'idle');}this.play(a,a.mode);}
    const low=value.quality==='low'||(value.quality==='auto'&&innerWidth<600),limit=low?30:60;
    if(this.ready&&this.game.loop.fpsLimit!==limit){this.game.loop.sleep();Object.assign(this.game.loop,{fpsLimit:limit,hasFpsLimit:true,_limitRate:1000/limit});this.game.loop.wake();}
    if(this.ready)this.refreshEnvironment();
  }
  private resize() {if(this.ready)this.resetCamera();}
  private resetCamera() {
    this.following=null;
    this.fitZoom=Math.min((this.scale.width-32)/1000,(this.scale.height-16)/650,1.5);
    this.cameras.main.setZoom(this.fitZoom).centerOn(center.x,center.y);this.clampCamera();this.publishStatus();
  }
  private clampCamera() {
    const c=this.cameras.main,vw=this.scale.width/c.zoom,vh=this.scale.height/c.zoom;
    c.scrollX=(vw>bounds.right-bounds.left ? center.x : Phaser.Math.Clamp(c.scrollX+this.scale.width/2,bounds.left+vw/2,bounds.right-vw/2))-this.scale.width/2;
    c.scrollY=(vh>bounds.bottom-bounds.top ? center.y : Phaser.Math.Clamp(c.scrollY+this.scale.height/2,bounds.top+vh/2,bounds.bottom-vh/2))-this.scale.height/2;
  }
  private zoomAt(zoom:number,x:number,y:number) {
    const c=this.cameras.main;
    // Phaser zoom is centered on the viewport center, not the top-left.
    const before={x:c.scrollX+this.scale.width/2+(x-this.scale.width/2)/c.zoom,y:c.scrollY+this.scale.height/2+(y-this.scale.height/2)/c.zoom};
    c.setZoom(Phaser.Math.Clamp(zoom,this.fitZoom,3));
    c.scrollX=before.x-this.scale.width/2-(x-this.scale.width/2)/c.zoom;
    c.scrollY=before.y-this.scale.height/2-(y-this.scale.height/2)/c.zoom;
    this.clampCamera();this.publishStatus();
  }
  private tap(x:number,y:number) {
    const c=this.cameras.main;
    const w={x:c.scrollX+this.scale.width/2+(x-this.scale.width/2)/c.zoom,y:c.scrollY+this.scale.height/2+(y-this.scale.height/2)/c.zoom};
    for(const a of [...this.actors.values()].filter(a=>a.sprite.visible).sort((a,b)=>b.sprite.y-a.sprite.y)) {
      if(Math.abs(w.x-a.sprite.x)<Math.max(19,20/c.zoom) && w.y>a.sprite.y-Math.max(60,45/c.zoom) && w.y<a.sprite.y+10) {this.handle({type:'select',id:a.id});return;}
    }
    for(const h of this.hotspots.filter(h=>!h.footprint)) if(Phaser.Math.Distance.Between(w.x,w.y,h.point.x,h.point.y)<Math.max(15,18/c.zoom)) {this.handle({type:'select',id:h.id});return;}
    const tile=unproject(w.x,w.y+30);
    for(const h of this.hotspots) if(h.footprint) {
      const f=h.footprint;if(tile.x>=f.x&&tile.x<f.x+f.w&&tile.y>=f.y&&tile.y<f.y+f.h){this.handle({type:'select',id:h.id});return;}
    }
  }
  private bindPointers() {
    const canvas=this.game.canvas;
    const local=(e:PointerEvent|WheelEvent)=>{const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
    const down=(e:PointerEvent)=>{
      if(e.button!==0)return;
      const p=local(e);canvas.setPointerCapture(e.pointerId);
      if(this.pointerMap.size===0)this.gestureWasPinch=false;
      this.pointerMap.set(e.pointerId,{...p,startX:p.x,startY:p.y,moved:false});
      if(this.pointerMap.size===2){this.gestureWasPinch=true;const [a,b]=[...this.pointerMap.values()];this.pinchDistance=Math.hypot(a.x-b.x,a.y-b.y);}
    };
    const move=(e:PointerEvent)=>{
      const old=this.pointerMap.get(e.pointerId);if(!old)return;
      const p=local(e),dx=p.x-old.x,dy=p.y-old.y;
      old.moved ||= Math.hypot(p.x-old.startX,p.y-old.startY)>7;
      old.x=p.x;old.y=p.y;
      if(this.pointerMap.size>=2) {
        const [a,b]=[...this.pointerMap.values()],dist=Math.hypot(a.x-b.x,a.y-b.y);
        if(this.pinchDistance>0)this.zoomAt(this.cameras.main.zoom*dist/this.pinchDistance,(a.x+b.x)/2,(a.y+b.y)/2);
        this.pinchDistance=dist;this.following=null;
      } else if(old.moved) {
        this.following=null;this.cameras.main.scrollX-=dx/this.cameras.main.zoom;this.cameras.main.scrollY-=dy/this.cameras.main.zoom;this.clampCamera();this.publishStatus();
      }
    };
    const up=(e:PointerEvent)=>{
      const p=this.pointerMap.get(e.pointerId);
      if(p&&!p.moved&&!this.gestureWasPinch&&e.type==='pointerup')this.tap(p.x,p.y);
      this.pointerMap.delete(e.pointerId);this.pinchDistance=0;
    };
    const wheel=(e:WheelEvent)=>{e.preventDefault();this.following=null;const p=local(e);this.zoomAt(this.cameras.main.zoom*Math.exp(-e.deltaY*.0012),p.x,p.y);};
    for(const [name,fn] of [['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',up],['lostpointercapture',up],['wheel',wheel]] as const) {
      canvas.addEventListener(name,fn as EventListener,{passive:false});this.cleanups.push(()=>canvas.removeEventListener(name,fn as EventListener));
    }
  }
  private publishStatus() {
    const detail:OfficeStatus={following:this.following,zoom:this.cameras.main.zoom,ready:this.ready};officeBus.dispatchEvent(new CustomEvent('status',{detail}));
  }
}
