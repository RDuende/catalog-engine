import { BlockDetectorService, type CatalogPageInput } from "../block-detector/index.js";
import { PatternEngineService } from "../pattern-engine/index.js";
import { AstBuilderService, astToNormalizedProducts } from "../ast-builder/index.js";
export class CatalogInterpreterService {
  constructor(private readonly blocks=new BlockDetectorService(),private readonly patterns=new PatternEngineService(),private readonly astBuilder=new AstBuilderService()){}
  interpret(pages:CatalogPageInput[]){const detection=this.blocks.detect(pages);const patterns=this.patterns.analyze(detection.blocks);const ast=this.astBuilder.build(patterns.matches);return {detection,patterns,ast,normalizedProducts:astToNormalizedProducts(ast)};}
}
