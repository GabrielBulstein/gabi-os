import {test,expect} from '@playwright/test';
test('Gabito chat stays separate from fiction, renders text safely and persists via server',async({page,baseURL})=>{
 await page.addInitScript(()=>localStorage.setItem('gabi-pixel-office:preferences:v1',JSON.stringify({welcome:false,timePreview:'day'})));
 let calls=0;const messages:{id:string;role:string;text:string;sources?:string[]}[]=[];
 await page.route('**/__desktop/chat/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  const status={available:true,busy:false,agentResponseVerified:calls>0};
  if(path.endsWith('/session'))return route.fulfill({json:{token:'test-session',status}});
  if(path.endsWith('/history'))return route.fulfill({json:{messages,status}});
  calls++;const payload=route.request().postDataJSON();
  messages.push({id:'1',role:'user',text:payload.text},{id:'2',role:'assistant',text:'<img src=x onerror=alert(1)> Papel azul.',sources:['fixture.md']});
  return route.fulfill({json:{message:messages[1],status}});
 });
 await page.goto('./');
 await page.getByRole('button',{name:'Conocer a Gabito',exact:true}).click();
 await page.getByRole('button',{name:'Conversar con Gabito',exact:false}).click();
 await expect(page.getByRole('heading',{name:'Charlá con Gabito.'})).toBeVisible();
 const send=page.getByRole('button',{name:'Enviar a Gabito'});
 if(baseURL?.includes(':4173/')){await expect(send).toBeDisabled();await expect(page.locator('#chat-status')).toContainText('GitHub Pages');return;}
 await expect(page.locator('#chat-status')).toContainText('pulsar Enviar');expect(calls).toBe(0);
 await page.getByLabel('Tu mensaje').fill('¿Qué materiales hay?');await send.click();
 await expect(page.locator('#chat-log')).toContainText('<img src=x onerror=alert(1)> Papel azul.');
 await expect(page.locator('#chat-log img')).toHaveCount(0);expect(calls).toBe(1);
 await page.getByRole('button',{name:'Cerrar ventana',exact:true}).click();
 await page.getByRole('button',{name:'Conversar con Gabito',exact:false}).click();
 await expect(page.locator('#chat-log')).toContainText('Papel azul.');expect(calls).toBe(1);
});

