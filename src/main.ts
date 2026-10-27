import './style.css';
import { readPreferences } from './core/preferences';
import { mountInterface } from './ui/interface';

const preferences=readPreferences();
const ui=mountInterface(preferences);
async function boot() {
  try {
    const [{default:Phaser},{OfficeScene}]=await Promise.all([import('phaser'),import('./office/OfficeScene')]);
    const game=new Phaser.Game({
      type:Phaser.AUTO,parent:'world',transparent:true,pixelArt:true,roundPixels:true,
      scale:{mode:Phaser.Scale.RESIZE,width:window.innerWidth,height:window.innerHeight},
      render:{antialias:false,antialiasGL:false,pixelArt:true,roundPixels:true},
      audio:{noAudio:true},fps:{target:60,limit:preferences.quality==='low'||(preferences.quality==='auto'&&window.innerWidth<600)?30:60},scene:[new OfficeScene(preferences)],
      banner:false,
    });
    if(import.meta.env.DEV) Object.assign(window,{__officeGame:game});
  } catch(error) {
    console.error('No se pudo abrir la oficina',error);
    ui.fail('No se pudo abrir la oficina. Probá recargar o usar un navegador con Canvas/WebGL.');
  }
}
void boot();
