import { blockedCells,cellKey,findPath,walkable } from './grid';
import type {Point} from '../core/types';
export type Walker={id:string;cell:Point;step:Point|null;progress:number;goal:Point|null;route:Point[];wait:number;last:Point|null;arrived:boolean};
const same=(a:Point,b:Point)=>a.x===b.x&&a.y===b.y;
export class Crowd {
  agents=new Map<string,Walker>();
  blocked=blockedCells();
  add(id:string,cell:Point){if(!walkable(cell,this.occupied()))throw Error(`Invalid spawn: ${id}`);const a:Walker={id,cell:{...cell},step:null,progress:0,goal:null,route:[],wait:0,last:null,arrived:false};this.agents.set(id,a);return a;}
  occupied(exclude?:string){const result=new Set(this.blocked);for(const a of this.agents.values())if(a.id!==exclude){result.add(cellKey(a.cell.x,a.cell.y));if(a.step)result.add(cellKey(a.step.x,a.step.y));}return result;}
  go(id:string,target:Point){
    const a=this.agents.get(id)!;const occupied=this.occupied(id),start=a.step||a.cell;
    const destinations=new Set([...this.agents.values()].filter(b=>b!==a&&b.goal).map(b=>cellKey(b.goal!.x,b.goal!.y)));
    const candidates:Point[]=[];
    for(let radius=0;radius<=2;radius++)for(let x=target.x-radius;x<=target.x+radius;x++)for(let y=target.y-radius;y<=target.y+radius;y++)if(Math.abs(x-target.x)+Math.abs(y-target.y)===radius)candidates.push({x,y});
    const goal=candidates.find(p=>walkable(p,occupied)&&!destinations.has(cellKey(p.x,p.y))&&(same(p,start)||findPath(start,p,occupied).length>0));
    if(!goal)return false;
    a.goal={...goal};a.route=[];a.wait=0;a.arrived=false;return true;
  }
  cancel(id:string){const a=this.agents.get(id)!;a.goal=null;a.route=[];a.wait=0;}
  update(delta:number,speed=440){
    for(const a of this.agents.values()){
      a.arrived=false;
      if(a.step){
        a.progress=Math.min(1,a.progress+delta/speed);
        if(a.progress===1){a.last={...a.cell};a.cell={...a.step};a.step=null;if(!a.goal)a.arrived=true;}
        else continue;
      }
      if(!a.goal)continue;
      if(same(a.cell,a.goal)){a.goal=null;a.route=[];a.arrived=true;continue;}
      const occupied=this.occupied(a.id);
      if(!a.route.length||occupied.has(cellKey(a.route[0].x,a.route[0].y)))a.route=findPath(a.cell,a.goal,occupied);
      if(!a.route.length){
        a.wait+=delta;
        if(a.wait>1400){
          const neighbors=[{x:a.cell.x+1,y:a.cell.y},{x:a.cell.x,y:a.cell.y+1},{x:a.cell.x-1,y:a.cell.y},{x:a.cell.x,y:a.cell.y-1}];
          const exit=neighbors.filter(p=>walkable(p,occupied)).sort((p,q)=>Number(!!a.last&&same(p,a.last))-Number(!!a.last&&same(q,a.last)))[0];
          if(exit){a.route=[exit];a.wait=0;}
        }
        if(a.wait>8000){a.goal=null;a.route=[];a.wait=0;} // release an impossible request; never lock an actor forever
      }
      if(a.route.length&&!occupied.has(cellKey(a.route[0].x,a.route[0].y))){a.step=a.route.shift()!;a.progress=0;a.wait=0;}
    }
  }
}
