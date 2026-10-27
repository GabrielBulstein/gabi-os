import type { AnimationMode, Appearance, CharacterId } from '../core/types';
export const FRAME_W=48, FRAME_H=64, FRAMES=8;
export const modes: AnimationMode[]=['idle','walk','wave','mate','work'];
export const frameIndex=(mode:AnimationMode,direction:number,frame=0)=>(modes.indexOf(mode)*4+direction)*FRAMES+frame;
const shade=(hex:string,n:number)=>'#'+[1,3,5].map(i=>Math.max(0,Math.min(255,parseInt(hex.slice(i,i+2),16)+n)).toString(16).padStart(2,'0')).join('');

/** Hand-authored pixel clusters with frame-specific limbs, eyes, faces and props. No external assets. */
export function characterSheet(id:CharacterId,appearance:Appearance): HTMLCanvasElement {
  const canvas=document.createElement('canvas');canvas.width=FRAME_W*FRAMES;canvas.height=FRAME_H*modes.length*4;
  const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;
  const skin=id==='gabi'?appearance.skin:'#d5a17a',hair=id==='gabi'?appearance.hair:'#3e3931',shirt=id==='gabi'?appearance.shirt:'#507c70';
  const ink='#333c35',pants=id==='gabi'?'#475767':'#374b49';
  for(const mode of modes) for(let dir=0;dir<4;dir++) for(let frame=0;frame<FRAMES;frame++) {
    const offX=frame*FRAME_W,offY=(modes.indexOf(mode)*4+dir)*FRAME_H;
    const walking=mode==='walk',back=dir===2||dir===3,face=dir===1||dir===2?1:-1;
    const bob=walking?[0,-1,-1,0,0,-1,-1,0][frame]:frame>=4?-1:0;
    const sitting=mode==='work'?4:0;
    const r=(x:number,y:number,w:number,h:number,color:string)=>{c.fillStyle=color;c.fillRect(offX+x,offY+y+bob+sitting,w,h);};
    // Silhouette, legs and shoe highlights stay distinct at small scale.
    const stride=walking?[0,1,2,1,0,-1,-2,-1][frame]:0;
    r(17+stride,45,6,11,ink);r(25-stride,45,6,11,ink);
    r(18+stride,45,4,9,pants);r(26-stride,45,4,9,shade(pants,-12));
    r(15+stride,54,8,4,id==='gabito'?'#ddd7bd':'#61594b');r(25-stride,54,8,4,id==='gabito'?'#c6cdbb':'#514d43');
    r(15+stride,57,8,1,'#a5aa94');r(25-stride,57,8,1,'#9ea48e');
    // Body and collar.
    r(15,29,18,19,ink);r(16,30,16,16,shirt);r(16,43,16,3,shade(shirt,-20));
    r(18,30,4,13,shade(shirt,15));r(21,28,6,4,shade(skin,-16));
    if(id==='gabito') {r(23,31,2,15,'#c9c5a7');r(17,32,3,2,'#d5d2b5');r(29,32,3,2,'#d5d2b5');r(17,37,3,1,'#b1bba3');}
    else {r(21,30,7,2,shade(shirt,28));r(29,38,2,4,shade(shirt,-15));}
    // Walking swings are drawn into the sheet, independent of world translation.
    const arm=walking?stride:0;
    if(mode!=='work'){r(12,32+arm,4,11,ink);r(13,33+arm,3,8,shade(shirt,-7));r(13,41+arm,3,4,skin);}
    if(mode!=='wave'&&mode!=='mate'&&mode!=='work'){r(32,32-arm,4,11,ink);r(32,33-arm,3,8,shade(shirt,-19));r(32,41-arm,3,4,shade(skin,-10));}
    // Oversized head, contour, ears and asymmetric lighting.
    r(15,10,18,18,ink);r(13,17,3,6,shade(skin,-15));r(33,17,3,6,shade(skin,-20));
    r(16,12,16,14,skin);r(17,25,13,3,shade(skin,-17));r(29,14,3,11,shade(skin,-13));
    r(15,9,17,7,hair);r(18,7,11,3,hair);r(16,10,5,3,shade(hair,18));r(21,9,7,2,shade(hair,10));
    r(15,14,3,5,hair);r(30,13,3,5,hair);r(17,14,4,2,hair);
    if(back) {r(16,12,16,12,hair);r(17,12,4,7,shade(hair,14));r(18,24,12,3,shade(skin,-18));}
    else {
      const eyeX=face===1?23:18;
      r(eyeX,18,2,3,ink);r(eyeX+7,18,2,3,ink);
      if(frame===6 && mode==='idle') {r(eyeX,18,2,3,skin);r(eyeX+7,18,2,3,skin);r(eyeX,20,2,1,ink);r(eyeX+7,20,2,1,ink);}
      r(face===1?29:18,21,3,2,shade(skin,-25));r(22,25,5,1,'#8d6250');r(17,22,3,2,shade(skin,10));
      if(id==='gabi'&&appearance.beard){r(18,24,12,3,hair);r(17,22,2,3,hair);r(29,22,2,3,hair);r(23,24,3,1,skin);}
      if(id==='gabi'&&appearance.glasses){r(eyeX-1,17,5,5,ink);r(eyeX+6,17,5,5,ink);r(eyeX+4,18,2,1,ink);r(eyeX,18,3,2,'#a2b4a6');r(eyeX+7,18,3,2,'#a2b4a6');}
    }
    if(mode==='wave') {
      r(33,24,4,12,ink);r(34,25,3,10,shirt);r(33,20+(frame%2),5,6,skin);r(34,18+(frame%2),2,3,skin);
    }
    if(mode==='mate') {
      const lift=frame<4?0:-3;
      r(28,32+lift,7,4,shade(shirt,-10));r(29,30+lift,5,4,skin);r(29,27+lift,6,7,'#737e4f');r(30,26+lift,4,2,'#c1b77d');r(33,21+lift,1,7,'#d9d8bb');
    }
    if(mode==='work') {r(13,38,7,4,shirt);r(28,38,8,4,shade(shirt,-12));r(17,39+(frame%2),5,3,skin);r(27,39+((frame+1)%2),5,3,skin);}
  }
  return canvas;
}
export function portrait(id:CharacterId,appearance:Appearance): string {
  const sheet=characterSheet(id,appearance),canvas=document.createElement('canvas');canvas.width=48;canvas.height=60;
  canvas.getContext('2d')!.drawImage(sheet,0,0,48,60,0,0,48,60);return canvas.toDataURL();
}
