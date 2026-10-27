import {describe,it,expect} from 'vitest';
import {Crowd} from '../../src/office/crowd';
import {cast} from '../../src/content/cast';
import {scenes} from '../../src/content/scenes';
import {characterIds} from '../../src/core/types';
import {environment} from '../../src/office/environment';
import {walkable,blockedCells,cellKey} from '../../src/office/grid';

describe('Full office',()=>{
  it('has eight distinct identities, accessible stations and seven specialists who never impersonate Gabi',()=>{
    expect(characterIds).toHaveLength(8);const blocked=blockedCells();
    for(const id of characterIds){expect(walkable(cast[id].start,blocked)).toBe(true);expect(walkable(cast[id].home,blocked)).toBe(true);if(id!=='gabi')expect(cast[id].confessional.length).toBeGreaterThan(30);}
    for(const scene of Object.values(scenes))for(const line of scene.lines)expect(line.speaker).not.toBe('gabi');
  });
  it('uses Buenos Aires time regardless of the host timezone and clearly identifies previews',()=>{
    expect(environment(new Date('2026-10-27T05:00:00Z')).phase).toBe('night');
    expect(environment(new Date('2026-10-27T12:00:00Z')).phase).toBe('morning');
    expect(environment(new Date('2026-10-27T18:00:00Z')).population).toBe(8);
    expect(environment(new Date('2026-10-28T01:00:00Z')).population).toBeLessThan(8);
    expect(environment(new Date('2026-10-27T18:00:00Z'),'night')).toMatchObject({phase:'night',population:0,preview:true});
  });
  it('routes eight people to a meeting without overlaps or crossing furniture',()=>{
    const crowd=new Crowd();for(const id of characterIds)crowd.add(id,cast[id].start);
    scenes.meeting.participants.forEach((id,i)=>expect(crowd.go(id,scenes.meeting.spots[i])).toBe(true));
    for(let tick=0;tick<1600;tick++){
      crowd.update(40);
      const occupied=new Set<string>();
      for(const a of crowd.agents.values()){
        expect(walkable(a.cell,crowd.blocked)).toBe(true);if(a.step)expect(walkable(a.step,crowd.blocked)).toBe(true);
        for(const p of [a.cell,...(a.step?[a.step]:[])]){const key=cellKey(p.x,p.y);expect(occupied.has(key),`Collision at ${key}`).toBe(false);occupied.add(key);}
      }
      if([...crowd.agents.values()].every(a=>!a.goal&&!a.step))break;
    }
    for(const [i,id]of scenes.meeting.participants.entries())expect(crowd.agents.get(id)!.cell).toEqual(scenes.meeting.spots[i]);
  });
  it('allocates separate pause destinations and preserves in-flight positions on cancellation',()=>{
    const crowd=new Crowd();for(const id of characterIds)crowd.add(id,cast[id].start);
    for(const id of characterIds)crowd.go(id,{x:12,y:10});
    const goals=[...crowd.agents.values()].flatMap(a=>a.goal?[cellKey(a.goal.x,a.goal.y)]:[]);expect(new Set(goals).size).toBe(goals.length);
    crowd.update(100);const before={...crowd.agents.get('gabito')!.cell},step=crowd.agents.get('gabito')!.step;
    crowd.cancel('gabito');expect(crowd.agents.get('gabito')!.cell).toEqual(before);expect(crowd.agents.get('gabito')!.step).toBe(step);
  });
});
