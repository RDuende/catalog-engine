import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

export interface PdfBounds { x: number; y: number; width: number; height: number; pageWidth: number; pageHeight: number }
export interface AnalyzerEvidence { id: string; page: number; kind: "text"|"table"|"icon"|"rule"|"human"; value: string; confidence: number; bounds?: PdfBounds }
export interface AnalyzerField { value: string; confidence: number; evidence: AnalyzerEvidence[] }
export interface AnalyzerProduct {
  id: string; page: number; bounds?: PdfBounds;
  reference: AnalyzerField; name: AnalyzerField; category: AnalyzerField; material: AnalyzerField; dimensions: AnalyzerField;
  features: string[]; prices: Array<{quantity:number;price:number}>; confidence:number; reviewStatus:"pending"|"approved"|"corrected";
}
export interface PdfCatalogResult { pages:number; blocks:number; products:AnalyzerProduct[] }

type TextItem = { str:string; transform:number[]; width:number; height:number };
type Line = { text:string; x:number; y:number; width:number; height:number; items:TextItem[] };
type Header = { line: Line; name: string; reference: string; x: number; width: number };

// No se ancla al final: Makito suele colocar iconos o textos después de "Nombre 22439".
const identityRx = /\b([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚáéíóúñÑ0-9'’\- ]{1,35}?)\s+(\d{4,6})\b/g;
const dimensionsRx = /\b\d+(?:[.,]\d+)?\s*[×xX]\s*\d+(?:[.,]\d+)?(?:\s*[×xX]\s*\d+(?:[.,]\d+)?)?\s*cm\b/i;
const categoryRx = /\b(BACKPACKS|BAGS|TECHNOLOGY|BUSINESS|OFFICE|NOTEBOOKS|DRINKWARE|MUGS|CUPS|WRITING|SPORTS|TRAVEL|HOME|TEXTILE|KIDS|PETS|CAR|TOOLS|HEADWEAR|SUMMER|RAIN|PACKAGING)\b/i;
const rejectedNames = /^(Desde|Página|Page|Print Code|Color Printing|Strap|Pocket|Compartment)$/i;

function ev(page:number, kind:AnalyzerEvidence['kind'], value:string, confidence:number, bounds?:PdfBounds):AnalyzerEvidence { return {id:randomUUID(),page,kind,value,confidence,bounds}; }
function fld(value:string, confidence:number, evidence:AnalyzerEvidence[]):AnalyzerField { return {value,confidence,evidence}; }
function normalizePrice(raw:string):number { return Number(raw.replace(/\./g,'').replace(',','.')); }
function materialFrom(text:string):string {
  const tokens=['Poliéster 600D RPET','Polyester 600D RPET','Poliéster 600D','Polyester 600D','Poliéster','Polyester','Nylon','PU','RPET','Algodón','Cotton','Acero Inoxidable','Stainless Steel','Aluminio','Aluminium','Bambú','Bamboo','Cristal','Glass','Cerámica','Ceramic','ABS','PVC'];
  return tokens.find(t=>text.toLowerCase().includes(t.toLowerCase())) ?? 'Sin confirmar';
}
function linesFromItems(items:TextItem[]):Line[] {
  const sorted=[...items].filter(i=>i.str.trim()).sort((a,b)=>Math.abs((b.transform[5]??0)-(a.transform[5]??0))>3?(b.transform[5]??0)-(a.transform[5]??0):(a.transform[4]??0)-(b.transform[4]??0));
  const groups:TextItem[][]=[];
  for(const item of sorted){ const y=item.transform[5]??0; let g=groups.find(x=>Math.abs((x[0]?.transform[5]??0)-y)<3); if(!g){g=[];groups.push(g)} g.push(item); }
  return groups.map(g=>{g.sort((a,b)=>(a.transform[4]??0)-(b.transform[4]??0)); const x=Math.min(...g.map(i=>i.transform[4]??0)); const y=Math.min(...g.map(i=>i.transform[5]??0)); const right=Math.max(...g.map(i=>(i.transform[4]??0)+(i.width||0))); const h=Math.max(...g.map(i=>Math.abs(i.height||i.transform[3]||10))); return {text:g.map(i=>i.str.trim()).join(' ').replace(/\s+/g,' ').trim(),x,y,width:right-x,height:h,items:g};});
}
function pageCategory(lines:Line[], previous:string):string { return lines.map(l=>l.text).find(t=>categoryRx.test(t))?.match(categoryRx)?.[1]?.toLowerCase() ?? previous; }
function extractPrices(text:string):Array<{quantity:number;price:number}>{
  const q=[...text.matchAll(/(?:^|\s)(?:-?500|\+500|\+2000|\+5000)(?=\s|$)/g)].map(m=>m[0].trim());
  const p=[...text.matchAll(/(\d+(?:[.,]\d+)?)\s*€/g)].map(m=>normalizePrice(m[1]??'0')).filter(v=>v>0 && v<100000);
  const qty=q.length>=4?[1,500,2000,5000]:[1,25,50,100]; return p.slice(0,4).map((price,i)=>({quantity:qty[i]??1,price}));
}
function headersFromLines(lines: Line[]): Header[] {
  const headers: Header[] = [];
  for (const line of lines) {
    identityRx.lastIndex = 0;
    for (const match of line.text.matchAll(identityRx)) {
      const name=(match[1]??'').trim().replace(/^[^A-ZÁÉÍÓÚÑ]+/,'');
      const reference=match[2]??'';
      if (!name || rejectedNames.test(name)) continue;
      const ratio=(match.index??0)/Math.max(1,line.text.length);
      const matchRatio=(match[0]?.length??1)/Math.max(1,line.text.length);
      headers.push({line,name,reference,x:line.x+line.width*ratio,width:Math.max(50,line.width*matchRatio)});
    }
  }
  return headers.filter((h,i,a)=>a.findIndex(x=>x.reference===h.reference && Math.abs(x.line.y-h.line.y)<4)===i);
}
function productRegion(header: Header, headers: Header[], viewportWidth:number, viewportHeight:number): { linesFilter:(l:Line)=>boolean; bounds:PdfBounds } {
  const sameRow=headers.filter(h=>Math.abs(h.line.y-header.line.y)<18).sort((a,b)=>a.x-b.x);
  const rowIndex=sameRow.findIndex(h=>h.reference===header.reference);
  const left=rowIndex>0?(sameRow[rowIndex-1]!.x+header.x)/2:0;
  const right=rowIndex>=0 && rowIndex<sameRow.length-1?(header.x+sameRow[rowIndex+1]!.x)/2:viewportWidth;
  const sameColumnBelow=headers.filter(h=>h.reference!==header.reference && h.line.y<header.line.y-12 && h.x>=left && h.x<=right).sort((a,b)=>b.line.y-a.line.y)[0];
  const bottom=sameColumnBelow?Math.min(header.line.y-35,sameColumnBelow.line.y+18):0;
  const top=Math.min(viewportHeight,header.line.y+header.line.height+28);
  return {
    linesFilter:(l)=>l.y<=top && l.y>=bottom && (l.x+l.width)>=left && l.x<=right,
    bounds:{x:left,y:viewportHeight-top,width:Math.max(60,right-left),height:Math.max(60,top-bottom),pageWidth:viewportWidth,pageHeight:viewportHeight},
  };
}

export async function analyzePdfCatalog(filePath:string):Promise<PdfCatalogResult>{
  const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');
  const bytes=new Uint8Array(await readFile(filePath));
  const pdf=await pdfjs.getDocument({data:bytes,disableWorker:true}).promise;
  const products:AnalyzerProduct[]=[]; let blocks=0; let currentCategory='sin clasificar';
  for(let pageNo=1;pageNo<=pdf.numPages;pageNo++){
    const page=await pdf.getPage(pageNo); const viewport=page.getViewport({scale:1}); const content=await page.getTextContent();
    const lines=linesFromItems(content.items as TextItem[]); blocks+=lines.length; currentCategory=pageCategory(lines,currentCategory);
    const pageText=lines.map(line=>line.text).join('\n');
    const headers=(dimensionsRx.test(pageText) || /\d+(?:[.,]\d+)?\s*€/.test(pageText)) ? headersFromLines(lines) : [];
    for(const head of headers){
      const region=productRegion(head,headers,viewport.width,viewport.height);
      const chunkLines=lines.filter(region.linesFilter).sort((a,b)=>b.y-a.y || a.x-b.x); const text=chunkLines.map(l=>l.text).join('\n');
      const dim=text.match(dimensionsRx)?.[0]?.replace(/\s+/g,' ')??'Sin confirmar'; const material=materialFrom(text);
      const features=['TROLLEY','LAPTOP','TABLET','ANTI THEFT','RPET','DTF','USB','REFLECTIVE','VACUUM'].filter(t=>text.toUpperCase().includes(t)).map(t=>t.replace('TROLLEY','Trolley').replace('LAPTOP','Portátil').replace('TABLET','Tablet').replace('ANTI THEFT','Antirrobo').replace('VACUUM','Vacío'));
      const bounds=region.bounds;
      const headBounds:PdfBounds={x:head.x,y:viewport.height-(head.line.y+head.line.height),width:head.width,height:head.line.height,pageWidth:viewport.width,pageHeight:viewport.height};
      const dimsLine=chunkLines.find(l=>dimensionsRx.test(l.text)); const dimsBounds=dimsLine?{x:dimsLine.x,y:viewport.height-(dimsLine.y+dimsLine.height),width:dimsLine.width,height:dimsLine.height,pageWidth:viewport.width,pageHeight:viewport.height}:bounds;
      const prices=extractPrices(text); const confidences=[.99,.97,dim==='Sin confirmar'?.35:.94,material==='Sin confirmar'?.4:.86]; const confidence=confidences.reduce((a,b)=>a+b,0)/confidences.length;
      products.push({id:randomUUID(),page:pageNo,bounds,reference:fld(head.reference,.99,[ev(pageNo,'text',`Referencia ${head.reference}`,.99,headBounds)]),name:fld(head.name,.97,[ev(pageNo,'text',head.name,.97,headBounds)]),category:fld(currentCategory,.88,[ev(pageNo,'rule',`Categoría activa: ${currentCategory}`,.88,bounds)]),material:fld(material,material==='Sin confirmar'?.4:.86,[ev(pageNo,'text',material,material==='Sin confirmar'?.4:.86,bounds)]),dimensions:fld(dim,dim==='Sin confirmar'?.35:.94,[ev(pageNo,'text',dim,dim==='Sin confirmar'?.35:.94,dimsBounds)]),features:[...new Set(features)],prices,confidence,reviewStatus:'pending'});
    }
  }
  return {pages:pdf.numPages,blocks,products};
}
