import assert from "node:assert/strict";
import test from "node:test";
import { AstBuilderService } from "./ast-builder.service.js";
import { astToNormalizedProducts } from "./ast-normalized-products.js";
import type { PatternMatch } from "../pattern-engine/index.js";

const match:PatternMatch={blockId:"b1",page:4,sourceType:"PRODUCT",pattern:"PRODUCT",confidence:0.95,signals:["reference"],fields:{reference:"20411",name:"TURAM",description:"Botella",dimensions:["25 x 7 cm"],materials:["acero inoxidable"],colors:[],markingCodes:["L1"],prices:[{price:2.1,currency:"EUR",raw:"2,10 €"}],rawLines:[]}};
test("construye AST y productos normalizados",()=>{const ast=new AstBuilderService().build([match]);assert.equal(ast.statistics.products,1);const products=astToNormalizedProducts(ast);assert.equal(products[0]?.sku,"20411");assert.equal(products[0]?.name,"TURAM");});
