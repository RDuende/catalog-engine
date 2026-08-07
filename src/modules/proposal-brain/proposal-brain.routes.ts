import type { FastifyInstance } from "fastify";
import { defaultProposalBrain } from "./proposal-brain.service.js";
import type { ProposalBrainInput } from "./proposal-brain.types.js";

export async function proposalBrainRoutes(app:FastifyInstance):Promise<void>{
 app.post<{Body:ProposalBrainInput}>("/api/v1/proposal-brain/analyze",async request=>defaultProposalBrain.analyze(request.body));
 app.get("/api/v1/proposal-brain/preset",async()=>({
  input:{
   recipientLabel:"mi padre",occasion:"cumpleaños",budget:70,interests:["motocross","madera"],
   strategy:"HERO_PLUS_COMPLEMENTS",targetItemCount:3,confidence:.86,
   candidates:[
    {id:"p1",sku:"P1",name:"Termo personalizado motocross",category:"botellas",price:24,stock:20,score:.9,canonicalInterests:["motocross"],personalizationAvailable:true,marginPercent:55,bundleRoles:["HERO"]},
    {id:"p2",sku:"P2",name:"Llavero de madera",category:"llaveros",price:9,stock:50,score:.78,canonicalInterests:["madera"],materials:["madera"],personalizationAvailable:true,marginPercent:60,bundleRoles:["COMPLEMENT"]},
    {id:"p3",sku:"P3",name:"Caja de madera",category:"packaging",price:14,stock:8,score:.7,materials:["madera"],personalizationAvailable:true,marginPercent:45,bundleRoles:["PACKAGING"]},
    {id:"p4",sku:"P4",name:"Taza motocross",category:"tazas",price:13,stock:30,score:.83,canonicalInterests:["motocross"],personalizationAvailable:true,marginPercent:58,bundleRoles:["COMPLEMENT"]}
   ]
  }
 }));
}
