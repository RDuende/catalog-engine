import assert from "node:assert/strict";
import test from "node:test";
import { AIGatewayService } from "./ai-gateway.service.js";
import { MockAIProvider } from "./mock.provider.js";
import type { ConversationUnderstanding } from "./ai-gateway.types.js";

test("un saludo no se convierte en una búsqueda de catálogo", async () => {
  const service = new AIGatewayService(new MockAIProvider());
  const result = await service.understandConversation({ message: "hola Rai" });
  assert.equal(result.data.intent, "GREETING");
  assert.equal(result.data.patches.length, 0);
  assert.equal(result.data.missingFields[0], "need");
});

test("acepta una comprensión estructurada inyectada", async () => {
  const understood: ConversationUnderstanding = {
    intent: "RECOMMEND",
    patches: [
      { field: "need", operation: "SET", value: "regalo corporativo", confidence: 0.98, evidence: "regalo de empresa" },
      { field: "audience", operation: "SET", value: "clientes", confidence: 0.97, evidence: "a los clientes" },
      { field: "campaign", operation: "SET", value: "navidad", confidence: 0.99, evidence: "por Navidad" },
    ],
    missingFields: ["quantity", "budget"],
    nextQuestion: "¿Cuántas unidades necesitas?",
    userFacingReply: "Perfecto. ¿Cuántas unidades necesitas?",
    confidence: 0.97,
  };
  const service = new AIGatewayService(new MockAIProvider(() => understood));
  const result = await service.understandConversation({ message: "Quiero un regalo de empresa para clientes por Navidad" });
  assert.deepEqual(result.data, understood);
  assert.equal(result.trace.provider, "mock");
});
