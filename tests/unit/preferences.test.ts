import {afterEach,describe,it,expect,vi} from 'vitest';
import {readPreferences,savePreferences} from '../../src/core/preferences';
afterEach(()=>vi.unstubAllGlobals());
const browser=(value:string|null)=>{vi.stubGlobal('window',{matchMedia:()=>({matches:true})});vi.stubGlobal('localStorage',{getItem:()=>value,setItem:()=>{throw Error('Unavailable');}});};
describe('Preferences',()=>{
  it('opens the full office with legacy pilot preferences and new defaults',()=>{
    browser(JSON.stringify({humor:false,appearance:{shirt:'#112233',beard:true}}));
    expect(readPreferences()).toMatchObject({humor:false,reducedMotion:true,welcome:true,musicVolume:.2,appearance:{shirt:'#112233',beard:true,hairstyle:'short',accessory:'none'}});
  });
  it('rejects corrupt preferences and unsupported values without preventing boot',()=>{
    browser('{broken');expect(readPreferences().quality).toBe('auto');
    browser(JSON.stringify({quality:'ultra',timePreview:'tomorrow',musicVolume:200,effectsVolume:-3,appearance:{shirt:'javascript:bad',hairstyle:'bad'}}));
    expect(readPreferences()).toMatchObject({quality:'auto',timePreview:'real',musicVolume:1,effectsVolume:0,appearance:{shirt:'#bc7253',hairstyle:'short'}});
    expect(savePreferences(readPreferences())).toBe(false);
  });
});
