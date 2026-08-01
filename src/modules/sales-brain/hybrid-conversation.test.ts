import assert from "node:assert/strict";
import test from "node:test";
import { AIGatewayService } from "../ai-gateway/ai-gateway.service.js";
import { MockAIProvider } from "../ai-gateway/mock.provider.js";
import { SalesBrainService } from "./sales-brain.service.js";

test("aplica comprensión estructurada al contexto comercial", async () => {
  const service = new SalesBrainService(
    undefined,
    undefined,
    undefined,
    new AIGatewayService(new MockAIProvider()),
  );
  const decision = await service.decide({ message: "hola Rai", context: {}, recommendNow: false });
  assert.equal(decision.strategy, "ASK");
  assert.ok(decision.conversationAI);
  assert.equal(decision.analysis.context.conversationState, "WELCOME");
});
