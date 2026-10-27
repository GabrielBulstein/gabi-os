import type { AnimationMode, Appearance, CharacterId } from '../core/types';
import { cast } from '../content/cast';
export const FRAME_W=48, FRAME_H=64, FRAMES=8;
export const modes: AnimationMode[]=['idle','walk','wave','mate','work','specialty','react','talk','look'];
export const frameIndex=(mode:AnimationMode,direction:number,frame=0)=>(modes.indexOf(mode)*4+direction)*FRAMES+frame;
const shade=(hex:string,n:number)=>'#'+[1,3,5].map(i=>Math.max(0,Math.min(255,parseInt(hex.slice(i,i+2),16)+n)).toString(16).padStart(2,'0')).join('');

/** Hand-authored pixel clusters with frame-specific limbs, eyes, faces and props. No external assets. */
export function characterSheet(id:CharacterId,appearance:Appearance): HTMLCanvasElement {
  const canvas=document.createElement('canvas');canvas.width=FRAME_W*FRAMES;canvas.height=FRAME_H*modes.length*4;
  const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;
  const model=cast[id];
  const skin=id==='gabi'?appearance.skin:model.skin,hair=id==='gabi'?appearance.hair:model.hair,shirt=id==='gabi'?appearance.shirt:model.shirt;
  const ink='#333c35',pants=model.pants,fat=id==='migue'||id==='kevin';
  for(const mode of modes) for(let dir=0;dir<4;dir++) for(let frame=0;frame<FRAMES;frame++) {
    const offX=frame*FRAME_W,offY=(modes.indexOf(mode)*4+dir)*FRAME_H;
    const walking=mode==='walk',back=dir===2||dir===3,face=dir===1||dir===2?1:-1;
    const bob=walking?[0,-1,-1,0,0,-1,-1,0][frame]:frame>=4?-1:0;
    const sitting=mode==='work'?4:0;
    const r=(x:number,y:number,w:number,h:number,color:string)=>{c.fillStyle=color;const wide=fat&&y>=29&&y<48&&w>=15?3:0;c.fillRect(offX+x-wide,offY+y+bob+sitting,w+wide*2,h);};
    if(id==='pame'||(id==='gabi'&&appearance.hairstyle==='long')){r(13,14,22,22,shade(hair,-12));r(12,24,4,14,hair);r(31,24,5,13,hair);}
    // Silhouette, legs and shoe highlights stay distinct at small scale.
    const stride=walking?[0,1,2,1,0,-1,-2,-1][frame]:0;
    r(17+stride,45,6,11,ink);r(25-stride,45,6,11,ink);
    r(18+stride,45,4,9,pants);r(26-stride,45,4,9,shade(pants,-12));
    r(15+stride,54,8,4,id==='gabito'?'#ddd7bd':'#61594b');r(25-stride,54,8,4,id==='gabito'?'#c6cdbb':'#514d43');
    r(15+stride,57,8,1,'#a5aa94');r(25-stride,57,8,1,'#9ea48e');
    if(id==='pame'){r(16,42,17,9,'#77766a');r(17,42,6,8,'#898676');}
    // Body and collar.
    r(15,29,18,19,ink);r(16,30,16,16,shirt);r(16,43,16,3,shade(shirt,-20));
    r(18,30,4,13,shade(shirt,15));r(21,28,6,4,shade(skin,-16));
    if(id==='gabito') {r(23,31,2,15,'#c9c5a7');r(17,32,3,2,'#d5d2b5');r(29,32,3,2,'#d5d2b5');r(17,37,3,1,'#b1bba3');}
    else {r(21,30,7,2,shade(shirt,28));r(29,38,2,4,shade(shirt,-15));}
    if(id==='kevin'){r(20,30,9,3,'#d9ded0');r(24,32,3,11,'#8d6656');r(26,41,3,4,'#a07963');}
    if(id==='profe'||id==='pame'){r(21,31,5,14,id==='profe'?'#d7c9a3':'#e7d4b9');r(20,31,1,15,shade(shirt,-25));r(26,31,1,15,shade(shirt,-25));}
    if(id==='migue'){r(21,34,8,7,'#253d49');r(23,36,4,3,'#8aafa0');r(22,37,1,1,'#e8cea0');}
    if(id==='nacho'){r(23,31,1,15,'#657e79');r(29,34,3,3,'#b4c5b6');r(18,31,3,2,'#d2d5bd');}
    if(id==='dexter'){r(21,31,7,3,'#d8d0b3');r(25,34,1,10,'#8e8249');r(29,34,2,3,'#665f3e');}
    if(id==='gabi'&&appearance.outfit==='hoodie'){r(17,29,5,5,shade(shirt,28));r(27,29,5,5,shade(shirt,28));r(21,38,7,4,shade(shirt,-18));r(21,34,1,4,'#ddd1b1');r(27,34,1,4,'#ddd1b1');}
    if(id==='gabi'&&appearance.outfit==='shirt'){r(23,31,1,15,shade(shirt,-35));r(19,30,4,3,shade(shirt,30));r(25,30,4,3,shade(shirt,30));}
    // Walking swings are drawn into the sheet, independent of world translation.
    const arm=walking?stride:0;
    if(mode!=='work'&&mode!=='react'){r(12,32+arm,4,11,ink);r(13,33+arm,3,8,shade(shirt,-7));r(13,41+arm,3,4,skin);}
    if(!['wave','mate','work','react','specialty'].includes(mode)){r(32,32-arm,4,11,ink);r(32,33-arm,3,8,shade(shirt,-19));r(32,41-arm,3,4,shade(skin,-10));}
    if(id==='nacho'){r(12,37+arm,4,4,'#d3c7ab');if(mode!=='specialty')r(32,37-arm,4,4,'#d3c7ab');}
    // Oversized head, contour, ears and asymmetric lighting.
    r(15,10,18,18,ink);r(13,17,3,6,shade(skin,-15));r(33,17,3,6,shade(skin,-20));
    r(16,12,16,14,skin);r(17,25,13,3,shade(skin,-17));r(29,14,3,11,shade(skin,-13));
    r(15,9,17,7,hair);r(18,7,11,3,hair);r(16,10,5,3,shade(hair,18));r(21,9,7,2,shade(hair,10));
    r(15,14,3,5,hair);r(30,13,3,5,hair);r(17,14,4,2,hair);
    if(id==='kevin'){r(16,8,16,9,skin);r(16,10,16,2,shade(skin,10));r(15,15,3,5,hair);r(31,15,3,5,hair);}
    if(id==='gabi'&&appearance.hairstyle==='curly')for(const [x,y]of[[15,7],[20,5],[26,6],[31,8]])r(x,y,4,4,hair);
    if(id==='profe'){r(18,7,11,3,'#d1d2c3');r(16,11,5,2,'#e1dfcc');}
    if(back) {r(16,12,16,12,hair);r(17,12,4,7,shade(hair,14));r(18,24,12,3,shade(skin,-18));}
    else {
      const eyeX=mode==='look'?21:face===1?23:18;
      r(eyeX,18,2,3,ink);r(eyeX+7,18,2,3,ink);
      if(frame===6 && mode==='idle') {r(eyeX,18,2,3,skin);r(eyeX+7,18,2,3,skin);r(eyeX,20,2,1,ink);r(eyeX+7,20,2,1,ink);}
      r(face===1?29:18,21,3,2,shade(skin,-25));r(22,25,5,1,'#8d6250');r(17,22,3,2,shade(skin,10));
      if(id==='gabi'&&appearance.beard){r(18,24,12,3,hair);r(17,22,2,3,hair);r(29,22,2,3,hair);r(23,24,3,1,skin);}
      if(id==='profe'||(id==='gabi'&&appearance.glasses)){r(eyeX-1,17,5,5,ink);r(eyeX+6,17,5,5,ink);r(eyeX+4,18,2,1,ink);r(eyeX,18,3,2,'#a2b4a6');r(eyeX+7,18,3,2,'#a2b4a6');}
      if(mode==='talk'&&frame%3===0){r(23,24,4,3,'#745448');r(23,24,4,1,'#ead9bb');}
      if(mode==='react'){r(eyeX-1,16,4,1,ink);r(eyeX+6,16,4,1,ink);r(23,23,3,4,'#805d4c');}
      if(mode==='look'){r(eyeX,16,3,1,hair);r(eyeX+6,15,4,1,hair);}
    }
    if(id==='migue'||(id==='gabi'&&appearance.accessory==='headphones')){r(13,15,3,11,'#334b52');r(33,15,3,11,'#334b52');r(16,7,17,2,'#789797');r(12,18,4,6,'#8aa3a0');}
    if(id==='gabi'&&appearance.accessory==='cap'){r(15,7,18,6,shade(shirt,-15));r(dir===1?26:12,12,11,2,shade(shirt,12));}
    if(mode==='wave') {
      r(33,24,4,12,ink);r(34,25,3,10,shirt);r(33,20+(frame%2),5,6,skin);r(34,18+(frame%2),2,3,skin);
    }
    if(mode==='mate') {
      const lift=frame<4?0:-3;
      r(28,32+lift,7,4,shade(shirt,-10));r(29,30+lift,5,4,skin);r(29,27+lift,6,7,'#737e4f');r(30,26+lift,4,2,'#c1b77d');r(33,21+lift,1,7,'#d9d8bb');
    }
    if(mode==='work') {r(13,38,7,4,shirt);r(28,38,8,4,shade(shirt,-12));r(17,39+(frame%2),5,3,skin);r(27,39+((frame+1)%2),5,3,skin);}
    if(mode==='work'&&id==='profe'){r(17,37,14,8,'#d4c6a3');r(23,37,1,8,'#887d60');}
    if(mode==='work'&&(id==='pame'||id==='nacho')){r(31,25,3,12,'#3f4d42');r(29,32,4,4,skin);}
    if(mode==='work'&&id==='kevin'){r(18,37,8,9,'#475a52');for(let k=0;k<3;k++)r(19+k*2,42,1,1,'#d7d7b7');}
    if(mode==='react'){r(10,24,5,14,shirt);r(10,21,5,5,skin);r(33,24,5,14,shirt);r(33,21,5,5,skin);}
    if(mode==='specialty'){
      if(id==='profe'||id==='dexter'){r(32,29,9,4,shirt);r(38,26+(frame%3),4,5,skin);r(40,20+(frame%3),1,9,id==='profe'?'#e5e2c9':'#6c5352');r(13,36,9,10,'#d8cfaf');r(14,38,6,1,'#8c9776');}
      else if(id==='migue'){if(frame<4){r(10,22,5,13,shirt);r(11,19,5,5,skin);r(34,22,5,13,shirt);r(33,19,5,5,skin);}else{r(34,22,5,14,shirt);r(34,18,5,6,skin);}}
      else if(id==='pame'||id==='nacho'){r(30,33,8,4,shirt);r(32,30,4,5,skin);r(30,25,10,15,'#e5dcc2');r(32,28,6,1,'#8c9b88');r(32,31+(frame%2),6,1,'#a3ae97');}
      else if(id==='kevin'){const lift=frame>3?-6:0;r(31,33+lift,8,4,shirt);r(34,30+lift,5,5,skin);r(35,26+lift,5,6,'#c49555');r(36,27+lift,1,1,'#7a5c39');}
      else if(id==='gabito'){r(32,30-(frame%3),10,4,shirt);r(40,29-(frame%3),4,4,skin);r(42,27-(frame%3),3,2,skin);}
      else {r(31,30,5,9,shirt);r(32,28,5,7,skin);r(33,24,3,6,skin);}
    }
  }
  return canvas;
}
const portraitCache=new Map<string,string>();
export function portrait(id:CharacterId,appearance:Appearance): string {
  const key=id==='gabi'?JSON.stringify(appearance):id,cached=portraitCache.get(key);if(cached)return cached;
  const sheet=characterSheet(id,appearance),canvas=document.createElement('canvas');canvas.width=48;canvas.height=60;
  canvas.getContext('2d')!.drawImage(sheet,0,0,48,60,0,0,48,60);const result=canvas.toDataURL();if(portraitCache.size>40)portraitCache.clear();portraitCache.set(key,result);return result;
}
