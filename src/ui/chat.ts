import './chat.css';
type Message={id:string;role:'user'|'assistant';text:string;sources?:string[]};
const errors:Record<string,string>={busy:'Gabito está respondiendo. Esperá y volvé a abrir la conversación.',response_uncertain:'No pudimos confirmar la respuesta. Revisá el historial antes de volver a enviar para evitar consumir otra consulta.',quota_or_rate_limit:'La cuenta alcanzó un límite temporal. Intentá más tarde.',model_unavailable:'El modelo no está disponible. Revisá el gateway local.',memory_not_ready:'La memoria todavía no está preparada.',profile_not_ready:'El perfil local necesita revisión.',commands_disabled:'Este chat solo conversa; no acepta comandos.'};
export function mountChat(openModal:(kicker:string,html:string)=>void){
 let pending=false;
 return async function openChat(){
  openModal('GABITO · CONVERSACIÓN REAL', '<h2 id="modal-title">Charlá con Gabito.</h2><p class="panel-note">Sol · razonamiento bajo · memoria local en D: · sin acciones externas</p><div id="chat-log" role="log" aria-label="Conversación con Gabito" aria-live="polite"></div><p id="chat-status" role="status"></p><form id="chat-form"><label for="chat-input">Tu mensaje</label><textarea id="chat-input" maxlength="4000" rows="3" placeholder="¿Qué querés recordar o conversar?"></textarea><button class="wide-action" id="chat-send" type="submit">Enviar a Gabito →</button></form>');
  const root=document.querySelector<HTMLElement>('#modal-content')!;
  const log=root.querySelector<HTMLElement>('#chat-log')!,status=root.querySelector<HTMLElement>('#chat-status')!;
  const form=root.querySelector<HTMLFormElement>('#chat-form')!,input=root.querySelector<HTMLTextAreaElement>('#chat-input')!,send=root.querySelector<HTMLButtonElement>('#chat-send')!;
  let token='',ready=false;
  const render=(messages:Message[])=>{
   log.replaceChildren();
   for(const message of messages){
    const article=document.createElement('article');article.className='chat-message '+message.role;
    const author=document.createElement('strong');author.textContent=message.role==='user'?'Vos':'Gabito · respuesta de IA';
    const body=document.createElement('p');body.textContent=message.text;article.append(author,body);
    if(message.sources?.length){const sources=document.createElement('small');sources.textContent='Recuerdos consultados: '+message.sources.join(' · ');article.append(sources);}
    log.append(article);
   }
   log.scrollTop=log.scrollHeight;
  };
  const update=()=>{send.disabled=!ready||pending||!input.value.trim();input.disabled=!ready||pending;};
  update();
  if(!import.meta.env.DEV){status.textContent='La versión de GitHub Pages muestra la oficina. Abrí la oficina en localhost:5173 en esta PC para conversar con tu memoria privada.';return;}
  async function request(path:string,init:RequestInit={}){
   const response=await fetch('/__desktop/chat/'+path,{...init,cache:'no-store',headers:{'Content-Type':'application/json','X-Gabi-Session':token,...init.headers}});
   const data=await response.json();if(!response.ok)throw new Error(data.error||'unavailable');return data;
  }
  async function history(){const data=await request('history');render(data.messages);return data.status;}
  try{
   status.textContent='Abriendo la memoria local…';
   const session=await request('session');token=session.token;
   const state=await history();ready=state.available;
   status.textContent=pending||state.busy?'Gabito está pensando… Podés cerrar y volver a abrir.':ready?'El mensaje se envía solamente al pulsar Enviar.':'La memoria todavía no está preparada.';
   pending=Boolean(state.busy);
  }catch{status.textContent='Servidor local no disponible. Iniciá el servidor y el gateway en esta PC.';}
  update();input.oninput=update;
  if(pending){
   const monitor=async()=>{
    if(!log.isConnected)return;
    try{const state=await history();pending=Boolean(state.busy);if(!pending){status.textContent='Historial actualizado desde D:.';update();return;}}
    catch{status.textContent='No se pudo actualizar el historial. Cerrá y volvé a abrir la conversación.';return;}
    setTimeout(()=>void monitor(),2500);
   };
   setTimeout(()=>void monitor(),2500);
  }
  form.onsubmit=async event=>{
   event.preventDefault();if(!ready||pending||!input.value.trim())return;
   const text=input.value.trim(),requestId=crypto.randomUUID();pending=true;update();status.textContent='Gabito está pensando… Podés cerrar esta ventana; no se reenviará el mensaje.';
   const article=document.createElement('article');article.className='chat-message user';const author=document.createElement('strong');author.textContent='Vos';const body=document.createElement('p');body.textContent=text;article.append(author,body);log.append(article);log.scrollTop=log.scrollHeight;input.value='';
   try{await request('send',{method:'POST',body:JSON.stringify({text,requestId})});await history();status.textContent='Respuesta guardada en D:. Las escenas de la oficina siguen siendo ficticias.';}
   catch(error){status.textContent=errors[(error as Error).message]||'No se pudo completar la consulta. Volvé a abrir el chat para revisar el historial antes de reenviar.';}
   finally{pending=false;update();if(input.isConnected)input.focus();}
  };
 };
}

