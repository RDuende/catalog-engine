import type { FastifyInstance } from "fastify";

const studioHtml = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Catalog Studio</title>
  <style>
    :root{font-family:Inter,system-ui,sans-serif;color:#172018;background:#f4f6f2;line-height:1.45}
    *{box-sizing:border-box}body{margin:0}.shell{display:grid;grid-template-columns:240px 1fr;min-height:100vh}
    aside{background:#18231b;color:#fff;padding:28px 20px}.brand{font-size:21px;font-weight:800}.version{font-size:12px;opacity:.6;margin-top:3px}
    nav{margin-top:36px;display:grid;gap:8px}nav button{border:0;background:transparent;color:#dfe7df;text-align:left;padding:11px 12px;border-radius:10px;font-size:14px}
    nav button.active{background:#2f4935;color:#fff;font-weight:700}main{padding:34px;max-width:1240px;width:100%;margin:auto}
    h1{margin:0 0 6px;font-size:30px}.subtitle{color:#647066;margin-bottom:28px}.panel{background:#fff;border:1px solid #dfe5dc;border-radius:16px;padding:22px;box-shadow:0 8px 28px rgba(25,42,28,.06)}
    textarea,input{width:100%;border:1px solid #cbd4c8;border-radius:10px;padding:12px;font:inherit;background:#fff}textarea{min-height:115px;resize:vertical}
    .grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:14px;margin-top:14px}.check{display:flex;gap:9px;align-items:center;margin-top:16px}.check input{width:auto}
    .actions{display:flex;gap:12px;align-items:center;margin-top:18px}button.primary{border:0;border-radius:10px;background:#355d3e;color:white;font-weight:750;padding:12px 18px;cursor:pointer}
    button.primary:disabled{opacity:.55}.status{color:#69756b;font-size:14px}.results{display:grid;grid-template-columns:repeat(auto-fill,minmax(275px,1fr));gap:16px;margin-top:22px}
    .card{background:#fff;border:1px solid #dfe5dc;border-radius:14px;overflow:hidden}.image{height:160px;background:#eef2eb;display:flex;align-items:center;justify-content:center;color:#899389}
    .image img{width:100%;height:100%;object-fit:contain}.content{padding:16px}.score{display:inline-flex;background:#e5f1e7;color:#285032;border-radius:999px;padding:4px 9px;font-weight:800;font-size:13px}
    .card h3{font-size:17px;margin:11px 0 6px}.price{font-size:18px;font-weight:800;margin:9px 0}.reasons{padding-left:18px;color:#58645a;font-size:13px}.meta{margin-top:18px;color:#738075;font-size:13px}
    .empty{padding:36px;text-align:center;color:#6b756d}.error{background:#fff0f0;color:#8b2525;padding:12px;border-radius:10px;margin-top:14px}
    @media(max-width:820px){.shell{display:block}aside{padding:18px}nav{display:none}main{padding:20px}.grid{grid-template-columns:1fr}}
  </style>
</head>
<body>
<div class="shell">
  <aside><div class="brand">Catalog Studio</div><div class="version">Release 0.3.0</div><nav><button class="active">Recommendation Lab</button><button disabled>Import Center</button><button disabled>Knowledge Graph</button><button disabled>Jobs</button></nav></aside>
  <main><h1>Recommendation Lab</h1><div class="subtitle">Prueba el motor de recomendaciones con el catálogo real.</div>
    <section class="panel"><label for="query"><strong>¿Qué necesita el cliente?</strong></label><textarea id="query" placeholder="Ej.: Necesito 300 botellas reutilizables para una carrera, personalizables y por menos de 6 €"></textarea>
      <div class="grid"><label>Presupuesto unitario (€)<input id="budget" type="number" min="0" step="0.01" placeholder="6"></label><label>Cantidad<input id="quantity" type="number" min="1" step="1" placeholder="300"></label><label>N.º resultados<input id="limit" type="number" min="1" max="50" value="12"></label></div>
      <label class="check"><input id="customizable" type="checkbox"> Solo productos personalizables</label>
      <div class="actions"><button id="submit" class="primary">Obtener recomendaciones</button><span id="status" class="status"></span></div><div id="error"></div>
    </section>
    <div id="meta" class="meta"></div><section id="results" class="results"><div class="panel empty">Escribe una necesidad para comenzar.</div></section>
  </main>
</div>
<script>
const euro = new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'});
const $ = (id) => document.getElementById(id);
function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
$('submit').addEventListener('click', async () => {
  const query=$('query').value.trim(); if(query.length<2){$('error').innerHTML='<div class="error">Escribe una consulta.</div>';return;}
  $('error').innerHTML='';$('submit').disabled=true;$('status').textContent='Buscando…';$('results').innerHTML='';$('meta').textContent='';
  const body={query,customizable:$('customizable').checked,limit:Number($('limit').value)||12};
  if($('budget').value) body.budget=Number($('budget').value); if($('quantity').value) body.quantity=Number($('quantity').value);
  try{const response=await fetch('/api/v1/recommendations',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw new Error(data.message||'Error en la API');
    $('meta').textContent=data.evaluated+' productos evaluados · '+data.durationMs+' ms · términos: '+(data.normalizedTerms.join(', ')||'ninguno');
    if(!data.items.length){$('results').innerHTML='<div class="panel empty">No se encontraron productos. Prueba una consulta más amplia.</div>';return;}
    $('results').innerHTML=data.items.map(item=>'<article class="card"><div class="image">'+(item.imageUrl?'<img src="'+escapeHtml(item.imageUrl)+'" alt="">':'Sin imagen')+'</div><div class="content"><span class="score">'+item.score+' puntos</span><h3>'+escapeHtml(item.name)+'</h3>'+(item.shortDescription?'<div>'+escapeHtml(item.shortDescription)+'</div>':'')+(item.price?'<div class="price">'+euro.format(item.price.amount)+'</div>':'<div class="price">Precio no disponible</div>')+'<ul class="reasons">'+item.reasons.map(r=>'<li>'+escapeHtml(r)+'</li>').join('')+'</ul></div></article>').join('');
  }catch(error){$('error').innerHTML='<div class="error">'+escapeHtml(error.message)+'</div>';}
  finally{$('submit').disabled=false;$('status').textContent='';}
});
</script></body></html>`;

export async function catalogStudioRoutes(app: FastifyInstance): Promise<void> {
  app.get("/studio", async (_request, reply) => reply.type("text/html; charset=utf-8").send(studioHtml));
  app.get("/playground", async (_request, reply) => reply.redirect("/studio"));
}
