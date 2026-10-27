import { test,expect } from '@playwright/test';

test.beforeEach(async({page})=>{await page.goto('./');await expect(page.locator('#loading')).toHaveCount(0);});
test('boots the office and exposes accessible character actions without runtime errors',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByRole('heading',{name:'Bienvenido al quilombo.'})).toBeVisible();
  await page.screenshot({path:`test-results/${info.project.name}-office.png`,scale:'css'});
  await page.getByRole('button',{name:'Conocer a Gabito',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Gabito',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Tomar mate',exact:true}).click();
  await expect(page.locator('#speech')).toBeVisible();
  await page.getByRole('button',{name:'Conocer a Gabito',exact:true}).click();
  await page.getByRole('button',{name:'Seguir con la cámara'}).click();
  await expect(page.locator('#stop-follow')).toBeVisible();
  await page.getByRole('button',{name:'Restablecer vista general'}).click();
  await expect(page.locator('#stop-follow')).toBeHidden();
  expect(errors).toEqual([]);
});
test('camera zoom changes and dragging does not select a character',async({page})=>{
  const before=await page.locator('#zoom').textContent();
  await page.getByRole('button',{name:'Acercar',exact:true}).click();
  await expect(page.locator('#zoom')).not.toHaveText(before!);
  await page.getByRole('button',{name:'Restablecer vista general'}).click();
  const box=(await page.locator('canvas').boundingBox())!;
  await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.down();
  await page.mouse.move(box.x+box.width*.7,box.y+box.height*.6,{steps:8});await page.mouse.up();
  await expect(page.locator('#character-panel')).toBeHidden();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('avatar preferences survive reload and reduced motion and humor controls work',async({page})=>{
  await page.getByRole('button',{name:'Configuración',exact:true}).click();
  await page.locator('#beard').check();await page.locator('#reduced').check();await page.locator('#humor').uncheck();
  await page.locator('#quality').selectOption('low');
  await page.getByRole('button',{name:'Cerrar ventana'}).click();await page.reload();
  await expect(page.locator('#loading')).toHaveCount(0);
  await page.getByRole('button',{name:'Configuración',exact:true}).click();
  await expect(page.locator('#beard')).toBeChecked();await expect(page.locator('#reduced')).toBeChecked();await expect(page.locator('#humor')).not.toBeChecked();
  await expect(page.locator('#quality')).toHaveValue('low');
  await page.getByRole('button',{name:'Cerrar ventana'}).click();
  await page.getByRole('button',{name:'Conocer a Gabito',exact:true}).click();await page.getByRole('button',{name:'Saludar',exact:true}).click();
  await expect(page.locator('#speech')).toBeHidden();
});
test('native pinch zoom does not select a character',async({page},info)=>{
  test.skip(info.project.name!=='mobile','Requires touch input.');
  const session=await page.context().newCDPSession(page);
  const box=(await page.locator('canvas').boundingBox())!;
  const cx=box.x+box.width/2,cy=box.y+box.height/2,before=await page.locator('#zoom').textContent();
  const touches=(offset:number)=>[{x:cx-offset,y:cy,id:0},{x:cx+offset,y:cy,id:1}];
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:touches(40)});
  await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:touches(75)});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect(page.locator('#zoom')).not.toHaveText(before!);
  await expect(page.locator('#character-panel')).toBeHidden();
  await page.getByRole('button',{name:'Restablecer vista general'}).click();
  await expect(page.locator('#zoom')).toHaveText(before!);
});
test('selects a character directly on the map',async({page})=>{
  const box=(await page.locator('canvas').boundingBox())!;
  const zoom=Math.min((box.width-32)/1000,(box.height-16)/650,1.5);
  const point={x:box.x+box.width/2+(32-40)*zoom,y:box.y+box.height/2+(162-185)*zoom};
  await page.mouse.click(point.x,point.y);
  await expect(page.getByRole('heading',{name:'Gabi',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Cerrar ficha'}).click();
  await page.getByRole('button',{name:'Restablecer vista general'}).click();
  // A screenshot verifies the original sprite artwork; this assertion verifies map hit-testing.
  await expect(page.locator('#character-panel')).toBeHidden();
  while(Number.parseInt((await page.locator('#zoom').textContent())!)<130)await page.getByRole('button',{name:'Acercar',exact:true}).click();
  const detailedZoom=Number.parseInt((await page.locator('#zoom').textContent())!)/100;
  await page.mouse.click(box.x+box.width/2+(-48-40)*detailedZoom,box.y+box.height/2+(60-185)*detailedZoom);
  await expect(page.getByRole('heading',{name:'CEO DE ESTE QUILOMBO',exact:true})).toBeVisible();
});
