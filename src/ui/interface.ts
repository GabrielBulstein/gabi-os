import { portrait } from '../art/characters';
import { command, officeBus, type AmbientEvent, type CharacterId, type OfficeSelection, type OfficeStatus, type Preferences } from '../core/types';
import { savePreferences } from '../core/preferences';
import { icon } from './icons';

const characterInfo={
  gabi:{name:'Gabi',role:'El fundador',tag:'ACÁ MANDA USTED',description:'Tu lugar en la oficina. Elegís qué pasa desde afuera: el avatar vive la escena, vos llevás el timón.',detail:'El aspecto es provisional y personalizable. Gabi no habla por vos ni es un agente de IA.'},
  gabito:{name:'Gabito',role:'Gerente general',tag:'MATE EN MANO. PLAN EN PROCESO.',description:'Deportivo, canchero y con una teoría para cada quilombo. Tu mano derecha y el principal responsable de que nunca falte mate.',detail:'En este piloto recorre la oficina y protagoniza escenas escritas. Todavía no está conectado a OpenClaw.'},
};
export function mountInterface(initial:Preferences) {
  let prefs=structuredClone(initial),selected:OfficeSelection|null=null,follow:CharacterId|null=null,ready=false;
  let toastTimer:ReturnType<typeof setTimeout>,bubbleTimer:ReturnType<typeof setTimeout>;
  let focusBeforePanel:HTMLElement|null=null;
  const app=document.querySelector<HTMLDivElement>('#app')!;
  app.innerHTML=`
    <header class="masthead">
      <a class="brand" href="./" aria-label="GABI OS, volver al inicio"><span class="brand-symbol" aria-hidden="true">G</span><span><strong>GABI OS<span class="brand-dot">.</span></strong><span class="brand-sub">THE PIXEL OFFICE</span></span></a>
      <div class="episode"><span class="episode-line"></span><span>TEMPORADA 01 <b>/</b> EPISODIO PILOTO</span></div>
      <div class="header-right"><div class="local-time"><span>BUENOS AIRES</span><strong id="clock">--:--</strong></div><button class="square" id="help" aria-label="Cómo explorar">${icon('help')}</button><button class="square" id="settings" aria-label="Configuración">${icon('settings')}</button></div>
    </header>
    <main id="world" aria-label="The Pixel Office"><div id="loading"><span class="loading-pixel"></span>Abriendo la oficina…</div></main>
    <nav class="cast" aria-label="Personajes del piloto"><span class="eyebrow cast-label">HOY EN LA OFICINA</span>${(['gabi','gabito'] as const).map(id=>`<button class="cast-chip" data-select="${id}" aria-label="Conocer a ${characterInfo[id].name}" disabled><img class="pixel" data-portrait="${id}" src="${portrait(id,prefs.appearance)}" alt=""><span>${characterInfo[id].name}<small>${id==='gabi'?'Fundador':'Coordinador'}</small></span><i></i></button>`).join('')}</nav>
    <section class="welcome" aria-label="Episodio piloto"><div class="eyebrow"><span class="tiny-dash"></span> UNA SITCOM EN PÍXELES</div><h1>Bienvenido<br> al quilombo<span>.</span></h1><p>Un poco de trabajo. Un poco de mate.<br>Una oficina con vida propia.</p><button class="text-button" id="meet-gabito" disabled>Conocé a Gabito ${icon('arrow')}</button></section>
    <aside class="speech" id="speech" hidden aria-live="polite"><div class="speech-top"><span>GABITO <small>· ESCENA AMBIENTAL</small></span><button id="dismiss-speech" aria-label="Omitir comentario">${icon('close')}</button></div><p id="speech-text"></p></aside>
    <section id="character-panel" class="panel" hidden aria-labelledby="panel-title"><button class="panel-close square" id="close-panel" aria-label="Cerrar ficha">${icon('close')}</button><div id="panel-content"></div></section>
    <div class="camera-tools" role="toolbar" aria-label="Cámara"><button class="square" id="zoom-out" aria-label="Alejar" disabled>${icon('minus')}</button><output id="zoom" aria-label="Nivel de zoom">VISTA GENERAL</output><button class="square" id="zoom-in" aria-label="Acercar" disabled>${icon('plus')}</button><span class="tool-divider"></span><button class="square" id="reset-camera" aria-label="Restablecer vista general" title="Vista general · Inicio" disabled>${icon('reset')}</button><button class="square" id="follow-camera" aria-label="Seguir a Gabito" title="Seguir a Gabito" disabled>${icon('follow')}</button></div>
    <button id="stop-follow" class="follow-pill" hidden>Siguiendo a Gabito <span>Dejar de seguir ×</span></button>
    <footer class="footer"><span class="pilot-label"><i></i> PROTOTIPO INTERACTIVO <b>0.1</b></span><span class="navigation-hint">ARRASTRÁ PARA EXPLORAR <span>·</span> ACERCATE A LOS DETALLES</span><span class="ambient-label">Ambientación local <span>·</span> Sin IA conectada</span></footer>
    <div id="toast" role="status" hidden></div>
    <dialog id="modal" aria-labelledby="modal-title"><div class="modal-head"><span class="eyebrow" id="modal-kicker"></span><button class="square" id="close-modal" aria-label="Cerrar ventana">${icon('close')}</button></div><div id="modal-content"></div></dialog>
  `;
  const $=<T extends HTMLElement=HTMLElement>(s:string)=>app.querySelector<T>(s)!;
  const toast=(text:string)=>{clearTimeout(toastTimer);$('#toast').textContent=text;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,4000);};
  const closePanel=()=>{$('#character-panel').hidden=true;selected=null;document.body.classList.remove('panel-open');focusBeforePanel?.focus();};
  const updatePortraits=()=>app.querySelectorAll<HTMLImageElement>('[data-portrait="gabi"]').forEach(img=>img.src=portrait('gabi',prefs.appearance));
  function openPanel(id:OfficeSelection) {
    focusBeforePanel=document.activeElement instanceof HTMLElement?document.activeElement:null;
    selected=id;$('#character-panel').hidden=false;document.body.classList.add('panel-open');
    if(id==='gabi'||id==='gabito') {
      const c=characterInfo[id];
      $('#panel-content').innerHTML=`<div class="eyebrow">${c.tag}</div><div class="profile"><div class="portrait-box ${id}"><img class="pixel" data-portrait="${id}" src="${portrait(id,prefs.appearance)}" alt="Sprite de ${c.name}"></div><div><h2 id="panel-title">${c.name}</h2><p>${c.role}</p><span class="mini-tag">PERSONAJE DEL PILOTO</span></div></div><p class="panel-description">${c.description}</p><div class="action-grid"><button class="action" data-action="wave">${icon('hand')} Saludar</button><button class="action" data-action="mate">${icon('cup')} Tomar mate</button><button class="action" data-action="tour">${icon('arrow')} Dar una vuelta</button><button class="action" data-action="work">${icon('desk')} Ir al escritorio</button></div><button class="wide-action" data-action="coffee">Una pausa en la cafetería ${icon('cup')}</button><button class="wide-action follow-action" id="follow-selected">${icon('follow')} Seguir con la cámara</button><div class="panel-note">${c.detail}</div>${id==='gabi'?'<button class="text-button" id="customize">Personalizá tu avatar →</button>':'<button class="text-button" id="confessional">Ir al confesionario →</button>'}`;
      app.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(b=>b.onclick=()=>{
        command({type:'action',id,action:b.dataset.action as 'wave'|'mate'|'work'|'coffee'|'tour'});
        toast(b.dataset.action==='work'?'Rutina ambiental de escritorio.':b.dataset.action==='coffee'?'Una pausa. El mate no se negocia.':'Animación ambiental');
        if(window.matchMedia('(max-width:600px)').matches)closePanel();
      });
      $('#follow-selected').onclick=()=>{command({type:'camera',action:'follow',id});closePanel();};
      if(id==='gabi')$('#customize').onclick=openSettings;
      else $('#confessional').onclick=()=>{
        openModal('FALSO DOCUMENTAL · ESCENA ESCRITA',`<div class="confessional"><span class="recording"><i></i> CONFESIONARIO</span><img class="pixel" src="${portrait('gabito',prefs.appearance)}" alt="Gabito"><h2 id="modal-title">Gabito, gerente general.</h2><blockquote>«¿Si tengo todo organizado? Obvio. Lo que pasa es que mi sistema es difícil de distinguir del caos.»</blockquote><p>Escena ficticia del episodio piloto.</p></div>`);
      };
    } else {
      const content:Record<string,{tag:string;title:string;body:string;note:string}>= {
        desk:{tag:'TU RINCÓN DE LA OFICINA',title:'El escritorio del jefe',body:'Computadora, mate y un lugar desde el que mirar el panorama. La bandeja y el tablero de agentes se incorporarán en próximas etapas.',note:'Este piloto no contiene tareas reales ni migra datos del dashboard anterior.'},
        thermos:{tag:'OBJETO DE ALTO VALOR ESTRATÉGICO',title:'CEO DE ESTE QUILOMBO',body:'El termo de Gabito. Siempre lleno. Siempre cerca. Probablemente el objeto con más horas de oficina.',note:'Easter egg ambiental. No requiere presupuesto ni API.'},
        coffee:{tag:'EL VERDADERO CENTRO DE OPERACIONES',title:'La cafetería',body:'Las mejores reuniones empiezan con «voy a hacer un café». Podés invitar a Gabito a una pausa.',note:'Interacción ambiental del prototipo.'},
        meeting:{tag:'ESPACIO RESERVADO',title:'Sala de reuniones',body:'Una mesa para ocho y suficientes opiniones para dieciséis. El encuentro del equipo completo llega con el resto del elenco.',note:'Las escenas de reunión todavía están pendientes.'},
        frame:{tag:'UN PEQUEÑO RINCÓN AZUL Y ORO',title:'El cuadro de Gabito',body:'Lugar reservado para el cuadro de Boca Juniors. Por ahora tiene un diseño propio en azul y oro, sin reproducir el escudo oficial.',note:'El recurso definitivo queda pendiente de validar su uso.'},
      };
      const c=content[id];$('#panel-content').innerHTML=`<div class="eyebrow">${c.tag}</div><div class="object-icon">${icon(id==='thermos'||id==='coffee'?'cup':'desk')}</div><h2 id="panel-title">${c.title}</h2><p class="panel-description">${c.body}</p><p class="panel-note">${c.note}</p>${id==='desk'?'<button id="desk-settings" class="wide-action">Personalizá tu avatar →</button>':''}${id==='coffee'?'<button id="coffee-break" class="wide-action">Llamar a Gabito →</button>':''}`;
      if(id==='desk')$('#desk-settings').onclick=openSettings;
      if(id==='coffee')$('#coffee-break').onclick=()=>{command({type:'action',id:'gabito',action:'coffee'});toast('Gabito se acerca por el camino libre.');};
    }
    $('#close-panel').focus({preventScroll:true});
  }
  function openModal(kicker:string,content:string) {
    $('#modal-kicker').textContent=kicker;$('#modal-content').innerHTML=content;
    const dialog=$<HTMLDialogElement>('#modal');if(!dialog.open)dialog.showModal();
  }
  function openSettings() {
    openModal('A TU MANERA',`<h2 id="modal-title">Una oficina cómoda.</h2><p class="modal-intro">Ajustes guardados en este navegador.</p><div class="settings-section"><h3>Tu avatar · diseño provisional</h3><div class="avatar-editor"><img class="pixel" data-portrait="gabi" src="${portrait('gabi',prefs.appearance)}" alt="Vista previa del avatar de Gabi"><div class="color-fields"><label>Ropa<input id="shirt" type="color" value="${prefs.appearance.shirt}"></label><label>Pelo<input id="hair" type="color" value="${prefs.appearance.hair}"></label><label>Piel<input id="skin" type="color" value="${prefs.appearance.skin}"></label></div></div><label class="setting-row"><span>Barba</span><input type="checkbox" id="beard" ${prefs.appearance.beard?'checked':''}></label><label class="setting-row"><span>Anteojos</span><input type="checkbox" id="glasses" ${prefs.appearance.glasses?'checked':''}></label></div><div class="settings-section"><h3>Ambiente y movimiento</h3><label class="setting-row"><span>Reducir movimiento<small>Sin recorridos automáticos ni animaciones repetidas.</small></span><input type="checkbox" id="reduced" ${prefs.reducedMotion?'checked':''}></label><label class="setting-row"><span>Comentarios de sitcom<small>Ocasionales y siempre omisibles.</small></span><input type="checkbox" id="humor" ${prefs.humor?'checked':''}></label><label class="setting-row"><span>Rendimiento</span><select id="quality"><option value="auto">Automático</option><option value="high">Alto · 60 FPS objetivo</option><option value="balanced">Equilibrado</option><option value="low">Liviano · 30 FPS objetivo</option></select></label></div><p class="panel-note">Este piloto es silencioso. Música y efectos independientes, ciclo día/noche y el elenco completo forman parte de las siguientes etapas.</p>`);
    $<HTMLSelectElement>('#quality').value=prefs.quality;
    const update=()=>{
      prefs={reducedMotion:$<HTMLInputElement>('#reduced').checked,humor:$<HTMLInputElement>('#humor').checked,quality:$<HTMLSelectElement>('#quality').value as Preferences['quality'],appearance:{shirt:$<HTMLInputElement>('#shirt').value,hair:$<HTMLInputElement>('#hair').value,skin:$<HTMLInputElement>('#skin').value,beard:$<HTMLInputElement>('#beard').checked,glasses:$<HTMLInputElement>('#glasses').checked}};
      command({type:'preferences',value:structuredClone(prefs)});updatePortraits();
      if(!prefs.humor)$('#speech').hidden=true;
      if(!savePreferences(prefs))toast('El navegador no permite guardar preferencias. Se aplican a esta sesión.');
    };
    $('#modal-content').querySelectorAll('input,select').forEach(el=>el.addEventListener('change',update));
  }
  $('#help').onclick=()=>openModal('MANUAL DE BIENVENIDA',`<h2 id="modal-title">Vos llevás el timón.</h2><p class="modal-intro">Gabi tiene avatar. Vos explorás desde afuera.</p><ol class="help-list"><li><b>Explorá.</b> Arrastrá con mouse o un dedo. Rueda, pinza o botones para acercarte.</li><li><b>Conocelos.</b> Tocá un personaje o su nombre arriba. Probá saludar, tomar mate o dar una vuelta.</li><li><b>Mirá los detalles.</b> Tocá el escritorio de Gabi, el termo, el cuadro, la cafetería o la mesa de reuniones.</li><li><b>Elegí el encuadre.</b> Seguí a un personaje. Al arrastrar, recuperás el control. El botón de reinicio vuelve a la vista general.</li></ol><p class="panel-note">Teclado: + / − para zoom, Inicio para vista general y Escape para cerrar paneles o dejar de seguir. Las acciones de personajes también se pueden usar con Tab y Enter.</p><p class="panel-note">Es un prototipo con dos personajes. Todo lo que pasa es ambientación local; no hay agentes, mensajes ni trabajos reales.</p>`);
  $('#settings').onclick=openSettings;
  $('#close-modal').onclick=()=>$<HTMLDialogElement>('#modal').close();
  $('#close-panel').onclick=closePanel;
  $('#dismiss-speech').onclick=()=>$('#speech').hidden=true;
  $('#meet-gabito').onclick=()=>command({type:'select',id:'gabito'});
  app.querySelectorAll<HTMLButtonElement>('[data-select]').forEach(b=>b.onclick=()=>command({type:'select',id:b.dataset.select as CharacterId}));
  $('#zoom-in').onclick=()=>command({type:'camera',action:'in'});
  $('#zoom-out').onclick=()=>command({type:'camera',action:'out'});
  $('#reset-camera').onclick=()=>command({type:'camera',action:'reset'});
  $('#follow-camera').onclick=()=>command({type:'camera',action:follow?'stop':'follow',id:selected==='gabi'?'gabi':'gabito'});
  $('#stop-follow').onclick=()=>command({type:'camera',action:'stop'});
  officeBus.addEventListener('selection',e=>openPanel((e as CustomEvent<OfficeSelection>).detail));
  officeBus.addEventListener('ready',()=>{ready=true;$('#loading').remove();app.querySelectorAll<HTMLButtonElement>('button[disabled]').forEach(b=>b.disabled=false);});
  officeBus.addEventListener('status',e=>{
    const status=(e as CustomEvent<OfficeStatus>).detail;follow=status.following;
    $('#zoom').textContent=`${Math.round(status.zoom*100)} %`;
    $('#follow-camera').classList.toggle('active',!!follow);
    $('#follow-camera').setAttribute('aria-pressed',String(!!follow));
    $('#stop-follow').hidden=!follow;
    if(follow)$('#stop-follow').innerHTML=`Siguiendo a ${follow==='gabi'?'Gabi':'Gabito'} <span>Dejar de seguir ×</span>`;
  });
  officeBus.addEventListener('ambient',e=>{
    if(!prefs.humor||$<HTMLDialogElement>('#modal').open)return;
    const detail=(e as CustomEvent<AmbientEvent>).detail;
    clearTimeout(bubbleTimer);$('#speech-text').textContent=detail.text;$('#speech').hidden=false;
    bubbleTimer=setTimeout(()=>$('#speech').hidden=true,8500);
  });
  document.addEventListener('keydown',e=>{
    if($<HTMLDialogElement>('#modal').open||e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement)return;
    if(e.key==='Escape'){closePanel();$('#speech').hidden=true;command({type:'camera',action:'stop'});}
    if(!ready)return;
    if(e.key==='+'||e.key==='=')command({type:'camera',action:'in'});
    if(e.key==='-')command({type:'camera',action:'out'});
    if(e.key==='Home'){e.preventDefault();command({type:'camera',action:'reset'});}
  });
  const clock=()=>$('#clock').textContent=new Intl.DateTimeFormat('es-AR',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'America/Argentina/Buenos_Aires'}).format(new Date());
  clock();setInterval(clock,30000);
  return {fail:(message:string)=>{$('#loading').textContent=message;}};
}
