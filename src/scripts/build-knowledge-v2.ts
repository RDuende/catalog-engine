import "dotenv/config";
import { PgKnowledgeBuilderRepository } from "../modules/knowledge-graph-v2/knowledge-builder.repository.js";
import { KnowledgeGraphBuilderService } from "../modules/knowledge-graph-v2/knowledge-builder.service.js";

const providerKey = process.argv.find(value => value.startsWith("--provider="))?.split("=")[1];
const limitValue = process.argv.find(value => value.startsWith("--limit="))?.split("=")[1];
const service = new KnowledgeGraphBuilderService(new PgKnowledgeBuilderRepository());
const result = await service.build({ providerKey, limit: limitValue ? Number(limitValue) : undefined, onProgress: (done, total) => { if (done % 100 === 0 || done === total) console.log(`Knowledge Graph: ${done}/${total}`); } });
console.log(JSON.stringify(result, null, 2));
