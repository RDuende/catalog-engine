import type { FastifyInstance } from "fastify";
import { RecommendationBodySchema, type RecommendationBody } from "./recommendation.schemas.js";
import { RecommendationService } from "./recommendation.service.js";
import { loadRecommendationConfig } from "./recommendation.config.js";
import { CommercialMemoryService } from "../commercial-memory/commercial-memory.service.js";
export interface RecommendationRoutesOptions { readonly service?:RecommendationService; }
export async function recommendationRoutes(app:FastifyInstance, options:RecommendationRoutesOptions={}):Promise<void>{
 const service=options.service??new RecommendationService({memory:new CommercialMemoryService()});
 app.get("/recommendations/profiles",async()=>{const c=await loadRecommendationConfig();return {profiles:c.profiles,pipelines:c.pipelines};});
 app.post<{Body:RecommendationBody}>("/recommendations",{schema:{body:RecommendationBodySchema}},async(req,reply)=>reply.code(200).send(await service.recommend(req.body)));
}
