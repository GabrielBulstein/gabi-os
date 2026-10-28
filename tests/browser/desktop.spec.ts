import {test,expect} from '@playwright/test';

test('desktop diagnostics stay separate from fiction and unavailable in the static build',async({page,baseURL})=>{
  await page.addInitScript(()=>localStorage.setItem('gabi-pixel-office:preferences:v1',JSON.stringify({welcome:false,timePreview:'day'})));
  await page.goto('./');
  await page.getByRole('button',{name:'Motor',exact:true}).click();
  await expect(page.getByRole('heading',{name:'El motor de la oficina.'})).toBeVisible();
  await expect(page.locator('#modal-content')).toContainText('La Philco queda fuera');
  const check=page.getByRole('button',{name:'Consultar servidor local'});
  if(baseURL?.includes(':4173/')){
    await expect(check).toBeDisabled();
    await expect(page.locator('#desktop-status')).toContainText('GitHub Pages');
  }else{
    await page.route('**/__desktop/status',route=>route.fulfill({json:{schema:1,checkedAt:new Date().toISOString(),host:'desktop',mode:'read-only',memory:{totalMB:32768,freeMB:16384},cpu:{model:'CPU',logicalCores:12},gateway:'live',agentResponseVerified:false,taskSubmission:false}}));
    await check.click();
    await expect(page.locator('#desktop-status')).toContainText('Consulta real');
    await expect(page.locator('#desktop-facts')).toContainText('agente sin verificar');
    await expect(page.locator('#desktop-facts')).toContainText('Todavía no habilitadas');
    await page.route('**/__desktop/status',route=>route.abort());
    await check.click();
    await expect(page.locator('#desktop-status')).toContainText('Servidor no disponible');
    await expect(page.locator('#desktop-facts')).toBeEmpty();
  }
  await expect(page.locator('.ambient-label')).toContainText(baseURL?.includes(':4173/')?'Sin IA conectada':'Chat privado de Gabito');
});
