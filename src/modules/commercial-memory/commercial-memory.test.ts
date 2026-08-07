import assert from "node:assert/strict";
import test from "node:test";
import { CommercialMemoryService } from "./commercial-memory.service.js";

class MemoryRepo {
  runs = 0; feedback = 0;
  async recordRecommendation(){ this.runs++; return "11111111-1111-4111-8111-111111111111"; }
  async recordFeedback(){ this.feedback++; }
  async stats(){ return { runs:this.runs,recommendations:0,accepted:0,rejected:0,purchased:0,conversionRate:0,byProfile:{},byOutcome:{} }; }
  async history(){ return []; }
}

test("records recommendation runs and feedback", async () => {
  const repo = new MemoryRepo();
  const service = new CommercialMemoryService(repo as any);
  const runId = await service.recordRecommendation({ query:"eco" } as any, { query:"eco",profile:"eco",pipeline:"eco",totalCandidates:1,elapsedMs:1,metrics:{} as any,interpreted:{} as any,diagnostics:{} as any,items:[],analysis:{ returned:0, discarded:0, discardedAlternatives:[] } });
  await service.recordFeedback({ runId, productId:"22222222-2222-4222-8222-222222222222", eventType:"ACCEPTED" });
  assert.equal(repo.runs,1); assert.equal(repo.feedback,1);
});
