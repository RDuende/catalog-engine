import assert from "node:assert/strict";
import test from "node:test";
import { ProposalBrainService } from "./proposal-brain.service.js";

test("genera propuestas diversas dentro del presupuesto",()=>{
 const result=new ProposalBrainService().analyze({
  budget:60,interests:["cooking"],strategy:"HERO_PLUS_COMPLEMENTS",targetItemCount:3,confidence:.9,
  candidates:[
   {id:"a",name:"Delantal",category:"textil",price:18,score:.9,canonicalInterests:["cooking"],personalizationAvailable:true,stock:10},
   {id:"b",name:"Tabla",category:"madera",price:22,score:.85,canonicalInterests:["cooking"],personalizationAvailable:true,stock:10},
   {id:"c",name:"Taza",category:"tazas",price:12,score:.8,canonicalInterests:["cooking"],personalizationAvailable:true,stock:10},
   {id:"d",name:"Taza mini",category:"tazas",price:10,score:.79,canonicalInterests:["cooking"],personalizationAvailable:true,stock:10},
  ]
 });
 assert.equal(result.drafts.length>0,true);
 assert.equal(result.drafts[0]?.withinBudget,true);
 assert.equal((result.drafts[0]?.diversityScore??0)>.6,true);
});

test("expone score y confidence por separado",()=>{
 const result=new ProposalBrainService().analyze({budget:25,interests:["football"],confidence:.5,candidates:[{id:"x",name:"Balón",category:"deporte",price:20,score:.95,canonicalInterests:["football"],stock:1}]});
 const draft=result.drafts[0];assert.ok(draft);assert.equal(typeof draft.score,"number");assert.equal(typeof draft.confidence,"number");
});

import { proposalInputFromGiftBrain } from "./gift-brain.adapter.js";

test("adapta una decisión de Gift Brain",()=>{
 const input=proposalInputFromGiftBrain({
  profile:{recipientLabel:"mi padre",occasion:"cumpleaños",budget:70,interests:["motocross"]},
  decision:{confidence:.88,selected:{strategy:{kind:"HERO_PLUS_COMPLEMENTS",targetItemCount:3}},composerContext:{}}
 },[{id:"p",name:"Producto"}]);
 assert.equal(input.strategy,"HERO_PLUS_COMPLEMENTS");
 assert.equal(input.targetItemCount,3);
 assert.equal(input.confidence,.88);
});
