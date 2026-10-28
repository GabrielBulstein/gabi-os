const privateChat=import.meta.env.DEV||import.meta.env.VITE_PRIVATE_OFFICE==='1';
type DesktopStatus={schema:1;checkedAt:string;host:'desktop';mode:'read-only';memory:{totalMB:number;freeMB:number};cpu:{model:string;logicalCores:number};gateway:'live'|'unverified'|'unreachable';agentResponseVerified:false;taskSubmission:false};

export function mountDesktop(openModal:(kicker:string,content:string)=>void){
  let controller:AbortController|undefined;
  const open=()=>{
    controller?.abort();
    openModal('INFRAESTRUCTURA · PC DE ESCRITORIO',`<h2 id="modal-title">El motor de la oficina.</h2><p class="modal-intro">La PC de escritorio alojará los agentes. La Philco queda fuera de esta conexión.</p><p id="desktop-status" role="status">${privateChat?'Consultá el servidor para ver datos reales de esta PC.':'El diagnóstico local está disponible al ejecutar la aplicación en la PC. GitHub Pages conserva la oficina independiente.'}</p><dl id="desktop-facts" class="desktop-facts"></dl><button id="desktop-check" class="wide-action" ${privateChat?'':'disabled'}>Consultar servidor local</button><p class="panel-note">Este diagnóstico es de solo lectura. La salud del gateway no verifica al agente: comprobá sus respuestas desde el chat de Gabito. Este botón no envía tareas ni mensajes. El iPhone usa la dirección HTTPS privada de Tailscale. GitHub Pages conserva la oficina sin chat privado.</p>`);
    const button=document.querySelector<HTMLButtonElement>('#desktop-check')!;
    const status=document.querySelector<HTMLElement>('#desktop-status')!;
    const facts=document.querySelector<HTMLElement>('#desktop-facts')!;
    button.onclick=async()=>{
      button.disabled=true;status.textContent='Consultando la PC…';facts.replaceChildren();
      controller=new AbortController();const timeout=setTimeout(()=>controller?.abort(),5000);
      try{
        const response=await fetch('/__desktop/status',{signal:controller.signal,cache:'no-store',redirect:'error'});
        if(!response.ok)throw new Error('unavailable');
        const data=await response.json() as DesktopStatus;
        if(data.schema!==1||data.host!=='desktop'||data.mode!=='read-only'||!Number.isFinite(data.memory?.freeMB)||!Number.isFinite(data.memory?.totalMB)||!Number.isFinite(Date.parse(data.checkedAt))||!['live','unverified','unreachable'].includes(data.gateway)||data.agentResponseVerified!==false||data.taskSubmission!==false)throw new Error('invalid');
        status.textContent='Servidor de escritorio disponible · Consulta real';
        for(const [label,value] of [
          ['Memoria libre',`${(data.memory.freeMB/1024).toFixed(1)} de ${(data.memory.totalMB/1024).toFixed(1)} GB`],
          ['Gateway de agentes',data.gateway==='live'?'Proceso accesible; agente sin verificar':data.gateway==='unverified'?'Respuesta no verificable':'Sin iniciar o sin configurar'],
          ['Última consulta',new Date(data.checkedAt).toLocaleTimeString('es-AR')],
          ['Tareas reales','Todavía no habilitadas'],
        ]){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;facts.append(dt,dd);}
      }catch{status.textContent='Servidor no disponible. En la PC ejecutá npm run server y volvé a consultar.';}
      finally{clearTimeout(timeout);button.disabled=false;}
    };
  };
  document.querySelector<HTMLButtonElement>('#desktop')!.onclick=open;
}
