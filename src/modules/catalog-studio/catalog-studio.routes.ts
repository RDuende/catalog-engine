import type { FastifyInstance } from "fastify";
import { CATALOG_ENGINE_VERSION } from "../../version.js";

const studioHtml = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>RecuerdArte Recommendation Lab</title>
  <style>
    :root{font-family:Inter,system-ui,sans-serif;color:#172018;background:#f4f6f2;line-height:1.45}
    *{box-sizing:border-box}body{margin:0}.shell{display:grid;grid-template-columns:250px 1fr;min-height:100vh}
    aside{background:#18231b;color:#fff;padding:28px 20px}.brand{font-size:21px;font-weight:800}.version{font-size:12px;opacity:.65;margin-top:3px}
    nav{margin-top:36px;display:grid;gap:8px}nav div{padding:11px 12px;border-radius:10px;color:#dfe7df}.active{background:#2f4935;font-weight:700}
    main{padding:34px;max-width:1280px;width:100%;margin:auto}h1{margin:0 0 6px;font-size:30px}.subtitle{color:#647066;margin-bottom:28px}
    .panel{background:#fff;border:1px solid #dfe5dc;border-radius:16px;padding:22px;box-shadow:0 8px 28px rgba(25,42,28,.06)}
    textarea,input{width:100%;border:1px solid #cbd4c8;border-radius:10px;padding:12px;font:inherit;background:#fff}textarea{min-height:115px;resize:vertical}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}.check{display:flex;gap:9px;align-items:center;margin-top:16px}.check input{width:auto}
    .actions{display:flex;gap:12px;align-items:center;margin-top:18px}button{border:0;border-radius:10px;background:#355d3e;color:white;font-weight:750;padding:12px 18px;cursor:pointer}button:disabled{opacity:.55}
    .status,.meta{color:#69756b;font-size:14px}.two{display:grid;grid-template-columns:1fr 1.4fr;gap:18px;margin-top:22px}.intent pre{white-space:pre-wrap;overflow:auto;background:#f4f6f2;padding:14px;border-radius:10px;font-size:12px}
    .results{display:grid;gap:14px}.card{background:#fff;border:1px solid #dfe5dc;border-radius:14px;padding:16px}.score{display:inline-flex;background:#e5f1e7;color:#285032;border-radius:999px;padding:4px 9px;font-weight:800;font-size:13px}
    .card h3{font-size:17px;margin:11px 0 6px}.price{font-size:18px;font-weight:800;margin:9px 0}.reasons{padding-left:18px;color:#58645a;font-size:13px}.error{background:#fff0f0;color:#8b2525;padding:12px;border-radius:10px;margin-top:14px}
    @media(max-width:900px){.shell{display:block}aside{padding:18px}nav{display:none}main{padding:20px}.grid,.two{grid-template-columns:1fr}}
  </style>
</head>
<body>
<div class="shell">
  <aside><div class="brand">RecuerdArte Lab</div><div class="version">Catalog Engine v${CATALOG_ENGINE_VERSION}</div><nav><div class="active">Intent + Recommendations</div><div>Knowledge Graph</div><div>Import Center</div></nav></aside>
  <main>
    <h1>Intent & Recommendation Playground</h1>
    <div class="subtitle">Escribe una necesidad real y revisa cómo la interpreta el motor antes de recomendar.</div>
    <section class="panel">
      <label for="query"><strong>¿Qué necesita el cliente?</strong></label>
      <textarea id="query" placeholder="Ej.: Necesito 40 regalos de madera para una profesora por menos de 25 euros, personalizados"></textarea>
      <div class="grid">
        <label>N.º de resultados<input id="limit" type="number" min="1" max="50" value="10"></label>
        <label class="check"><input id="debug" type="checkbox"> Mostrar desglose de puntuación</label>
      </div>
      <div class="actions"><button id="submit">Analizar y recomendar</button><span id="status" class="status"></span></div>
      <div id="error"></div>
    </section>
    <div class="two">
      <section class="panel intent"><h2>Intención detectada</h2><pre id="intent">Todavía no hay análisis.</pre></section>
      <section><div id="meta" class="meta"></div><div id="results" class="results"><div class="panel">Escribe una consulta para comenzar.</div></div></section>
    </div>
  </main>
</div>
<script>
const euro=new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'});const $=(id)=>document.getElementById(id);
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
$('submit').addEventListener('click',async()=>{const query=$('query').value.trim();if(query.length<2){$('error').innerHTML='<div class="error">Escribe una consulta.</div>';return;}
$('error').innerHTML='';$('submit').disabled=true;$('status').textContent='Analizando…';$('results').innerHTML='';$('meta').textContent='';
try{const response=await fetch('/api/v1/intent/recommend',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query,limit:Number($('limit').value)||10,debug:$('debug').checked})});const data=await response.json();if(!response.ok)throw new Error(data.message||'Error en la API');
$('intent').textContent=JSON.stringify(data.analysis,null,2);const rec=data.recommendations;$('meta').textContent=rec.totalCandidates+' candidatos · '+rec.elapsedMs+' ms';
if(!rec.items.length){$('results').innerHTML='<div class="panel">No se encontraron productos compatibles.</div>';return;}
$('results').innerHTML=rec.items.map(item=>'<article class="card"><span class="score">'+item.score+' puntos</span><h3>'+esc(item.name)+'</h3>'+(item.description?'<div>'+esc(item.description)+'</div>':'')+'<div class="price">'+(item.unitPrice===null?'Precio no disponible':euro.format(item.unitPrice))+'</div><ul class="reasons">'+item.reasons.map(r=>'<li>'+esc(r)+'</li>').join('')+'</ul>'+(item.breakdown?'<pre>'+esc(JSON.stringify(item.breakdown,null,2))+'</pre>':'')+'</article>').join('');
}catch(error){$('error').innerHTML='<div class="error">'+esc(error.message)+'</div>';}finally{$('submit').disabled=false;$('status').textContent='';}});
</script></body></html>`;

export async function catalogStudioRoutes(app: FastifyInstance): Promise<void> {
  app.get("/studio", async (_request, reply) => reply.type("text/html; charset=utf-8").send(studioHtml));
  app.get("/playground", async (_request, reply) => reply.redirect("/studio"));
}
