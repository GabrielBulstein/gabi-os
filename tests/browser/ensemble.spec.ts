import {test,expect} from '@playwright/test';
import {characterIds,hotspotIds} from '../../src/core/types';
import {cast} from '../../src/content/cast';
test.beforeEach(async({page})=>{
  await page.addInitScript(()=>{if(!sessionStorage.getItem('office-test-initialized')){localStorage.setItem('gabi-pixel-office:preferences:v1',JSON.stringify({welcome:false,timePreview:'day'}));sessionStorage.setItem('office-test-initialized','1');}});
  await page.goto('./');await expect(page.locator('#loading')).toHaveCount(0);
});
test('all eight profiles, individual routines and seven confessionals are usable',async({page})=>{
  test.setTimeout(45000);
  for(const id of characterIds){
    await page.getByRole('button',{name:'Equipo · 8',exact:true}).click();await page.locator(`#modal [data-select="${id}"]`).click();
    await expect(page.getByRole('heading',{name:cast[id].name,exact:true})).toBeVisible();
    await expect(page.getByRole('button',{name:cast[id].specialty,exact:true})).toBeVisible();
    if(id!=='gabi'){
      await page.getByRole('button',{name:'Ir al confesionario →',exact:true}).click();await expect(page.locator('.confessional blockquote')).toContainText(cast[id].confessional);
      await page.getByRole('button',{name:'Cerrar ventana',exact:true}).click();
    }
    await page.getByRole('button',{name:'Cerrar ficha',exact:true}).click();
  }
});
test('all seven hotspots expose their interaction and label examples as demonstrations',async({page})=>{
  const titles={desk:'El escritorio del jefe',meeting:'Sala de reuniones',coffee:'La cafetería',board:'Pizarrón del Profe',copier:'La fotocopiadora',reception:'Recepción de Pame',thermos:'CEO DE ESTE QUILOMBO'};
  for(const id of hotspotIds){
    await page.getByRole('button',{name:'Lugares',exact:true}).click();await page.locator(`#modal [data-select="${id}"]`).click();
    await expect(page.getByRole('heading',{name:titles[id],exact:true})).toBeVisible();
    if(['desk','board','reception'].includes(id))await expect(page.locator('.demo-banner')).toBeVisible();
    await page.getByRole('button',{name:'Cerrar ficha',exact:true}).click();
  }
});
test('day and night previews change lighting and persist with explicit preview labels',async({page},info)=>{
  const before=await page.locator('canvas').screenshot();
  await page.getByRole('button',{name:'Configuración',exact:true}).click();await page.locator('#time-preview').selectOption('night');
  await page.getByRole('button',{name:'Cerrar ventana',exact:true}).click();await expect(page.locator('body')).toHaveAttribute('data-phase','night');
  await expect(page.locator('#phase-badge')).toContainText('Vista previa · Madrugada');await expect(page.locator('#phase-badge')).toContainText('Sin personal');
  const after=await page.locator('canvas').screenshot();expect(before.equals(after)).toBe(false);
  await page.screenshot({path:`test-results/${info.project.name}-night.png`,scale:'css'});
  await page.reload();await expect(page.locator('#loading')).toHaveCount(0);await expect(page.locator('body')).toHaveAttribute('data-phase','night');
});
test('audio needs a gesture, separate volumes persist, and reload starts muted',async({page})=>{
  await page.addInitScript(()=>{const Original=window.AudioContext;Reflect.set(window,'audioConstructionCount',0);window.AudioContext=class extends Original{constructor(){super();Reflect.set(window,'audioConstructionCount',Number(Reflect.get(window,'audioConstructionCount'))+1);}};});
  await page.reload();await expect(page.locator('#loading')).toHaveCount(0);expect(await page.evaluate(()=>Reflect.get(window,'audioConstructionCount'))).toBe(0);
  await page.getByRole('button',{name:'Activar audio',exact:true}).click();await expect(page.locator('#audio-toggle')).toHaveAttribute('aria-pressed','true');expect(await page.evaluate(()=>Reflect.get(window,'audioConstructionCount'))).toBe(1);
  await page.getByRole('button',{name:'Configuración',exact:true}).click();await page.locator('#music-volume').press('Home');await page.locator('#effects-volume').press('End');
  await expect(page.locator('#music-value')).toHaveText('0 %');await expect(page.locator('#effects-value')).toHaveText('100 %');
  await page.getByRole('button',{name:'Cerrar ventana',exact:true}).click();await page.reload();await expect(page.locator('#loading')).toHaveCount(0);
  await expect(page.locator('#audio-toggle')).toHaveAttribute('aria-pressed','false');expect(await page.evaluate(()=>Reflect.get(window,'audioConstructionCount'))).toBe(0);
  await page.getByRole('button',{name:'Configuración',exact:true}).click();await expect(page.locator('#music-volume')).toHaveValue('0');await expect(page.locator('#effects-volume')).toHaveValue('100');
});
test('unavailable audio never blocks the office',async({page})=>{
  await page.evaluate(()=>Reflect.set(window,'AudioContext',function(){throw Error('Audio unavailable');}));
  await page.getByRole('button',{name:'Activar audio',exact:true}).click();await expect(page.locator('#toast')).toContainText('audio no está disponible');
  await expect(page.locator('canvas')).toBeVisible();await expect(page.locator('#audio-toggle')).toHaveAttribute('aria-pressed','false');
});
test('scenes gather participants, advance, skip and leave the camera under user control',async({page},info)=>{
  test.setTimeout(60000);const zoom=await page.locator('#zoom').textContent();
  await page.getByRole('button',{name:'Lugares',exact:true}).click();await page.locator('#places-scenes').click();await page.locator('[data-scene="bugs"]').click();
  await expect(page.locator('#scene-player')).toBeVisible();await expect(page.locator('#scene-progress')).toHaveText('1 / 4',{timeout:22000});
  await expect(page.locator('#zoom')).toHaveText(zoom!);await page.locator('#scene-auto').click();await page.locator('#scene-next').click();await expect(page.locator('#scene-progress')).toHaveText('2 / 4');
  await page.screenshot({path:`test-results/${info.project.name}-sitcom.png`,scale:'css'});
  await page.getByRole('button',{name:'Omitir escena',exact:true}).click();await expect(page.locator('#scene-player')).toBeHidden();
  await page.getByRole('button',{name:'Lugares',exact:true}).click();await page.locator('#modal [data-select="meeting"]').click();await page.getByRole('button',{name:'Convocar reunión de ejemplo →',exact:true}).click();
  await expect(page.locator('#scene-progress')).toHaveText('1 / 7',{timeout:25000});await expect(page.locator('#zoom')).toHaveText(zoom!);
  await page.getByRole('button',{name:'Omitir escena',exact:true}).click();await expect(page.locator('#scene-player')).toBeHidden();
});
test('welcome is optional, skippable, and occurs at most once per session',async({page})=>{
  await page.getByRole('button',{name:'Configuración',exact:true}).click();await page.locator('#welcome').check();await page.getByRole('button',{name:'Cerrar ventana',exact:true}).click();
  await page.reload();await expect(page.locator('#loading')).toHaveCount(0);
  await expect(page.locator('#scene-title')).toHaveText('Llegó el jefe',{timeout:7000});await page.getByRole('button',{name:'Omitir escena',exact:true}).click();
  await expect(page.locator('#scene-player')).toBeHidden();
  await page.reload();await expect(page.locator('#loading')).toHaveCount(0);
  expect(await page.evaluate(()=>sessionStorage.getItem('pixel-office:welcome'))).toBe('1');
  await expect(page.locator('#scene-player')).toBeHidden();
});
