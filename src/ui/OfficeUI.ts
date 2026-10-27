import {portrait} from '../art/characters';
import {cast} from '../content/cast';
import {scenes} from '../content/scenes';
import {characterIds,hotspotIds,command,officeBus,type AmbientEvent,type CharacterAction,type CharacterId,type OfficeSelection,type OfficeStatus,type Preferences,type SceneId} from '../core/types';
import {savePreferences} from '../core/preferences';
import {OfficeAudio} from '../audio/OfficeAudio';
import {icon} from './icons';
const places={desk:'Escritorio de Gabi',meeting:'Sala de reuniones',coffee:'Cafetería',board:'Pizarrón del Profe',copier:'Fotocopiadora',reception:'Recepción de Pame',thermos:'Termo de Gabito',frame:'Cuadro de Gabito'};
const phaseNames={morning:'Mañana',day:'Día',evening:'Cierre de oficina',night:'Madrugada'};
export function mountInterface(initial:Preferences){
  let prefs=structuredClone(initial),selected:OfficeSelection|null=null,follow:CharacterId|null=null,ready=false;
  let toastTimer:ReturnType<typeof setTimeout>,bubbleTimer:ReturnType<typeof setTimeout>,sceneTimer:ReturnType<typeof setTimeout>;
  let focusBeforePanel:HTMLElement|null=null,sceneId:SceneId|null=null,sceneStep=-1,automatic=true;
  const audio=new OfficeAudio(prefs),app=document.querySelector<HTMLDivElement>('#app')!;
  const roster=()=>characterIds.map(id=>`<button class="cast-chip requires-office" data-select="${id}" aria-label="Conocer a ${cast[id].name}" disabled><img class="pixel" data-portrait="${id}" src="${portrait(id,prefs.appearance)}" alt=""><span>${cast[id].name}<small>${cast[id].role}</small></span></button>`).join('');
  app.innerHTML=`
    <header class="masthead"><a class="brand" href="./" aria-label="GABI OS, volver al inicio"><span class="brand-symbol" aria-hidden="true">G</span><span><strong>GABI OS<span class="brand-dot">.</span></strong><span class="brand-sub">THE PIXEL OFFICE</span></span></a><div class="episode"><span class="episode-line"></span><span>TEMPORADA 01 <b>/</b> EL ELENCO COMPLETO</span></div><div class="header-right"><div class="local-time"><span>BUENOS AIRES</span><strong id="clock">--:--</strong></div><button class="square" id="audio-toggle" aria-label="Activar audio" aria-pressed="false" title="Audio apagado">${icon('volume')}</button><button class="square" id="help" aria-label="Cómo explorar">${icon('help')}</button><button class="square" id="settings" aria-label="Configuración">${icon('settings')}</button></div></header>
    <main id="world" aria-label="The Pixel Office"><div id="loading"><span class="loading-pixel"></span>Abriendo la oficina…</div></main>
    <nav class="cast" aria-label="Los ocho personajes">${roster()}</nav>
    <div class="explore-tools"><button id="team" class="small-pill">${icon('hand')} Equipo · 8</button><button id="places" class="small-pill">${icon('desk')} Lugares</button><span id="phase-badge" class="phase-badge">Horario de Buenos Aires</span></div>
    <section class="welcome" aria-label="The Pixel Office"><div class="eyebrow"><span class="tiny-dash"></span> UNA SITCOM EN PÍXELES</div><h1>Bienvenido<br> al quilombo<span>.</span></h1><p>Ocho personajes. Una oficina.<br>El mate sigue siendo indispensable.</p><button class="text-button requires-office" id="view-scenes" disabled>Elegí una escena ${icon('play')}</button></section>
    <aside class="speech" id="speech" hidden aria-live="polite"><div class="speech-top"><span id="speech-author">ESCENA AMBIENTAL</span><button id="dismiss-speech" aria-label="Omitir comentario">${icon('close')}</button></div><p id="speech-text"></p></aside>
    <section id="character-panel" class="panel" hidden aria-labelledby="panel-title"><button class="panel-close square" id="close-panel" aria-label="Cerrar ficha">${icon('close')}</button><div id="panel-content"></div></section>
    <section id="scene-player" class="scene-player" hidden aria-label="Escena de sitcom"><div class="scene-top"><span class="eyebrow">SITCOM · ESCENA FICTICIA</span><button id="skip-scene" aria-label="Omitir escena">${icon('close')}</button></div><h2 id="scene-title"></h2><div id="scene-body"></div><div class="scene-actions"><button id="scene-auto" aria-pressed="true">Pausar</button><span id="scene-progress"></span><button id="scene-next">Siguiente →</button></div></section>
    <div class="camera-tools" role="toolbar" aria-label="Cámara"><button class="square requires-office" id="zoom-out" aria-label="Alejar" disabled>${icon('minus')}</button><output id="zoom" aria-label="Nivel de zoom">VISTA GENERAL</output><button class="square requires-office" id="zoom-in" aria-label="Acercar" disabled>${icon('plus')}</button><span class="tool-divider"></span><button class="square requires-office" id="reset-camera" aria-label="Restablecer vista general" disabled>${icon('reset')}</button><button class="square requires-office" id="follow-camera" aria-label="Seguir a Gabito" title="Seguir al personaje seleccionado" disabled>${icon('follow')}</button></div><button id="stop-follow" class="follow-pill" hidden></button>
    <footer class="footer"><span class="pilot-label"><i></i> OFICINA COMPLETA <b>1.0 RC</b></span><span class="navigation-hint">ARRASTRÁ PARA EXPLORAR <span>·</span> ACERCATE A LOS DETALLES</span><span class="ambient-label">Ambientación local <span>·</span> Sin IA conectada</span></footer><div id="toast" role="status" hidden></div>
    <dialog id="modal" aria-labelledby="modal-title"><div class="modal-head"><span class="eyebrow" id="modal-kicker"></span><button class="square" id="close-modal" aria-label="Cerrar ventana">${icon('close')}</button></div><div id="modal-content"></div></dialog>`;
  const $=<T extends HTMLElement=HTMLElement>(s:string)=>app.querySelector<T>(s)!;
  const dialog=$<HTMLDialogElement>('#modal');
  const toast=(text:string)=>{clearTimeout(toastTimer);$('#toast').textContent=text;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,4200);};
  const closePanel=()=>{$('#character-panel').hidden=true;document.body.classList.remove('panel-open');if(focusBeforePanel?.isConnected&&focusBeforePanel.getClientRects().length)focusBeforePanel.focus({preventScroll:true});else $('#team').focus({preventScroll:true});};
  const updatePortraits=()=>app.querySelectorAll<HTMLImageElement>('[data-portrait="gabi"]').forEach(img=>img.src=portrait('gabi',prefs.appearance));
  const isCharacter=(id:OfficeSelection):id is CharacterId=>characterIds.includes(id as CharacterId);
  const actionButton=(action:CharacterAction,label:string,symbol='hand')=>{
    if(selected==='pame'&&action==='specialty')action='look';
    else if(selected==='pame'&&action==='look'){action='specialty';label='Archivar';}
    return `<button class="action" data-action="${action}">${icon(symbol)} ${label}</button>`;
  };
  function openModal(kicker:string,content:string){$('#modal-kicker').textContent=kicker;$('#modal-content').innerHTML=content;if(!dialog.open)dialog.showModal();}
  function chooseScene(id:SceneId){
    if(!prefs.humor){toast('El humor está apagado. Podés activarlo en Configuración.');return;}
    dialog.close();closePanel();$('#speech').hidden=true;command({type:'scene',id});
  }
  function sceneMenu(){openModal('EL EQUIPO EN ACCIÓN',`<h2 id="modal-title">Elegí el quilombo.</h2><p class="modal-intro">Escenas escritas, breves y omisibles. La cámara la manejás vos.</p><div class="scene-menu">${(Object.entries(scenes) as [SceneId,typeof scenes[SceneId]][]).filter(([id])=>id!=='welcome').map(([id,s])=>`<button class="scene-card" data-scene="${id}"><span>${s.participants.map(who=>cast[who].name).join(' + ')}</span><strong>${s.title}</strong>${icon('play')}</button>`).join('')}</div><p class="panel-note">Son situaciones ficticias de oficina. No se ejecutan trabajos ni se generan informes reales.</p>`);}
  function teamMenu(){openModal('EL REPARTO COMPLETO',`<h2 id="modal-title">Ocho formas de trabajar.</h2><p class="modal-intro">El trato al Profe sigue siendo de usted.</p><div class="team-grid">${characterIds.map(id=>`<button class="team-card" data-select="${id}"><img class="pixel" data-portrait="${id}" src="${portrait(id,prefs.appearance)}" alt=""><strong>${cast[id].name}</strong><span>${cast[id].role}</span></button>`).join('')}</div>`);}
  function placesMenu(){openModal('UN MAPA. SIETE PUNTOS DE ENCUENTRO.',`<h2 id="modal-title">Explorá la oficina.</h2><div class="places-grid">${hotspotIds.map((id,i)=>`<button class="place-card" data-select="${id}"><span>0${i+1}</span><strong>${places[id]}</strong>${icon('arrow')}</button>`).join('')}</div><button class="wide-action" id="places-scenes">Ver las escenas de sitcom ${icon('play')}</button>`);$('#places-scenes').onclick=sceneMenu;}
  function openPanel(id:OfficeSelection){
    focusBeforePanel=document.activeElement instanceof HTMLElement?document.activeElement:null;
    selected=id;$('#character-panel').hidden=false;document.body.classList.add('panel-open');
    if(isCharacter(id)){
      const c=cast[id];
      $('#panel-content').innerHTML=`<div class="eyebrow">${c.tag}</div><div class="profile"><div class="portrait-box ${id}"><img class="pixel" data-portrait="${id}" src="${portrait(id,prefs.appearance)}" alt="Sprite de ${c.name}"></div><div><h2 id="panel-title">${c.name}</h2><p>${c.role}</p><span class="mini-tag">PERSONAJE · AMBIENTACIÓN</span></div></div><p class="panel-description">${c.description}</p><div class="action-grid">${actionButton('wave','Saludar')}${actionButton('mate','Tomar mate','cup')}${actionButton('tour','Dar una vuelta','arrow')}${actionButton('work','Ir al escritorio','desk')}${actionButton('specialty',c.specialty,'play')}${actionButton(id==='pame'?'look':'react',id==='pame'?'Mirar a cámara':'Reaccionar','sun')}</div><button class="wide-action" data-action="coffee">Una pausa en la cafetería ${icon('cup')}</button><button class="wide-action follow-action" id="follow-selected">${icon('follow')} Seguir con la cámara</button><p class="panel-note">${id==='gabi'?'Tu avatar no emite diálogos en tu nombre. Su aspecto es configurable.':'Rutinas y diálogos ficticios. Este especialista no está conectado a un agente de IA.'}</p><button class="text-button" id="profile-extra">${id==='gabi'?'Personalizá tu avatar':'Ir al confesionario'} →</button>`;
      $('#follow-selected').onclick=()=>{command({type:'camera',action:'follow',id});closePanel();};
      $('#profile-extra').onclick=()=>id==='gabi'?openSettings():openModal('FALSO DOCUMENTAL · ESCENA ESCRITA',`<div class="confessional"><span class="recording"><i></i> CONFESIONARIO</span><img class="pixel" src="${portrait(id,prefs.appearance)}" alt="${c.name}"><h2 id="modal-title">${c.name}, ${c.role.toLowerCase()}.</h2><blockquote>«${c.confessional}»</blockquote><p>Escena ficticia. Podés cerrarla en cualquier momento.</p></div>`);
    }else{
      const contents:Record<Exclude<OfficeSelection,CharacterId>,{tag:string;title:string;body:string;extra:string}>={
        desk:{tag:'TU RINCÓN · DEMOSTRACIÓN',title:'El escritorio del jefe',body:'Una vista conceptual de la bandeja y los proyectos futuros. Estas tarjetas son ejemplos ficticios y no representan trabajo de agentes.',extra:`<div class="demo-banner">DEMOSTRACIÓN · SIN EJECUCIÓN REAL</div><div class="demo-card"><small>BANDEJA DE EJEMPLO</small><strong>Una decisión para revisar</strong><p>Ejemplo: elegir entre dos propuestas de organización.</p><button class="text-button" id="demo-approval">Ver aprobación de ejemplo →</button></div><div class="demo-card"><small>TABLERO DE EJEMPLO</small><strong>Una idea, tres etapas</strong><p>Definir → Revisar → Aprobar. Es una maqueta del flujo futuro.</p></div><button class="wide-action" id="desk-settings">Personalizá tu avatar →</button>`},
        meeting:{tag:'LA MESA DEL EQUIPO',title:'Sala de reuniones',body:'Ocho lugares, una agenda y una razonable posibilidad de desviarse del tema. Reuní al elenco en una escena de ejemplo.',extra:'<button class="wide-action" data-scene="meeting">Convocar reunión de ejemplo →</button><p class="panel-note">La reunión es ficticia y omisible. No genera resultados reales.</p>'},
        coffee:{tag:'CENTRO DE OPERACIONES NO OFICIAL',title:'La cafetería',body:'Cafetera, heladera, microondas y presupuesto para conversar. La pausa más productiva no siempre figura en un diagrama.',extra:'<button class="wide-action" id="coffee-break">Invitar a Gabito a una pausa →</button><button class="wide-action" data-scene="budget">Gabito + Kevin: el presupuesto del café →</button>'},
        board:{tag:'EDUCACIÓN · MATERIAL DE EJEMPLO',title:'Pizarrón del Profe',body:'Un rincón para ordenar ideas. Las materias de esta vista son ejemplos, sin fuentes de cursada ni avances reales conectados.',extra:'<div class="demo-banner">MATERIAS DE DEMOSTRACIÓN</div><ul class="demo-list"><li>Redes · esquema de ejemplo</li><li>Algoritmos · ejercicio ilustrativo</li><li>Ingeniería de Software · tema de muestra</li></ul><button class="wide-action" data-scene="lesson">Escuchar al Profe →</button>'},
        copier:{tag:'TECNOLOGÍA CON CARÁCTER',title:'La fotocopiadora',body:'Funciona perfecto, salvo cuando necesitás que funcione. Pame y Migue tienen experiencia con sus estados de ánimo.',extra:'<button class="wide-action" data-scene="printer">Provocar un atasco ficticio →</button>'},
        reception:{tag:'AGENDA · DEMOSTRACIÓN',title:'Recepción de Pame',body:'La puerta de entrada a la oficina. Esta agenda es ilustrativa: no está conectada a calendarios ni notificaciones reales.',extra:'<div class="demo-banner">AGENDA Y NOVEDADES FICTICIAS</div><ul class="demo-list"><li>09:30 · Reunión de muestra</li><li>11:00 · Pausa de ejemplo</li><li>Novedad demo · La impresora solicita paciencia</li></ul><button class="wide-action" data-scene="meeting">Ver reunión de ejemplo →</button>'},
        thermos:{tag:'OBJETO DE ALTO VALOR ESTRATÉGICO',title:'CEO DE ESTE QUILOMBO',body:'El termo de Gabito. Siempre lleno, siempre cerca. No hay reuniones que lo dejen afuera.',extra:'<p class="panel-note">Easter egg ambiental. La leyenda se muestra completa acá para que se lea incluso en el teléfono.</p>'},
        frame:{tag:'AZUL Y ORO',title:'El cuadro de Gabito',body:'Espacio reservado para el cuadro de Boca Juniors. Este motivo es original, sin reproducir el escudo oficial.',extra:'<p class="panel-note">El recurso de marca definitivo sigue pendiente de validar.</p>'},
      };
      const c=contents[id];$('#panel-content').innerHTML=`<div class="eyebrow">${c.tag}</div><div class="object-icon">${icon(id==='coffee'||id==='thermos'?'cup':'desk')}</div><h2 id="panel-title">${c.title}</h2><p class="panel-description">${c.body}</p>${c.extra}`;
      if(id==='desk'){
        $('#desk-settings').onclick=openSettings;
        $('#demo-approval').onclick=()=>openModal('VISTA CONCEPTUAL',`<h2 id="modal-title">Una aprobación de ejemplo.</h2><p class="modal-intro">En versiones posteriores, acá verías la acción propuesta, el responsable, el costo y la evidencia antes de aprobar.</p><p class="demo-banner">DEMO · NINGUNA ACCIÓN SE EJECUTA</p><p class="panel-note">Los permisos, tareas persistentes e integraciones se construirán por separado.</p>`);
      }
      if(id==='coffee')$('#coffee-break').onclick=()=>{command({type:'action',id:'gabito',action:'coffee'});closePanel();toast('Una pausa ambiental en la cafetería.');};
    }
    $('#close-panel').focus({preventScroll:true});
  }
  function openSettings(){
    const options=(values:[string,string][],current:string)=>values.map(([v,label])=>`<option value="${v}" ${v===current?'selected':''}>${label}</option>`).join('');
    openModal('A TU MANERA',`<h2 id="modal-title">Una oficina cómoda.</h2><p class="modal-intro">Preferencias guardadas en este navegador. El audio siempre inicia apagado.</p><div class="settings-section"><h3>Tu avatar</h3><div class="avatar-editor"><img class="pixel" data-portrait="gabi" src="${portrait('gabi',prefs.appearance)}" alt="Vista previa del avatar de Gabi"><div class="color-fields">${(['shirt','hair','skin']as const).map((key,i)=>`<label>${['Ropa','Pelo','Piel'][i]}<input id="${key}" type="color" value="${prefs.appearance[key]}"></label>`).join('')}</div></div><label class="setting-row">Peinado<select id="hairstyle">${options([['short','Corto'],['curly','Rulos'],['long','Largo']],prefs.appearance.hairstyle)}</select></label><label class="setting-row">Vestimenta<select id="outfit">${options([['sweater','Suéter'],['hoodie','Buzo'],['shirt','Camisa']],prefs.appearance.outfit)}</select></label><label class="setting-row">Accesorio<select id="accessory">${options([['none','Ninguno'],['cap','Gorra'],['headphones','Auriculares']],prefs.appearance.accessory)}</select></label><label class="setting-row"><span>Barba</span><input type="checkbox" id="beard" ${prefs.appearance.beard?'checked':''}></label><label class="setting-row"><span>Anteojos</span><input type="checkbox" id="glasses" ${prefs.appearance.glasses?'checked':''}></label></div>
    <div class="settings-section"><h3>Ambiente y movimiento</h3><label class="setting-row"><span>Reducir movimiento<small>Sin ciclos repetidos ni recorridos automáticos.</small></span><input type="checkbox" id="reduced" ${prefs.reducedMotion?'checked':''}></label><label class="setting-row"><span>Humor de sitcom</span><input type="checkbox" id="humor" ${prefs.humor?'checked':''}></label><label class="setting-row">Frecuencia<select id="humor-frequency">${options([['moderate','Moderada'],['low','Baja']],prefs.humorFrequency)}</select></label><label class="setting-row"><span>Bienvenida al abrir sesión<small>Una vez por sesión y siempre omisible.</small></span><input type="checkbox" id="welcome" ${prefs.welcome?'checked':''}></label><label class="setting-row">Rendimiento<select id="quality">${options([['auto','Automático'],['high','Alto · hasta 60 FPS'],['balanced','Equilibrado'],['low','Liviano · hasta 30 FPS']],prefs.quality)}</select></label><label class="setting-row"><span>Detalles y luces</span><input type="checkbox" id="details" ${prefs.details?'checked':''}></label></div>
    <div class="settings-section"><h3>Luz y horario</h3><label class="setting-row">Ciclo visual<select id="time-preview">${options([['real','Horario real · Buenos Aires'],['morning','Vista previa: mañana'],['day','Vista previa: día'],['evening','Vista previa: tarde/noche'],['night','Vista previa: madrugada']],prefs.timePreview)}</select></label><p class="panel-note">De madrugada la oficina se vacía. Seleccionar a alguien permite una animación a pedido; no representa horas extra ni actividad de IA.</p></div>
    <div class="settings-section"><h3>Audio original y opcional</h3><p class="modal-intro">Activá el botón de audio de la cabecera para escuchar.</p><label class="volume-row" for="music-volume">Música <output id="music-value">${Math.round(prefs.musicVolume*100)} %</output><input id="music-volume" type="range" min="0" max="100" value="${prefs.musicVolume*100}"></label><label class="volume-row" for="effects-volume">Efectos <output id="effects-value">${Math.round(prefs.effectsVolume*100)} %</output><input id="effects-volume" type="range" min="0" max="100" value="${prefs.effectsVolume*100}"></label><p class="panel-note">Poner un canal en cero lo silencia. La música y los efectos se detienen al ocultar la página.</p></div>`);
    const checked=(id:string)=>$<HTMLInputElement>(id).checked,value=(id:string)=>$<HTMLInputElement>(id).value;
    const update=()=>{
      prefs={reducedMotion:checked('#reduced'),humor:checked('#humor'),humorFrequency:value('#humor-frequency') as Preferences['humorFrequency'],quality:value('#quality') as Preferences['quality'],details:checked('#details'),welcome:checked('#welcome'),timePreview:value('#time-preview') as Preferences['timePreview'],musicVolume:Number(value('#music-volume'))/100,effectsVolume:Number(value('#effects-volume'))/100,appearance:{shirt:value('#shirt'),hair:value('#hair'),skin:value('#skin'),beard:checked('#beard'),glasses:checked('#glasses'),hairstyle:value('#hairstyle') as Preferences['appearance']['hairstyle'],outfit:value('#outfit') as Preferences['appearance']['outfit'],accessory:value('#accessory') as Preferences['appearance']['accessory']}};
      command({type:'preferences',value:structuredClone(prefs)});audio.setPreferences(prefs);updatePortraits();
      $('#music-value').textContent=`${Math.round(prefs.musicVolume*100)} %`;$('#effects-value').textContent=`${Math.round(prefs.effectsVolume*100)} %`;
      if(!prefs.humor)$('#speech').hidden=true;
      if(!savePreferences(prefs))toast('El navegador no permite guardar preferencias. Se aplican a esta sesión.');
    };
    $('#modal-content').querySelectorAll('input,select').forEach(el=>el.addEventListener('change',update));
    for(const id of ['#music-volume','#effects-volume'])$(id).addEventListener('input',update);
  }
  function nextLine(){
    clearTimeout(sceneTimer);if(!sceneId)return;
    const data=scenes[sceneId];sceneStep++;
    if(sceneStep>=data.lines.length){command({type:'stop-scene'});return;}
    const line=data.lines[sceneStep];
    $('#scene-body').innerHTML=`<div class="scene-speaker"><img class="pixel" src="${portrait(line.speaker,prefs.appearance)}" alt=""><span>${cast[line.speaker].name}<small>${cast[line.speaker].role}</small></span></div><p>${line.text}</p>`;
    $('#scene-progress').textContent=`${sceneStep+1} / ${data.lines.length}`;
    $('#scene-next').textContent=sceneStep===data.lines.length-1?'Terminar →':'Siguiente →';
    officeBus.dispatchEvent(new CustomEvent('scene-line',{detail:line}));scheduleLine();
  }
  function scheduleLine(){
    clearTimeout(sceneTimer);if(!automatic||!sceneId||document.hidden||sceneStep<0)return;
    sceneTimer=setTimeout(()=>{if(dialog.open||!$('#character-panel').hidden){scheduleLine();return;}nextLine();},6500);
  }
  $('#help').onclick=()=>openModal('MANUAL DE BIENVENIDA',`<h2 id="modal-title">Vos llevás el timón.</h2><ol class="help-list"><li><b>Explorá.</b> Arrastrá con mouse o un dedo. Rueda, pinza o botones para acercarte.</li><li><b>Conocé al elenco.</b> Tocá un sprite, su nombre o Equipo. Cada personaje tiene una rutina propia y un confesionario.</li><li><b>Elegí una escena.</b> Desde Lugares o el menú de escenas. Podés pausarla, avanzar u omitirla; nunca te cambia la cámara.</li><li><b>Probá el ambiente.</b> Configurá audio, humor, avatar, gráficos y vistas previas del día/noche.</li></ol><p class="panel-note">Teclado: + / − para zoom, Inicio para vista general y Escape para cerrar. Tab y Enter permiten usar los controles HTML. Todo es ambientación local; no hay IA ni tareas reales conectadas.</p>`);
  $('#settings').onclick=openSettings;$('#team').onclick=teamMenu;$('#places').onclick=placesMenu;$('#view-scenes').onclick=sceneMenu;
  $('#close-modal').onclick=()=>dialog.close();$('#close-panel').onclick=closePanel;$('#dismiss-speech').onclick=()=>$('#speech').hidden=true;
  $('#audio-toggle').onclick=async()=>{
    try{const enabled=await audio.toggle();updateAudio(enabled);toast(enabled?'Audio activado. Volúmenes separados en Configuración.':'Audio silenciado.');}catch{updateAudio(false);toast('El audio no está disponible. La oficina sigue funcionando.');}
  };
  function updateAudio(enabled:boolean){$('#audio-toggle').setAttribute('aria-pressed',String(enabled));$('#audio-toggle').setAttribute('aria-label',enabled?'Silenciar audio':'Activar audio');$('#audio-toggle').title=enabled?'Audio activado':'Audio apagado';$('#audio-toggle').classList.toggle('active',enabled);}
  officeBus.addEventListener('audio-state',e=>updateAudio((e as CustomEvent<boolean>).detail));
  $('#zoom-in').onclick=()=>command({type:'camera',action:'in'});$('#zoom-out').onclick=()=>command({type:'camera',action:'out'});$('#reset-camera').onclick=()=>command({type:'camera',action:'reset'});
  $('#follow-camera').onclick=()=>command({type:'camera',action:follow?'stop':'follow',id:selected&&isCharacter(selected)?selected:'gabito'});$('#stop-follow').onclick=()=>command({type:'camera',action:'stop'});
  $('#skip-scene').onclick=()=>command({type:'stop-scene'});$('#scene-next').onclick=()=>{if(sceneStep>=0)nextLine();};
  $('#scene-auto').onclick=()=>{automatic=!automatic;$('#scene-auto').textContent=automatic?'Pausar':'Reanudar';$('#scene-auto').setAttribute('aria-pressed',String(automatic));scheduleLine();};
  app.addEventListener('click',event=>{
    const b=(event.target as Element).closest<HTMLButtonElement>('button');if(!b||b.disabled)return;
    if(b.dataset.select){if(!ready)return;dialog.close();command({type:'select',id:b.dataset.select as OfficeSelection});}
    if(b.dataset.scene){if(ready)chooseScene(b.dataset.scene as SceneId);}
    if(b.dataset.action&&selected&&isCharacter(selected)){
      command({type:'action',id:selected,action:b.dataset.action as CharacterAction});toast('Animación ambiental.');
      if(matchMedia('(max-width:600px)').matches)closePanel();
    }
  });
  officeBus.addEventListener('selection',e=>openPanel((e as CustomEvent<OfficeSelection>).detail));
  officeBus.addEventListener('ready',()=>{ready=true;$('#loading').remove();app.querySelectorAll<HTMLButtonElement>('.requires-office').forEach(b=>b.disabled=false);});
  officeBus.addEventListener('status',e=>{const status=(e as CustomEvent<OfficeStatus>).detail;follow=status.following;$('#zoom').textContent=`${Math.round(status.zoom*100)} %`;$('#follow-camera').classList.toggle('active',!!follow);$('#follow-camera').setAttribute('aria-pressed',String(!!follow));$('#stop-follow').hidden=!follow;if(follow)$('#stop-follow').innerHTML=`Siguiendo a ${cast[follow].name} <span>Dejar de seguir ×</span>`;});
  officeBus.addEventListener('ambient',e=>{if(!prefs.humor||dialog.open||sceneId)return;const detail=(e as CustomEvent<AmbientEvent>).detail;clearTimeout(bubbleTimer);$('#speech-author').textContent=`${cast[detail.character].name.toUpperCase()} · AMBIENTACIÓN`;$('#speech-text').textContent=detail.text;$('#speech').hidden=false;bubbleTimer=setTimeout(()=>$('#speech').hidden=true,8000);});
  officeBus.addEventListener('scene-started',e=>{clearTimeout(sceneTimer);sceneId=(e as CustomEvent<SceneId>).detail;sceneStep=-1;$('#scene-player').hidden=false;$('#scene-title').textContent=scenes[sceneId].title;$('#scene-body').innerHTML='<p>El equipo se acerca… Podés seguir explorando u omitir la escena.</p>';$('#scene-progress').textContent='PREPARANDO';$('#scene-next').textContent='Siguiente →';$('#scene-next').setAttribute('disabled','');$('#speech').hidden=true;document.body.classList.add('scene-active');});
  officeBus.addEventListener('scene-ready',()=>{$('#scene-next').removeAttribute('disabled');if(sceneId)nextLine();});
  officeBus.addEventListener('scene-stopped',()=>{clearTimeout(sceneTimer);sceneId=null;sceneStep=-1;$('#scene-player').hidden=true;document.body.classList.remove('scene-active');});
  officeBus.addEventListener('scene-failed',()=>toast('No quedó espacio para reunir al equipo. Podés volver a intentar.'));
  officeBus.addEventListener('manual-preview',()=>{if(document.body.dataset.phase==='night')$('#phase-badge').textContent=`${prefs.timePreview==='real'?'':'Vista previa · '}Madrugada · Escena a pedido`;});
  officeBus.addEventListener('environment',e=>{const d=(e as CustomEvent<{phase:keyof typeof phaseNames;preview:boolean;population:number}>).detail;$('#phase-badge').textContent=`${d.preview?'Vista previa · ':''}${phaseNames[d.phase]}${d.population===0?' · Sin personal en horario':''}`;$('#phase-badge').classList.toggle('preview',d.preview);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(sceneTimer);else scheduleLine();});
  document.addEventListener('keydown',e=>{
    if(dialog.open||e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement)return;
    if(e.key==='Escape'){closePanel();$('#speech').hidden=true;command({type:'camera',action:'stop'});if(sceneId)command({type:'stop-scene'});}
    if(!ready)return;if(e.key==='+'||e.key==='=')command({type:'camera',action:'in'});if(e.key==='-')command({type:'camera',action:'out'});if(e.key==='Home'){e.preventDefault();command({type:'camera',action:'reset'});}
  });
  const clock=()=>$('#clock').textContent=new Intl.DateTimeFormat('es-AR',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'America/Argentina/Buenos_Aires'}).format(new Date());clock();setInterval(clock,30000);
  return {fail:(message:string)=>{$('#loading').textContent=message;}};
}
