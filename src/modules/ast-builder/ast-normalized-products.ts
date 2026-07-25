import type { NormalizedProduct } from "../import-engine/import.types.js";
import type { AstNode, CatalogAst, ProductAstData } from "./ast-builder.types.js";
function walk(node:AstNode):AstNode[]{return [node,...node.children.flatMap(walk)];}
export function astToNormalizedProducts(ast:CatalogAst):NormalizedProduct[]{
  return walk(ast.root).filter(n=>n.type==="PRODUCT").map((n,index)=>{const d=n.data as ProductAstData; const reference=d.reference ?? `AST-${n.source?.page ?? 0}-${index+1}`; return {externalId:reference,sku:reference,supplierReference:d.reference,name:d.name ?? reference,description:d.description,material:d.materials[0],primaryColor:d.colors[0],customizable:true,metadata:{source:"catalog-ast",page:n.source?.page,confidence:n.source?.confidence,dimensions:d.dimensions,markingCodes:d.markingCodes,prices:d.prices}};});
}
