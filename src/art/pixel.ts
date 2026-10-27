import { iso } from '../office/grid';
export type Color = string;
export type Vertex = [number, number];

/** Original code-native pixel artwork. Draw at half resolution: every source pixel is 2 world units. */
export class PixelPainter {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  constructor(public width: number, public height: number, public ox: number, public oy: number) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width / 2; this.canvas.height = height / 2;
    this.ctx = this.canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
  }
  poly(vertices: Vertex[], color: Color) {
    const c=this.ctx; c.fillStyle=color; c.beginPath();
    vertices.forEach(([x,y],i)=>i ? c.lineTo((x+this.ox)/2,(y+this.oy)/2) : c.moveTo((x+this.ox)/2,(y+this.oy)/2));
    c.closePath(); c.fill();
  }
  rect(x:number,y:number,w:number,h:number,color:Color) {
    this.ctx.fillStyle=color; this.ctx.fillRect(Math.round((x+this.ox)/2),Math.round((y+this.oy)/2),Math.max(1,Math.round(w/2)),Math.max(1,Math.round(h/2)));
  }
  line(x1:number,y1:number,x2:number,y2:number,color:Color,thickness=2) {
    const steps=Math.max(Math.abs(x2-x1),Math.abs(y2-y1))/2;
    for(let i=0;i<=steps;i++) this.rect(x1+(x2-x1)*i/Math.max(steps,1),y1+(y2-y1)*i/Math.max(steps,1),thickness,thickness,color);
  }
  tile(x:number,y:number,w:number,h:number,z:number,color:Color) {
    this.poly([[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(([a,b])=>{const p=iso(a,b);return [p.x,p.y-z] as Vertex;}),color);
  }
  box(x:number,y:number,w:number,h:number,z:number,top:Color,left:Color,right:Color,base=0) {
    const a=iso(x,y), b=iso(x+w,y), c=iso(x+w,y+h), d=iso(x,y+h);
    this.poly([[d.x,d.y-base],[c.x,c.y-base],[c.x,c.y-z],[d.x,d.y-z]],left);
    this.poly([[b.x,b.y-base],[c.x,c.y-base],[c.x,c.y-z],[b.x,b.y-z]],right);
    this.poly([[a.x,a.y-z],[b.x,b.y-z],[c.x,c.y-z],[d.x,d.y-z]],top);
  }
  text(text:string,x:number,y:number,size:number,color:Color) {
    this.ctx.fillStyle=color; this.ctx.font=`bold ${size/2}px monospace`; this.ctx.textAlign='center';
    this.ctx.fillText(text,(x+this.ox)/2,(y+this.oy)/2);
  }
}

export function floorArt(): PixelPainter {
  const p=new PixelPainter(1080,800,480,160);
  // A thick, floating cutaway slab and a subtle cast shadow.
  p.tile(-.35,.4,16.7,13.1,-26,'#1f2522');
  p.box(0,0,16,13,0,'#bfa586','#75674e','#8f7b5d',-18);
  for(let y=0;y<13;y++) for(let x=0;x<16;x++) {
    const wood=x>=12&&y>=9;
    const palette=wood?['#c09c75','#c7a37d','#ba9873']:['#b9b3a0','#bdb7a5','#b5af9c','#c1baa7'];
    p.tile(x,y,.98,.98,0,palette[(x*7+y*13)%palette.length]);
    const v=iso(x+.18,y+.4);
    p.rect(v.x,v.y,2,2,wood?'#a18562':'#aaa590');
    if(wood) {const a=iso(x,y+.5),b=iso(x+1,y+.5);p.line(a.x,a.y,b.x,b.y,'#b18e68');}
  }
  // Low contrast woven rugs delimit workspaces without closing the room.
  for(const r of [ {x:3.4,y:1.4,w:4.2,h:3.6,c:'#697c70',edge:'#9ca68e'}, {x:.7,y:2.7,w:2.8,h:3.2,c:'#b28560',edge:'#c9a278'}, {x:10.3,y:.8,w:4.4,h:4,c:'#8b8c74',edge:'#b1ad91'}, {x:2.6,y:6.6,w:3.8,h:2.9,c:'#8d9381',edge:'#aaa994'}, {x:8.6,y:5.6,w:3.8,h:3,c:'#8d9381',edge:'#aaa994'} ]) {
    p.tile(r.x,r.y,r.w,r.h,1,r.edge);p.tile(r.x+.1,r.y+.1,r.w-.2,r.h-.2,2,r.c);
    for(let i=.3;i<r.w;i+=.3) {const a=iso(r.x+i,r.y+.15),b=iso(r.x+i,r.y+r.h-.15);p.line(a.x,a.y-2,b.x,b.y-2,r.edge);}
    p.tile(r.x+.2,r.y+.2,r.w-.4,r.h-.4,3,r.c);
  }
  p.tile(7,11.8,2.6,1.1,1,'#615e50');
  const mat=iso(8.3,12.3);p.text('HOLA, JEFE.',mat.x,mat.y,9,'#c3b597');
  // Two back walls leave the front of the dollhouse fully open.
  for(let x=0;x<16;x++) {
    const a=iso(x,0),b=iso(x+1,0);
    p.poly([[a.x,a.y],[b.x,b.y],[b.x,b.y-108],[a.x,a.y-108]],x%2?'#d7cdb5':'#dbd2bc');
    p.line(a.x,a.y-108,b.x,b.y-108,'#f1e2c7',5);
    p.line(a.x,a.y-8,b.x,b.y-8,'#9a927b',6);
    p.line(a.x,a.y-12,b.x,b.y-12,'#eee0c3',2);
  }
  for(let y=0;y<13;y++) {
    const a=iso(0,y),b=iso(0,y+1);
    p.poly([[a.x,a.y],[b.x,b.y],[b.x,b.y-108],[a.x,a.y-108]],y%2?'#c1b79e':'#c5bba4');
    p.line(a.x,a.y-108,b.x,b.y-108,'#e1d4b9',5);
    p.line(a.x,a.y-8,b.x,b.y-8,'#8c856f',6);
    p.line(a.x,a.y-12,b.x,b.y-12,'#e1d4b9',2);
  }
  // Recessed windows: frame, sky, skyline, mullions and sunlit sill.
  for(const x of [2,7,12]) {
    const a=iso(x,.01),b=iso(x+2.7,.01);
    p.poly([[a.x,a.y-94],[b.x,b.y-94],[b.x,b.y-34],[a.x,a.y-34]],'#6d756d');
    p.poly([[a.x+4,a.y-87],[b.x-4,b.y-91],[b.x-4,b.y-40],[a.x+4,a.y-36]],'#a4beb7');
    for(let i=0;i<5;i++) {
      const q=iso(x+.2+i*.48,.01),h=10+(i*7)%17;
      p.poly([[q.x,q.y-42],[q.x+10,q.y-37],[q.x+10,q.y-37-h],[q.x,q.y-42-h]],i%2?'#91a5a2':'#8fa19b');
    }
    const m=iso(x+1.35,.01);p.line(m.x,m.y-91,m.x,m.y-36,'#e1d6bc',4);
    p.line(a.x,a.y-64,b.x,b.y-64,'#dbd0b7',3);
    p.line(a.x-3,a.y-32,b.x+3,b.y-32,'#f3e6c7',6);
  }
  // Sunlight falls across the carpet; transparency is baked into the source texture.
  p.ctx.globalAlpha=.10;
  for(const x of [2,7]) p.tile(x,.25,2.7,3.8,4,'#fff0b0');
  p.ctx.globalAlpha=1;
  // Pinboard on the west wall, clock and a studio nameplate.
  const board=iso(0,4.5);
  p.poly([[board.x,board.y-88],[board.x-68,board.y-54],[board.x-68,board.y-12],[board.x,board.y-46]],'#74644f');
  p.poly([[board.x-4,board.y-81],[board.x-62,board.y-52],[board.x-62,board.y-20],[board.x-4,board.y-49]],'#ad9165');
  for(let i=0;i<5;i++) p.rect(board.x-12-i*10,board.y-69+i*5,8,12,['#efdc9d','#e2b594','#c5d2bb'][i%3]);
  const sign=iso(5.6,0);p.text('GABI OS',sign.x,sign.y-65,16,'#586652');
  p.text('THE PIXEL OFFICE',sign.x,sign.y-52,7,'#8e8068');
  // Front corners and exposed end caps.
  for(const [x,y] of [[0,13],[16,0]]) {const q=iso(x,y);p.rect(q.x-2,q.y-109,5,110,'#ecddbe');}
  return p;
}

export type FurnitureKind = 'desk'|'gabitoDesk'|'emptyDesk'|'meeting'|'plant'|'books'|'coffee'|'reception'|'frame';
export function furnitureArt(kind: FurnitureKind): PixelPainter {
  const p=new PixelPainter(320,280,160,160);
  const point=(x:number,y:number,z=0)=>{const q=iso(x,y);return {x:q.x,y:q.y-z};};
  function monitor(x:number,y:number) {
    p.box(x+.32,y+.12,.28,.28,33,'#6a7770','#434e49','#505a52',29);
    const a=point(x,y,62),b=point(x+.95,y,62);
    p.poly([[a.x,a.y],[b.x,b.y],[b.x,b.y+25],[a.x,a.y+25]],'#35483f');
    p.poly([[a.x+3,a.y+4],[b.x-3,b.y+1],[b.x-3,b.y+20],[a.x+3,a.y+23]],'#819d8c');
    for(let i=0;i<3;i++) p.line(a.x+7,a.y+8+i*4,b.x-7,b.y+5+i*4,i===0?'#d6d8a2':'#a8c3aa');
    p.line(a.x,a.y,b.x,b.y,'#5c6c62',2);
  }
  function mug(x:number,y:number,z=34) {
    const a=point(x,y,z);p.rect(a.x,a.y-7,6,9,'#6c7550');p.rect(a.x+5,a.y-5,3,4,'#959b6e');p.rect(a.x+2,a.y-8,2,3,'#b8a06b');p.line(a.x+3,a.y-6,a.x+6,a.y-15,'#d4ceb4');
  }
  function table(w:number,h:number,top='#c39b6e') {
    p.tile(.08,.1,w+.2,h+.2,-1,'#96917e');
    for(const [x,y] of [[.15,.15],[w-.3,.15],[.15,h-.3],[w-.3,h-.3]]) p.box(x,y,.15,.15,28,'#7d6b51','#685d4c','#746047');
    p.box(0,0,w,h,33,top,'#a57e58','#8e6d4f',27);
    p.tile(.08,.1,w-.16,.08,34,'#dfbc88');
  }
  if(['desk','gabitoDesk','emptyDesk'].includes(kind)) {
    const w=kind==='gabitoDesk'?2:3;table(w,1.65);
    monitor(.35,.35);
    p.box(.7,.82,.8,.3,35,'#70776b','#555f55','#4e574e',33);
    for(let i=0;i<5;i++) {const a=point(.76+i*.12,.88,36);p.rect(a.x,a.y,2,2,'#acaf99');}
    p.tile(w-.85,.65,.52,.6,34,'#e4dac0');p.tile(w-.77,.72,.35,.05,35,'#9ba18b');
    mug(w-.35,.3);
    if(kind==='gabitoDesk') {
      const t=point(1.65,1.15,34);p.rect(t.x-3,t.y-22,8,22,'#777957');p.rect(t.x-2,t.y-23,6,4,'#d9cda3');p.rect(t.x-2,t.y-13,6,7,'#d4c18b');
    } else if(kind==='desk') {
      const l=point(2.6,.1,34);p.rect(l.x,l.y-26,3,26,'#58634d');p.rect(l.x-4,l.y-26,15,5,'#e1ba6a');p.rect(l.x-3,l.y-1,10,3,'#666d52');
    }
    // A separate-looking upholstered chair at the back edge, included in this prop's footprint.
    p.box(.8,-.35,.85,.6,24,'#6d7967','#515e50','#435447',6);
    p.box(.85,-.42,.8,.16,43,'#7d8a70','#5f705b','#586551',23);
  }
  if(kind==='meeting') {
    for(const [x,y] of [[-.15,.6],[2.8,.6],[.9,-.3],[.9,2.6]]) p.box(x,y,.55,.55,18,'#838b78','#64705f','#536252');
    table(3,2.5,'#ac926b');
    p.tile(.6,.6,.7,.5,34,'#ddd4b9');p.tile(1.6,1.5,.6,.4,34,'#cdc3a7');mug(2.3,.5);
    const a=point(1.4,1.1,34);p.rect(a.x-2,a.y-8,6,10,'#8a9873');
  }
  if(kind==='plant') {
    p.tile(-.4,-.4,.9,.9,-1,'#96917e');
    p.box(-.22,-.22,.45,.45,18,'#a97754','#8d6349','#795b43');
    const a=point(0,0,18);p.rect(a.x-2,a.y-34,4,35,'#647a52');
    for(const [dx,dy,w,h,c] of [[-18,-26,14,8,'#607d50'],[3,-33,17,8,'#7b935b'],[-14,-42,13,10,'#879e65'],[1,-49,12,12,'#718c53'],[-8,-53,8,9,'#9ba970'],[8,-17,13,8,'#4f704c']] as [number,number,number,number,string][]) {
      p.rect(a.x+dx,a.y+dy,w,h,c);p.rect(a.x+dx+2,a.y+dy-2,w-4,2,c);
    }
  }
  if(kind==='books') {
    p.box(0,0,.65,2.7,72,'#ad9068','#937d5c','#75684e');
    for(let shelf=0;shelf<3;shelf++) for(let i=0;i<8;i++) {
      const a=point(.7,.15+i*.3,12+shelf*20);
      p.rect(a.x-3,a.y-13,5,14,['#d5ba84','#809b88','#b98064','#d2cbb1'][i%4]);
      p.rect(a.x-3,a.y-10,5,2,'#b4ae91');
    }
    for(let i=0;i<4;i++) {const a=point(.7,i*.87,8);p.line(a.x,a.y,a.x-30,a.y+15,'#b59a70',3);}
  }
  if(kind==='coffee') {
    table(2,1.7,'#bbb39c');p.box(0,0,1.95,1.6,28,'#cac2a9','#a59d85','#9a937e');
    p.box(.2,.2,.65,.65,60,'#69756a','#4d5c52','#3c4e44',33);
    const a=point(.6,.8,55);p.rect(a.x-7,a.y,10,15,'#253e35');p.rect(a.x-4,a.y+6,5,6,'#d5cbae');p.rect(a.x+5,a.y+2,2,2,'#e7b36d');
    mug(1.6,.9);p.tile(1.2,.2,.5,.4,34,'#e3dac0');
  }
  if(kind==='reception') {table(3,.9);p.box(0,.65,3,.25,45,'#d3b388','#9c7d59','#8f7254',5);monitor(.4,.2);}
  if(kind==='frame') {
    p.rect(-13,-61,26,33,'#786a4f');p.rect(-10,-58,20,27,'#d8cbab');p.rect(-7,-55,14,19,'#344c6b');p.rect(-7,-47,14,4,'#d2b661');
    p.text('BOCA',0,-24,7,'#756c55');
    // Original placeholder colors only; no official crest is reproduced.
  }
  return p;
}
