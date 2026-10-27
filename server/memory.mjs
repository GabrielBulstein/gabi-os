const aliases={materiales:'material',comprar:'compra',compras:'compra',taller:'workshop',talleres:'workshop'};
const stop=new Set('que qué para por con como cómo debo debe tengo tienes necesito necesita los las una uno unos unas del desde este esta esto eso puedo puedes sobre cuál cuales cuáles recordar recuerdas'.split(' '));
export function normalize(text){return text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
export function tokens(text){return [...new Set((normalize(text).match(/[\p{L}\p{N}]{2,}/gu)||[]).filter(t=>!stop.has(t)).map(t=>aliases[t]||t))];}
export function redact(text){return text.replace(/\b(?:sk-|gh[pousr]_)[A-Za-z0-9_-]{12,}/g,'[credencial omitida]').replace(/((?:api[_ -]?key|access[_ -]?token|password|contrase[ñn]a|secret)\s*[:=]\s*)\S+/gi,'$1[omitido]').replace(/\+\d{10,15}\b/g,'[teléfono omitido]');}
export function buildMemoryIndex(documents){
 const chunks=[];
 for(const doc of documents){
  const text=redact(doc.text);
  for(let offset=0;offset<text.length;offset+=1600){const body=text.slice(offset,offset+1900);chunks.push({source:doc.source,kind:doc.kind||'note',text:body,terms:new Set(tokens(body))});}
 }
 const frequencies=new Map();
 for(const chunk of chunks)for(const token of chunk.terms)frequencies.set(token,(frequencies.get(token)||0)+1);
 return {chunks,frequencies};
}
export function retrieveMemory(index,question,limit=5,budget=11000){
 const query=tokens(question);
 const ranked=index.chunks.map(chunk=>{
  let score=0,hits=0;
  for(const word of query)if(chunk.terms.has(word)){hits++;score+=1+Math.log(1+index.chunks.length/(index.frequencies.get(word)||1));}
  if(hits>1)score*=1+hits*.7;
  if(chunk.kind==='note')score*=1.08;
  return {chunk,score,hits};
 }).filter(x=>x.hits>=Math.min(2,query.length)&&x.score>0).sort((a,b)=>b.score-a.score);
 const selected=[],seen=new Set();let used=0;
 for(const {chunk} of ranked){
  const key=chunk.source+':'+chunk.text.slice(0,100);
  if(seen.has(key)||used+chunk.text.length>budget)continue;
  seen.add(key);selected.push(chunk);used+=chunk.text.length;
  if(selected.length===limit)break;
 }
 return selected.map(({source,text,kind})=>({source,text,kind}));
}

