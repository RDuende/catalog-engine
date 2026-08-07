import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { CatalogProviderService } from "./catalog-provider.service.js";

test("crea, actualiza y conserva secretos de un proveedor", async()=>{const dir=await mkdtemp(join(tmpdir(),"providers-"));try{const service=new CatalogProviderService(join(dir,"providers.json"));const created=await service.create({key:"demo",name:"Demo",description:"",status:"DRAFT",baseUrl:"https://example.com",currency:"EUR",language:"es",taxPercent:21,defaultMarginPercent:30,credentials:{authType:"API_KEY",apiKey:"secret"},capabilities:{products:true,categories:false,media:true,prices:false,stock:false,documents:false,videos:false},importPolicy:{automatic:false,schedule:"0 3 * * *",batchSize:100,mediaConcurrency:2,createSnapshot:true,classifyProductBrain:true,downloadMedia:true,generateThumbnails:true,markMissingInactive:false,updatePrices:false,updateStock:false}});assert.equal(created.credentials.apiKey,"********");const updated=await service.update(created.id,{name:"Demo 2",credentials:{authType:"API_KEY",apiKey:""}});assert.equal(updated.name,"Demo 2");assert.equal(updated.credentials.apiKey,"********");}finally{await rm(dir,{recursive:true,force:true});}});
