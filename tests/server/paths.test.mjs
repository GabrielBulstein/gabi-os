import {test} from 'node:test';
import assert from 'node:assert/strict';
import {officePaths} from '../../server/paths.mjs';

test('Windows storage and bundled CLI stay on D without falling back to AppData',()=>{
  const p=officePaths('win32',{LOCALAPPDATA:'C:\\private'});
  for(const value of Object.values(p))assert.match(value,/^D:\\/);
  assert.equal(p.runtime,'D:\\GABI-OS\\data\\runtime');
  assert.throws(()=>officePaths('win32',{GABI_OS_HOME:'C:\\GabiOS'}));
  assert.equal(officePaths('win32',{GABI_OS_HOME:'D:\\Custom'}).migration,'D:\\Custom\\data\\migration');
});
test('Linux paths remain portable for checks',()=>{
  assert.equal(officePaths('linux',{},'/home/test').runtime,'/home/test/.local/share/gabi-os/data/runtime');
});
