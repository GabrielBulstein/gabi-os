import type { Point } from '../core/types';
export const COLS = 16;
export const ROWS = 13;
export const HALF_W = 32;
export const HALF_H = 16;
export const iso = (x: number, y: number): Point => ({ x: (x - y) * HALF_W, y: (x + y) * HALF_H });
export const unproject = (x: number, y: number): Point => ({ x: (x / HALF_W + y / HALF_H) / 2, y: (y / HALF_H - x / HALF_W) / 2 });
export const cellKey = (x: number, y: number) => `${x},${y}`;
export type Footprint = { x: number; y: number; w: number; h: number };
export const footprints: Footprint[] = [
  { x: 4, y: 2, w: 3, h: 2 }, // Gabi, north semi-central
  { x: 1, y: 3, w: 2, h: 2 }, // Gabito, next to Gabi
  { x: 11, y: 1, w: 3, h: 3 }, // meetings, northeast
  { x: 0, y: 0, w: 1, h: 3 }, // library, west
  { x: 3, y: 7, w: 3, h: 2 }, // future Migue
  { x: 9, y: 6, w: 3, h: 2 }, // future Dexter
  { x: 13, y: 7, w: 2, h: 2 }, // future Nacho
  { x: 13, y: 10, w: 2, h: 2 }, // kitchenette
  { x: 3, y: 11, w: 3, h: 1 }, // reception
];
export function blockedCells(): Set<string> {
  const set = new Set<string>();
  for (const f of footprints) for (let x=f.x; x<f.x+f.w; x++) for (let y=f.y; y<f.y+f.h; y++) set.add(cellKey(x,y));
  for (const p of [{x:8,y:1},{x:0,y:6},{x:15,y:5},{x:1,y:11}]) set.add(cellKey(p.x,p.y));
  return set;
}
export function walkable(p: Point, blocked: Set<string>): boolean {
  return Number.isInteger(p.x) && Number.isInteger(p.y) && p.x>=0 && p.y>=0 && p.x<COLS && p.y<ROWS && !blocked.has(cellKey(p.x,p.y));
}
export function findPath(start: Point, goal: Point, blocked: Set<string>): Point[] {
  if (!walkable(start,blocked) || !walkable(goal,blocked)) return [];
  const key=cellKey(start.x,start.y), target=cellKey(goal.x,goal.y);
  const open=new Map<string,Point>([[key,start]]), from=new Map<string,string>(), cost=new Map<string,number>([[key,0]]);
  const distance=(p:Point)=>Math.abs(p.x-goal.x)+Math.abs(p.y-goal.y);
  while(open.size) {
    const [k,p]=[...open.entries()].sort((a,b)=>(cost.get(a[0])!+distance(a[1]))-(cost.get(b[0])!+distance(b[1])))[0];
    open.delete(k);
    if(k===target) {
      const path:Point[]=[]; let cursor=k;
      while(cursor!==key) { const [x,y]=cursor.split(',').map(Number); path.unshift({x,y}); cursor=from.get(cursor)!; }
      return path;
    }
    for(const n of [{x:p.x+1,y:p.y},{x:p.x-1,y:p.y},{x:p.x,y:p.y+1},{x:p.x,y:p.y-1}]) {
      if(!walkable(n,blocked)) continue;
      const nk=cellKey(n.x,n.y), nc=cost.get(k)!+1;
      if(nc<(cost.get(nk)??Infinity)) { cost.set(nk,nc); from.set(nk,k); open.set(nk,n); }
    }
  }
  return [];
}
