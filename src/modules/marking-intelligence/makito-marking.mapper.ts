import { randomUUID } from "node:crypto";
import type { ProductMarkingArea, ProductMarkingProfile, ProductMarkingTechnique } from "./marking-intelligence.types.js";

type Obj=Record<string,unknown>;
const str=(v:unknown):string|undefined=>typeof v==="string"&&v.trim()?v.trim():typeof v==="number"?String(v):undefined;
const num=(v:unknown):number|undefined=>{const n=typeof v==="number"?v:Number(v);return Number.isFinite(n)?n:undefined};
export function parseMakitoTechniqueList(value:unknown):ProductMarkingTechnique[]{
 const raw=str(value)??""; if(!raw)return [];
 return raw.split(",").map(x=>x.trim()).filter(Boolean).map(token=>{
   const m=token.match(/^([^()\s]+)(?:\((\d+)\))?$/); const providerCode=m?.[1]??token; const providerParameter=m?.[2]?Number(m[2]):undefined;
   return {id:randomUUID(),code:"OTHER" as const,name:`Makito ${providerCode}`,providerCode,...(providerParameter!==undefined?{providerParameter}:{}),source:"PROVIDER" as const,providerRaw:token};
 });
}
export function mapMakitoPrintConfigProduct(row:unknown):ProductMarkingProfile|undefined{
 if(!row||typeof row!=="object"||Array.isArray(row))return undefined; const r=row as Obj; const providerProductId=str(r.id); if(!providerProductId)return undefined;
 const rawAreas=Array.isArray(r.areas)?r.areas:[];
 const areas:ProductMarkingArea[]=rawAreas.flatMap((item,index)=>{
   if(!item||typeof item!=="object"||Array.isArray(item))return []; const a=item as Obj; const areaId=str(a.id)??`A${index+1}`; const width=num(a.width),height=num(a.height); const image=str(a.image);
   return [{id:`makito-${providerProductId}-${areaId}`,name:`Área ${areaId}`,providerAreaId:areaId,providerPositionId:str(a.position),markingPreviewImageUrl:image,baseImageUrl:image,maxWidthMm:width,maxHeightMm:height,
     placement:{x:0,y:0,width:1,height:1},techniques:parseMakitoTechniqueList(a.techniques).map(t=>({...t,maxWidthMm:width,maxHeightMm:height})),source:"PROVIDER",providerRaw:item}];
 });
 return {productId:`makito:${providerProductId}`,providerKey:"makito",providerProductId,areas,providerRaw:row,updatedAt:new Date().toISOString(),updatedBy:"provider-sync"};
}
export function extractMakitoPrintConfigProducts(raw:unknown):unknown[]{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return []; const r=raw as Obj; if(Array.isArray(r.products))return r.products;
 const data=r.data; if(data&&typeof data==="object"&&!Array.isArray(data)&&Array.isArray((data as Obj).products))return (data as Obj).products as unknown[]; return [];
}
