import "dotenv/config";
import { KnowledgeDictionaryService } from "../modules/knowledge-graph-v2/knowledge-dictionary.service.js";
import { PgKnowledgeIntelligenceRepository } from "../modules/knowledge-graph-v2/knowledge-intelligence.repository.js";

const result = await new KnowledgeDictionaryService(new PgKnowledgeIntelligenceRepository()).sync();
console.log(JSON.stringify(result, null, 2));
