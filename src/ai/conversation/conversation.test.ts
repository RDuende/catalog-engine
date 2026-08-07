import assert from "node:assert/strict";
import test from "node:test";
import { MockAIProvider } from "../../modules/ai-gateway/mock.provider.js";
import { AIConversationService } from "./conversation.service.js";
import { validateConversationUnderstanding } from "./conversation.validator.js";

test("valida y conserva una salida estructurada correcta", async () => {
  const service = new AIConversationService(new MockAIProvider(() => ({
    intent: "RECOMMEND",
    patches: [
      { field: "need", operation: "SET", value: "regalo corporativo", confidence: 0.98, evidence: "regalo de empresa" },
      { field: "campaign", operation: "SET", value: "navidad", confidence: 0.99, evidence: "por Navidad" },
    ],
    missingFields: ["quantity", "budget", "sustainability", "customizable"],
    nextQuestion: "¿Cuántas unidades necesitas?",
    userFacingReply: "Perfecto. ¿Cuántas unidades necesitas?",
    confidence: 0.97,
  })));

  const result = await service.understand({ message: "Quiero un regalo de empresa por Navidad" });
  assert.equal(result.data.intent, "RECOMMEND");
  assert.equal(result.data.patches[0]?.field, "need");
  assert.equal(result.fallbackUsed, true);
});

test("rechaza campos y operaciones fuera del contrato", () => {
  const result = validateConversationUnderstanding({
    intent: "RECOMMEND",
    patches: [{ field: "admin", operation: "EXECUTE", value: "x" }],
    missingFields: ["quantity"],
    nextQuestion: "¿Cuántas unidades?",
    userFacingReply: "¿Cuántas unidades?",
    confidence: 0.9,
  }, { message: "Necesito regalos" });

  assert.equal(result.valid, false);
  assert.equal(result.value.patches.length, 0);
  assert.ok(result.issues.length >= 1);
});

test("un saludo sigue siendo una conversación y no una búsqueda", async () => {
  const service = new AIConversationService(new MockAIProvider());
  const result = await service.understand({ message: "Hola Rai" });
  assert.equal(result.data.intent, "GREETING");
  assert.deepEqual(result.data.patches, []);
});
