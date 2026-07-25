import assert from "node:assert/strict";
import test from "node:test";
import { PatternEngineService } from "./pattern-engine.service.js";
import type { DocumentBlock } from "../block-detector/index.js";

const product: DocumentBlock = {
  id:"b1",page:1,type:"PRODUCT",startLine:1,endLine:5,confidence:0.92,signals:["product-reference"],
  text:"20411 TURAM\nBotella de acero inoxidable.\n500 ml\nMedidas 25 x 7 cm\n1 100 500 2,10 € 1,95 €"
};

test("reconoce un producto y extrae campos",()=>{
  const match=new PatternEngineService().match(product);
  assert.equal(match.pattern,"PRODUCT");
  assert.equal(match.fields.reference,"20411");
  assert.equal(match.fields.name,"TURAM");
  assert.ok(match.fields.materials?.includes("acero inoxidable"));
  assert.ok((match.fields.prices?.length ?? 0)>=2);
});
