import type { FastifyInstance } from "fastify";
import { getMakitoToken, makitoFetchJson, resolveMakitoConfig } from "../provider-engine/makito-client.js";
import { collectProviderMarkingEvidence,getMarkingProfile,mergeProviderMarkingProfile,saveMarkingProfile,techniquesFromEvidence } from "./marking-intelligence.service.js";
import { extractMakitoPrintConfigProducts,mapMakitoPrintConfigProduct } from "./makito-marking.mapper.js";
import { syncMakitoMarkingV22 } from "./makito-marking-v22.js";
import { buildMakitoTechniqueDictionary,getMakitoTechniqueDictionary } from "./makito-technique-dictionary.js";
import { getMakitoOfficialTechniqueCatalog,syncMakitoOfficialMarkingV24 } from "./makito-official-techniques.js";
import { geometryView,updateProductMarkingGeometry,validatePlacementGeometry } from "./marking-geometry.js";
import { getAdminProduct,getAdminProductFilterOptions,listAdminProducts,setAdminProductPrimaryImage } from "./product-admin.service.js";
import type { ProductMarkingProfile } from "./marking-intelligence.types.js";
export async function markingIntelligenceRoutes(app:FastifyInstance):Promise<void>{
 app.get<{Params:{productId:string}}>("/marking-intelligence/products/:productId",async r=>({status:"ok",productId:r.params.productId,profile:(await getMarkingProfile(r.params.productId))??null}));
 app.put<{Params:{productId:string};Body:Omit<ProductMarkingProfile,"productId"|"updatedAt">}>("/marking-intelligence/products/:productId",async(r,reply)=>{const body=r.body??({} as Omit<ProductMarkingProfile,"productId"|"updatedAt">);if(!Array.isArray(body.areas))return reply.code(400).send({error:"areas debe ser un array"});return reply.send({status:"saved",profile:await saveMarkingProfile({...body,productId:r.params.productId,updatedAt:new Date().toISOString()})})});
 app.post<{Params:{productId:string};Body:{providerKey?:string;raw?:unknown}}>("/marking-intelligence/products/:productId/discover",async r=>{const evidence=collectProviderMarkingEvidence(r.body?.raw);return{status:"discovered",productId:r.params.productId,providerKey:r.body?.providerKey,evidence,techniques:techniquesFromEvidence(evidence)}});
 app.post<{Body:{raw?:unknown}}>("/marking-intelligence/providers/makito/import",async(r,reply)=>{const rows=extractMakitoPrintConfigProducts(r.body?.raw);if(!rows.length)return reply.code(400).send({error:"No se encontraron products[] de print-config"});let imported=0,areas=0,techniques=0;for(const row of rows){const p=mapMakitoPrintConfigProduct(row);if(!p)continue;const saved=await mergeProviderMarkingProfile(p);imported++;areas+=saved.areas.length;techniques+=saved.areas.reduce((n,a)=>n+a.techniques.length,0)}return{status:"imported",provider:"makito",products:imported,areas,techniques}});


 app.post("/marking-intelligence/providers/makito/sync", async (_request, reply) => {
   const config = resolveMakitoConfig({});

   const raw = await makitoFetchJson<Record<string, unknown>>(
     config,
     "/print-config/files",
     {
       format: "JSON",
       lang: config.lang ?? "es"
     }
   );

   const rows = extractMakitoPrintConfigProducts(raw);

   if (!rows.length) {
     return reply.code(502).send({
       error: "MAKITO_PRINT_CONFIG_EMPTY",
       message: "Makito no devolvió products[] en /print-config/files."
     });
   }

   let imported = 0;
   let areas = 0;
   let techniques = 0;
   const unknownTechniqueCodes = new Set<string>();

   for (const row of rows) {
     const profile = mapMakitoPrintConfigProduct(row);
     if (!profile) continue;

     const saved = await mergeProviderMarkingProfile(profile);

     imported += 1;
     areas += saved.areas.length;

     for (const area of saved.areas) {
       techniques += area.techniques.length;

       for (const technique of area.techniques) {
         if (
           technique.code === "OTHER" &&
           typeof technique.providerCode === "string" &&
           technique.providerCode.length
         ) {
           unknownTechniqueCodes.add(technique.providerCode);
         }
       }
     }
   }

   return reply.send({
     status: "imported",
     provider: "makito",
     products: imported,
     areas,
     techniques,
     unknownTechniqueCodes: [...unknownTechniqueCodes].sort()
   });
 });


app.post("/marking-intelligence/providers/makito/sync-v2", async (_request, reply) => {
const config = resolveMakitoConfig({});

const raw = await makitoFetchJson<Record<string, unknown>>(
config,
"/print-config/files",
{
format: "JSON",
lang: config.lang ?? "es"
}
);

const result = await syncMakitoMarkingV22(raw);

return reply.send(result);
});


app.post("/marking-intelligence/providers/makito/technique-dictionary/rebuild", async (_request, reply) => {
const config = resolveMakitoConfig({});

const raw = await makitoFetchJson<Record<string, unknown>>(
config,
"/print-config/files",
{
format: "JSON",
lang: config.lang ?? "es"
}
);

const dictionary = await buildMakitoTechniqueDictionary(raw);

return reply.send({
status: "rebuilt",
provider: "makito",
stats: dictionary.stats,
entries: dictionary.entries
});
});

app.get("/marking-intelligence/providers/makito/technique-dictionary", async (_request, reply) => {
const dictionary = await getMakitoTechniqueDictionary();

if (!dictionary) {
return reply.code(404).send({
error: "TECHNIQUE_DICTIONARY_NOT_BUILT",
message: "Ejecuta primero technique-dictionary/rebuild."
});
}

return reply.send(dictionary);
});


app.post("/marking-intelligence/providers/makito/sync-v3", async (_request, reply) => {
const config = resolveMakitoConfig({});

const [printConfigRaw, printPriceRaw] = await Promise.all([
makitoFetchJson<Record<string, unknown>>(
config,
"/print-config/files",
{ format: "JSON", lang: config.lang ?? "es" }
),
makitoFetchJson<Record<string, unknown>>(
config,
"/print-price-list/files",
{ format: "JSON", lang: config.lang ?? "es" }
)
]);

const result = await syncMakitoOfficialMarkingV24(printConfigRaw, printPriceRaw);
return reply.send(result);
});

app.get("/marking-intelligence/providers/makito/official-techniques", async (_request, reply) => {
const catalog = await getMakitoOfficialTechniqueCatalog();

if (!catalog) {
return reply.code(404).send({
error: "OFFICIAL_TECHNIQUE_CATALOG_NOT_BUILT",
message: "Ejecuta primero providers/makito/sync-v3."
});
}

return reply.send(catalog);
});


app.get<{Params:{productId:string}}>("/marking-intelligence/products/:productId/geometry", async (request, reply) => {
const profile = await getMarkingProfile(request.params.productId);

if (!profile) {
return reply.code(404).send({
error: "MARKING_PROFILE_NOT_FOUND",
message: "No existe perfil de marcaje para el producto."
});
}

return reply.send({
status: "ok",
geometry: geometryView(profile)
});
});

app.put<{
Params:{productId:string};
Body:{areas?:Array<{areaId?:string;placement?:unknown}>}
}>("/marking-intelligence/products/:productId/geometry", async (request, reply) => {
const rows = request.body?.areas;

if (!Array.isArray(rows) || rows.length === 0) {
return reply.code(400).send({
error: "INVALID_GEOMETRY",
message: "areas debe ser un array no vacío."
});
}

const updates = [];

for (const row of rows) {
if (!row || typeof row.areaId !== "string" || !row.areaId) {
return reply.code(400).send({
error: "INVALID_GEOMETRY",
message: "Cada geometría necesita areaId."
});
}

const parsed = validatePlacementGeometry(row.placement);

if (!parsed.ok) {
return reply.code(400).send({
error: "INVALID_GEOMETRY",
areaId: row.areaId,
message: parsed.error
});
}

updates.push({
areaId: row.areaId,
placement: parsed.value
});
}

try {
const saved = await updateProductMarkingGeometry(
request.params.productId,
updates
);

return reply.send({
status: "saved",
geometry: geometryView(saved)
});
} catch (error) {
return reply.code(400).send({
error: "GEOMETRY_UPDATE_FAILED",
message: error instanceof Error ? error.message : String(error)
});
}
});


app.get<{Params:{productId:string;areaId:string}}>(
"/marking-intelligence/products/:productId/areas/:areaId/image",
async (request, reply) => {
const profile = await getMarkingProfile(request.params.productId);

if (!profile) {
return reply.code(404).send({
error: "MARKING_PROFILE_NOT_FOUND",
message: "No existe perfil de marcaje."
});
}

const area = profile.areas.find((item) => item.id === request.params.areaId);

if (!area) {
return reply.code(404).send({
error: "MARKING_AREA_NOT_FOUND",
message: "No existe el área solicitada."
});
}

const imageUrl = area.baseImageUrl ?? area.markingPreviewImageUrl;

if (!imageUrl) {
return reply.code(404).send({
error: "MARKING_IMAGE_NOT_FOUND",
message: "El área no tiene imagen."
});
}

const config = resolveMakitoConfig({});
const token = await getMakitoToken(config);

const response = await fetch(imageUrl, {
headers: {
...config.headers,
authorization: `Bearer ${token}`,
accept: "image/*"
}
});

if (!response.ok) {
return reply.code(response.status).send({
error: "MAKITO_MARKING_IMAGE_ERROR",
message: `Makito respondió HTTP ${response.status} para la imagen de marcaje.`
});
}

const contentType = response.headers.get("content-type") ?? "image/jpeg";
const bytes = Buffer.from(await response.arrayBuffer());

reply.header("content-type", contentType);
reply.header("cache-control", "private, max-age=3600");
return reply.send(bytes);
});


app.get<{
Querystring:{
q?:string;
page?:string;
limit?:string;
objectType?:string;
technique?:string;
material?:string;
category?:string;
interest?:string;
marking?:string;
brainStatus?:string;
personalization?:string;
imageStatus?:string;
sort?:string
}
}>("/marking-intelligence/admin-products", async (request, reply) => {
const result = await listAdminProducts({
q: request.query.q,
page: Number(request.query.page ?? 1),
limit: Number(request.query.limit ?? 30),
objectType: request.query.objectType,
technique: request.query.technique,
material: request.query.material,
category: request.query.category,
interest: request.query.interest,
marking: request.query.marking,
brainStatus: request.query.brainStatus,
personalization: request.query.personalization,
imageStatus: request.query.imageStatus,
sort: request.query.sort
});
return reply.send(result);
});

app.get(
"/marking-intelligence/admin-products/filter-options",
async (_request, reply) => {
const result = await getAdminProductFilterOptions();
return reply.send(result);
});

app.get<{Params:{productId:string}}>(
"/marking-intelligence/admin-products/:productId",
async (request, reply) => {
const result = await getAdminProduct(request.params.productId);

if (!result) {
return reply.code(404).send({
error: "PRODUCT_NOT_FOUND",
message: "Producto no encontrado en el catálogo Makito actual."
});
}

return reply.send(result);
});

app.put<{
Params:{productId:string};
Body:{primaryImageUrl?:string}
}>(
"/marking-intelligence/admin-products/:productId/primary-image",
async (request, reply) => {
const primaryImageUrl = request.body?.primaryImageUrl;

if (typeof primaryImageUrl !== "string" || !primaryImageUrl.trim()) {
return reply.code(400).send({
error: "INVALID_PRIMARY_IMAGE",
message: "primaryImageUrl es obligatorio."
});
}

try {
const result = await setAdminProductPrimaryImage(
request.params.productId,
primaryImageUrl
);
return reply.send(result);
} catch (error) {
return reply.code(400).send({
error: "PRIMARY_IMAGE_UPDATE_FAILED",
message: error instanceof Error ? error.message : String(error)
});
}
});

app.get<{
Params:{productId:string;index:string}
}>(
"/marking-intelligence/admin-products/:productId/images/:index",
async (request, reply) => {
const detail = await getAdminProduct(request.params.productId);

if (!detail) {
return reply.code(404).send({
error: "PRODUCT_NOT_FOUND",
message: "Producto no encontrado."
});
}

const index = Number(request.params.index);
const imageUrl =
Number.isInteger(index) && index >= 0
? detail.product.images[index]
: undefined;

if (!imageUrl) {
return reply.code(404).send({
error: "PRODUCT_IMAGE_NOT_FOUND",
message: "Imagen no encontrada."
});
}

if (imageUrl.startsWith("/")) {
return reply.redirect(imageUrl);
}

const config = resolveMakitoConfig({});
const token = await getMakitoToken(config);

const response = await fetch(imageUrl, {
headers: {
...config.headers,
authorization: `Bearer ${token}`,
accept: "image/*"
}
});

if (!response.ok) {
return reply.code(response.status).send({
error: "PRODUCT_IMAGE_PROXY_ERROR",
message: `Proveedor respondió HTTP ${response.status}.`
});
}

const contentType = response.headers.get("content-type") ?? "image/jpeg";
const bytes = Buffer.from(await response.arrayBuffer());

reply.header("content-type", contentType);
reply.header("cache-control", "private, max-age=3600");
return reply.send(bytes);
});

}
