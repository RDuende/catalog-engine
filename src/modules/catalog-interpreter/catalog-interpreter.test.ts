import assert from "node:assert/strict";
import test from "node:test";
import { CatalogInterpreterService } from "./catalog-interpreter.service.js";
test("ejecuta detección, patrones y AST",()=>{const result=new CatalogInterpreterService().interpret([{page:1,text:"CATÁLOGO\nBOTELLAS\n20411 TURAM\nBotella de acero inoxidable\n25 x 7 cm\n2,10 €"}]);assert.ok(result.detection.blocks.length>0);assert.ok(result.patterns.matches.length>0);assert.equal(result.ast.statistics.products,1);assert.equal(result.normalizedProducts.length,1);});
