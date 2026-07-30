const $ = (id) => document.getElementById(id);
const euro = new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'});
const percent = (value) => value == null ? '—' : new Intl.NumberFormat('es-ES',{style:'percent',maximumFractionDigits:1}).format(value);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const statusText = {uploaded:'Subido',analyzing:'Analizando',review:'Revisión',completed:'Completado',failed:'Error'};
let documents = [];

function showView(name){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('[data-view]').forEach(a=>a.classList.toggle('active',a.dataset.view===name));
  const target=$('view-'+name) || $('view-dashboard'); target.classList.add('active');
  $('page-title').textContent={dashboard:'Dashboard',documents:'Documentos',recommendations:'Recomendaciones',workbench:'Document Workbench',knowledge:'Knowledge Center'}[name]||'Dashboard';
}
function route(){showView((location.hash||'#dashboard').slice(1));}
window.addEventListener('hashchange',route); document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>location.hash=b.dataset.go));

function documentRows(items, compact=false){
  if(!items.length) return '<div class="empty">Todavía no hay documentos. Empieza desde Nueva importación.</div>';
  if(compact) return items.slice(0,6).map(d=>`<div class="document-row"><div><strong>${escapeHtml(d.fileName)}</strong><small>${escapeHtml(d.supplier)} · ${new Date(d.createdAt).toLocaleString('es-ES')}</small></div><span class="badge ${d.status}">${statusText[d.status]||d.status}</span></div>`).join('');
  return `<table><thead><tr><th>Documento</th><th>Proveedor</th><th>Estado</th><th>Productos</th><th>Confianza</th><th>Fecha</th></tr></thead><tbody>${items.map(d=>`<tr><td><strong>${escapeHtml(d.fileName)}</strong><br><small>${Math.round(d.size/1024).toLocaleString('es-ES')} KB</small></td><td>${escapeHtml(d.supplier)}</td><td><span class="badge ${d.status}">${statusText[d.status]||d.status}</span></td><td>${d.productsDetected}</td><td>${percent(d.confidence)}</td><td>${new Date(d.createdAt).toLocaleString('es-ES')}</td></tr>`).join('')}</tbody></table>`;
}
async function load(){
  try{
    const [health,statsResponse,docsResponse]=await Promise.all([fetch('/health'),fetch('/api/v1/import-workbench/stats'),fetch('/api/v1/import-workbench/documents')]);
    if(!health.ok||!statsResponse.ok||!docsResponse.ok) throw new Error('API no disponible');
    const stats=await statsResponse.json(); const data=await docsResponse.json(); documents=data.documents||[];
    $('api-dot').className='dot ok'; $('api-status').textContent='Servidor conectado';
    $('stat-documents').textContent=stats.documents.toLocaleString('es-ES'); $('stat-products').textContent=stats.products.toLocaleString('es-ES'); $('stat-pending').textContent=stats.pendingReview.toLocaleString('es-ES'); $('stat-confidence').textContent=percent(stats.averageConfidence);
    $('recent-documents').innerHTML=documentRows(documents,true); $('documents-table').innerHTML=documentRows(documents,false);
  }catch(error){$('api-dot').className='dot error';$('api-status').textContent='Servidor sin respuesta';$('recent-documents').innerHTML='<div class="empty">No se pudo cargar la actividad.</div>';$('documents-table').innerHTML='<div class="empty">No se pudieron cargar los documentos.</div>';}
}
$('refresh').addEventListener('click',load);
$('recommend').addEventListener('click',async()=>{
  const query=$('query').value.trim(); if(query.length<2){$('recommend-error').innerHTML='<div class="error">Escribe una necesidad.</div>';return;}
  $('recommend-error').innerHTML='';$('recommend').disabled=true;$('recommend-status').textContent='Buscando…';$('recommend-results').innerHTML='';
  const body={query,customizable:$('customizable').checked,limit:Number($('limit').value)||12}; if($('budget').value)body.budget=Number($('budget').value);if($('quantity').value)body.quantity=Number($('quantity').value);
  try{const response=await fetch('/api/v1/recommendations',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw new Error(data.message||'Error en la API');$('recommend-meta').textContent=`${data.evaluated} productos evaluados · ${data.durationMs} ms`;$('recommend-results').innerHTML=data.items.length?data.items.map(item=>`<article class="result-card"><span class="score">${item.score} puntos</span><h3>${escapeHtml(item.name)}</h3>${item.shortDescription?`<p>${escapeHtml(item.shortDescription)}</p>`:''}<div class="price">${item.price?euro.format(item.price.amount):'Precio no disponible'}</div><ul>${item.reasons.map(r=>`<li>${escapeHtml(r)}</li>`).join('')}</ul></article>`).join(''):'<div class="panel empty">No se encontraron productos.</div>';}catch(error){$('recommend-error').innerHTML=`<div class="error">${escapeHtml(error.message)}</div>`;}finally{$('recommend').disabled=false;$('recommend-status').textContent='';}
});
route();load();
