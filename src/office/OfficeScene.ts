import Phaser from 'phaser';
import { characterSheet, FRAME_W, FRAME_H, frameIndex, modes } from '../art/characters';
import { floorArt, furnitureArt, type FurnitureKind } from '../art/pixel';
import { blockedCells, cellKey, findPath, iso, unproject, walkable, type Footprint } from './grid';
import { officeBus, select, type AnimationMode, type CharacterId, type OfficeCommand, type OfficeSelection, type OfficeStatus, type Point, type Preferences } from '../core/types';

type Actor = {
  id: CharacterId; cell: Point; sprite: Phaser.GameObjects.Sprite; shadow: Phaser.GameObjects.Ellipse;
  direction: number; mode: AnimationMode; route: Point[]; step: Point|null; progress: number;
  nextRoutine: number; actionUntil: number; destination: Point|null; arrival: AnimationMode; label: Phaser.GameObjects.Text;
};
type Hotspot = { id: OfficeSelection; point: Point; footprint?: Footprint };
const center={x:40,y:185};
const bounds={left:-465,right:560,top:-145,bottom:515};
const quotes=[
  'La oficina está bajo control. El control está en algún cajón.',
  'Primero el mate. Después vemos si el problema sigue siendo urgente.',
  'Presupuesto para café: estratégico. Presupuesto para quilombos: ilimitado.',
  'Le dejé lugar al Profe. A él se lo trata de usted, incluso en píxeles.',
];

export class OfficeScene extends Phaser.Scene {
  private prefs: Preferences;
  private actors=new Map<CharacterId,Actor>();
  private blocked=blockedCells();
  private hotspots:Hotspot[]=[];
  private selected:OfficeSelection|null=null;
  private ring!:Phaser.GameObjects.Ellipse;
  private following:CharacterId|null=null;
  private fitZoom=1;
  private pointerMap=new Map<number,{x:number;y:number;startX:number;startY:number;moved:boolean}>();
  private pinchDistance=0;
  private gestureWasPinch=false;
  private lastQuote=0;
  private quoteIndex=0;
  private textureVersion=0;
  private cleanups:(()=>void)[]=[];
  private ready=false;

  constructor(prefs:Preferences) {super('office');this.prefs=prefs;}
  create() {
    const floor=floorArt();this.textures.addCanvas('office-floor',floor.canvas);
    this.add.image(-480,-160,'office-floor').setOrigin(0).setScale(2).setDepth(-10000);
    const kinds:FurnitureKind[]=['desk','gabitoDesk','emptyDesk','meeting','plant','books','coffee','reception','frame'];
    for(const kind of kinds) this.textures.addCanvas(`prop-${kind}`,furnitureArt(kind).canvas);
    const prop=(kind:FurnitureKind,x:number,y:number,depthOffset=0)=>{
      const q=iso(x,y);return this.add.image(q.x,q.y,`prop-${kind}`).setOrigin(.5,160/280).setScale(2).setDepth(q.y+depthOffset);
    };
    prop('books',0,0,40);
    prop('desk',4,2,52);prop('gabitoDesk',1,3,46);
    prop('meeting',11,1,75);prop('emptyDesk',3,7,52);prop('emptyDesk',9,6,52);
    prop('emptyDesk',13,7,45).setScale(1.35); // reserved smaller recruitment station
    prop('coffee',13,10,52);prop('reception',3,11,55);
    for(const p of [{x:8,y:1},{x:0,y:6},{x:15,y:5},{x:1,y:11}]) prop('plant',p.x+.4,p.y+.4,20);
    prop('frame',.2,2.4,-100);
    this.hotspots=[
      {id:'desk',point:iso(5,3),footprint:{x:4,y:2,w:3,h:2}},
      {id:'thermos',point:{x:iso(2.65,4.15).x,y:iso(2.65,4.15).y-49}},
      {id:'coffee',point:iso(14,11),footprint:{x:13,y:10,w:2,h:2}},
      {id:'meeting',point:iso(12.5,2.5),footprint:{x:11,y:1,w:3,h:3}},
      {id:'frame',point:{x:iso(.2,2.4).x,y:iso(.2,2.4).y-44}},
    ];
    this.addCharacter('gabi',{x:6,y:5},0);
    this.addCharacter('gabito',{x:3,y:5},1);
    this.ring=this.add.ellipse(0,0,36,18,0xe8bc71,.16).setStrokeStyle(2,0xe8bc71,.95).setDepth(-1).setVisible(false);
    this.applyPreferences(this.prefs);
    this.resetCamera();this.bindPointers();
    const listener=(e:Event)=>this.handle((e as CustomEvent<OfficeCommand>).detail);
    officeBus.addEventListener('command',listener);this.cleanups.push(()=>officeBus.removeEventListener('command',listener));
    this.scale.on('resize',this.resize,this);this.cleanups.push(()=>this.scale.off('resize',this.resize,this));
    const visibility=()=>{if(document.hidden)this.game.loop.sleep();else this.game.loop.wake();};
    document.addEventListener('visibilitychange',visibility);this.cleanups.push(()=>document.removeEventListener('visibilitychange',visibility));
    this.events.once('shutdown',()=>this.cleanups.forEach(fn=>fn()));
    this.ready=true;this.publishStatus();
    this.game.canvas.setAttribute('aria-label','Mapa isométrico de la oficina. Arrastrá para explorar; tocá a Gabi o Gabito. Los controles accesibles están junto al mapa.');
    this.game.canvas.setAttribute('role','img');
    officeBus.dispatchEvent(new Event('ready'));
  }
  private addCharacter(id:CharacterId,cell:Point,direction:number) {
    const key=this.makeCharacterTexture(id);const q=iso(cell.x+.5,cell.y+.5);
    const shadow=this.add.ellipse(q.x,q.y,28,12,0x354538,.24);
    const sprite=this.add.sprite(q.x,q.y,key,0).setOrigin(.5,58/64);
    const label=this.add.text(q.x,q.y-67,id==='gabi'?'GABI':'GABITO',{fontFamily:'monospace',fontSize:'9px',color:'#f4e4bd',backgroundColor:'#39483c',padding:{x:5,y:3}}).setOrigin(.5,1).setVisible(false);
    this.actors.set(id,{id,cell:{...cell},sprite,shadow,label,direction,mode:'idle',route:[],step:null,progress:0,nextRoutine:this.time.now+6500+(id==='gabi'?5000:0),actionUntil:0,destination:null,arrival:'idle'});
    this.play(this.actors.get(id)!,'idle');
  }
  private makeCharacterTexture(id:CharacterId):string {
    const key=`${id}-${this.textureVersion}`;
    const sheet=characterSheet(id,this.prefs.appearance);
    const texture=this.textures.addCanvas(key,sheet)!;
    for(let row=0;row<modes.length*4;row++) for(let col=0;col<8;col++) texture.add(row*8+col,0,col*FRAME_W,row*FRAME_H,FRAME_W,FRAME_H);
    for(const mode of modes) for(let d=0;d<4;d++) this.anims.create({key:`${key}-${mode}-${d}`,frames:this.anims.generateFrameNumbers(key,{start:frameIndex(mode,d),end:frameIndex(mode,d,7)}),frameRate:mode==='walk'?9:mode==='idle'?3:6,repeat:-1});
    return key;
  }
  private play(a:Actor,mode:AnimationMode) {
    a.mode=mode;
    const key=`${a.sprite.texture.key}-${mode}-${a.direction}`;
    if(this.prefs.reducedMotion){a.sprite.stop();a.sprite.setFrame(frameIndex(mode,a.direction));}
    else a.sprite.play(key,true);
  }
  private occupancy(a:Actor) {
    const occupied=new Set(this.blocked);
    for(const other of this.actors.values()) if(other!==a) {
      occupied.add(cellKey(other.cell.x,other.cell.y));
      if(other.step) occupied.add(cellKey(other.step.x,other.step.y));
      if(other.destination)occupied.add(cellKey(other.destination.x,other.destination.y));
    }
    return occupied;
  }
  private travel(a:Actor,goal:Point,arrival:AnimationMode='idle') {
    // Commands during a step are deferred until its reserved cell is reached.
    const occupied=this.occupancy(a);
    const candidates=[goal,{x:goal.x-1,y:goal.y},{x:goal.x+1,y:goal.y},{x:goal.x,y:goal.y-1},{x:goal.x,y:goal.y+1}];
    const available=candidates.find(p=>walkable(p,occupied));
    if(!available)return;
    a.destination={...available};a.arrival=arrival;a.actionUntil=0;
    if(!a.step) this.plan(a);
  }
  private plan(a:Actor) {
    if(!a.destination)return;
    a.route=findPath(a.cell,a.destination,this.occupancy(a));
    if(a.cell.x===a.destination.x&&a.cell.y===a.destination.y) {a.destination=null;this.arrive(a);}
    else if(!a.route.length) { a.nextRoutine=this.time.now+1500; }
  }
  private arrive(a:Actor) {
    a.direction=a.arrival==='work'?2:0;
    this.play(a,a.arrival);a.actionUntil=this.time.now+6500;a.nextRoutine=this.time.now+10000;
  }
  update(time:number,delta:number) {
    if(!this.ready)return;
    const stepMs=this.prefs.reducedMotion?500:440;
    for(const a of this.actors.values()) {
      if(!a.step && a.route.length) {
        const next=a.route[0];
        if(this.occupancy(a).has(cellKey(next.x,next.y))) {a.route=[];a.nextRoutine=time+1000;}
        else {
          a.step=a.route.shift()!;a.progress=0;
          const dx=a.step.x-a.cell.x,dy=a.step.y-a.cell.y;
          a.direction=dx>0?1:dy>0?0:dx<0?3:2;this.play(a,'walk');
        }
      }
      if(a.step) {
        a.progress=Math.min(1,a.progress+Math.min(delta,60)/stepMs);
        const q=iso(a.cell.x+.5+(a.step.x-a.cell.x)*a.progress,a.cell.y+.5+(a.step.y-a.cell.y)*a.progress);
        a.sprite.setPosition(q.x,q.y);
        if(a.progress>=1) {
          a.cell={...a.step};a.step=null;
          if(a.destination) this.plan(a);
          else if(!a.route.length) {this.play(a,'idle');a.nextRoutine=time+7000;}
        }
      } else if(a.destination && !a.route.length && time>a.nextRoutine) {this.plan(a);a.nextRoutine=time+1500;}
      else if(!a.destination && !a.route.length && time>a.actionUntil && a.mode!=='idle') this.play(a,'idle');
      if(!this.prefs.reducedMotion && !a.step && !a.route.length && !a.destination && time>a.nextRoutine) {
        if(a.id==='gabito') {
          const stops=[{x:3,y:5},{x:7,y:4},{x:11,y:9},{x:12,y:11}];
          this.travel(a,stops[Math.floor(time/1000)%stops.length],'mate');
        } else {this.play(a,'wave');a.actionUntil=time+1800;}
        a.nextRoutine=time+15000;
      }
      a.sprite.setDepth(a.sprite.y+1);a.shadow.setPosition(a.sprite.x,a.sprite.y).setDepth(a.sprite.y-1);
      a.label.setPosition(a.sprite.x,a.sprite.y-63).setDepth(a.sprite.y+1000).setVisible(this.selected===a.id);
    }
    if(this.selected==='gabi'||this.selected==='gabito') {
      const a=this.actors.get(this.selected)!;this.ring.setPosition(a.sprite.x,a.sprite.y).setDepth(a.sprite.y-.5);
    }
    if(this.following) {const a=this.actors.get(this.following)!;this.cameras.main.centerOn(a.sprite.x,a.sprite.y-22);this.clampCamera();}
    if(this.prefs.humor && !document.hidden && time-this.lastQuote>55000) this.quote();
  }
  private quote() {
    this.lastQuote=this.time.now;
    officeBus.dispatchEvent(new CustomEvent('ambient',{detail:{kind:'ambient',character:'gabito',text:quotes[this.quoteIndex++%quotes.length]}}));
  }
  private handle(c:OfficeCommand) {
    if(c.type==='select') {this.selected=c.id;this.ring.setVisible(c.id==='gabi'||c.id==='gabito');select(c.id);}
    if(c.type==='preferences')this.applyPreferences(c.value);
    if(c.type==='camera') {
      if(c.action==='reset')this.resetCamera();
      if(c.action==='in'||c.action==='out')this.zoomAt(this.cameras.main.zoom*(c.action==='in'?1.25:.8),this.scale.width/2,this.scale.height/2);
      if(c.action==='follow'&&c.id) {this.following=c.id;this.cameras.main.setZoom(Math.max(this.cameras.main.zoom,1.4));}
      if(c.action==='stop')this.following=null;
      this.publishStatus();
    }
    if(c.type==='action') {
      const a=this.actors.get(c.id)!;
      if(c.action==='coffee')this.travel(a,{x:12,y:11},'mate');
      else if(c.action==='tour')this.travel(a,{x:a.cell.x>7?3:10,y:5},'wave');
      else if(c.action==='work')this.travel(a,c.id==='gabi'?{x:5,y:1}:{x:2,y:2},'work');
      else {
        if(a.step) {a.destination={...a.step};a.arrival=c.action;a.route=[];}
        else {a.route=[];a.destination=null;this.play(a,c.action);a.actionUntil=this.time.now+5000;a.nextRoutine=this.time.now+12000;}
      }
      if(c.id==='gabito'&&this.prefs.humor)this.quote();
    }
  }
  private applyPreferences(value:Preferences) {
    const changed=JSON.stringify(this.prefs.appearance)!==JSON.stringify(value.appearance);
    const reduceChanged=value.reducedMotion&&!this.prefs.reducedMotion;
    this.prefs=structuredClone(value);
    if(changed&&this.actors.has('gabi')) {
      const a=this.actors.get('gabi')!,old=a.sprite.texture.key;this.textureVersion++;
      a.sprite.stop();a.sprite.setTexture(this.makeCharacterTexture('gabi'));
      for(const mode of modes)for(let d=0;d<4;d++)this.anims.remove(`${old}-${mode}-${d}`);
      this.textures.remove(old);
    }
    for(const a of this.actors.values()) {
      if(reduceChanged){a.route=[];a.destination=null;if(!a.step)this.play(a,'idle');}
      this.play(a,a.mode);
    }
    const low=value.quality==='low'||(value.quality==='auto'&&window.innerWidth<600);
    // Phaser 3.90 reads the limit when its RAF loop wakes; keep this compatibility detail here.
    const limit=low?30:60;
    if(this.ready&&this.game.loop.fpsLimit!==limit) {
      this.game.loop.sleep();
      Object.assign(this.game.loop,{fpsLimit:limit,hasFpsLimit:true,_limitRate:1000/limit});
      this.game.loop.wake();
    }
    for(const a of this.actors.values())a.shadow.setVisible(!low);
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
    for(const a of [...this.actors.values()].sort((a,b)=>b.sprite.y-a.sprite.y)) {
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
