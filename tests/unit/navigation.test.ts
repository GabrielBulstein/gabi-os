import { describe,it,expect } from 'vitest';
import { blockedCells,cellKey,COLS,ROWS,findPath,iso,unproject,walkable } from '../../src/office/grid';
describe('Office navigation',()=>{
  it('round-trips world and grid coordinates, including fractional actor positions',()=>{
    for(const p of [{x:0,y:0},{x:15,y:12},{x:5.25,y:8.75}]){const w=iso(p.x,p.y);expect(unproject(w.x,w.y)).toEqual(p);}
  });
  it('connects every walkable cell without crossing furniture or cutting corners',()=>{
    const blocked=blockedCells(),start={x:3,y:5};
    for(let x=0;x<COLS;x++)for(let y=0;y<ROWS;y++){
      const end={x,y};if(!walkable(end,blocked)||(x===start.x&&y===start.y))continue;
      const path=findPath(start,end,blocked);expect(path.at(-1)).toEqual(end);
      let previous=start;
      for(const step of path){expect(blocked.has(cellKey(step.x,step.y))).toBe(false);expect(Math.abs(previous.x-step.x)+Math.abs(previous.y-step.y)).toBe(1);previous=step;}
    }
  });
  it('rejects blocked and off-map destinations',()=>{
    const blocked=blockedCells();for(const p of [{x:4,y:2},{x:-1,y:5},{x:16,y:5},{x:4.5,y:5}])expect(findPath({x:3,y:5},p,blocked)).toEqual([]);
  });
  it('respects another actor reservation and finds an alternative',()=>{
    const blocked=blockedCells();blocked.add(cellKey(4,5));
    const path=findPath({x:3,y:5},{x:10,y:5},blocked);
    expect(path.length).toBeGreaterThan(0);expect(path).not.toContainEqual({x:4,y:5});
  });
  it('returns no route to an unreachable cell rather than looping',()=>{
    const blocked=blockedCells();for(const [x,y]of[[7,5],[9,5],[8,4],[8,6]])blocked.add(cellKey(x,y));
    expect(findPath({x:3,y:5},{x:8,y:5},blocked)).toEqual([]);
  });
});
