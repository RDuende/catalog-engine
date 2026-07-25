import { createHash } from "node:crypto";
import type { PatternMatch } from "../pattern-engine/index.js";
import type { AstNode, AstNodeType, CatalogAst, ProductAstData } from "./ast-builder.types.js";
function id(...parts:string[]):string{return createHash("sha1").update(parts.join(":" )).digest("hex").slice(0,16);}
export class AstBuilderService {
  build(matches: PatternMatch[]): CatalogAst {
    const pages = new Map<number, AstNode<{page:number}>>(); let products=0,categories=0,nodes=1;
    for (const match of matches) {
      let page=pages.get(match.page); if(!page){page={id:id("page",String(match.page)),type:"PAGE",data:{page:match.page},children:[]};pages.set(match.page,page);nodes++;}
      const type=match.pattern as AstNodeType;
      const data: unknown = type === "PRODUCT" ? ({ reference:match.fields.reference,name:match.fields.name,description:match.fields.description,dimensions:match.fields.dimensions ?? [],materials:match.fields.materials ?? [],colors:match.fields.colors ?? [],markingCodes:match.fields.markingCodes ?? [],prices:match.fields.prices ?? [] } satisfies ProductAstData) : { text:match.fields.rawLines.join("\n") };
      page.children.push({id:id(match.blockId,type),type,source:{blockId:match.blockId,page:match.page,confidence:match.confidence,signals:match.signals},data,children:[]}); nodes++; if(type==="PRODUCT")products++; if(type==="CATEGORY")categories++;
    }
    const root:AstNode<{pages:number;products:number}>={id:id("catalog","root"),type:"CATALOG",data:{pages:pages.size,products},children:[...pages.values()].sort((a,b)=>a.data.page-b.data.page)};
    return {version:"1.0",root,statistics:{nodes,products,categories,pages:pages.size}};
  }
}
