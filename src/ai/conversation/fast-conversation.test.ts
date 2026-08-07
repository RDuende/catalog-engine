import assert from "node:assert/strict";
import test from "node:test";
import { AIConversationService } from "./conversation.service.js";

test("resuelve saludos sin consumir tokens", async () => {
  const result = await new AIConversationService().understand({ message: "Hola Rai" });
  assert.equal(result.data.intent, "GREETING");
  assert.equal(result.trace.model, "fast-conversation-v1");
  assert.equal(result.trace.usage.totalTokens, 0);
});

test("interpreta un número como cantidad cuando falta quantity", async () => {
  const result = await new AIConversationService().understand({ message: "500", context: { need: "regalos" } });
  assert.equal(result.data.patches[0]?.field, "quantity");
  assert.equal(result.data.patches[0]?.value, 500);
  assert.equal(result.trace.usage.totalTokens, 0);
});

test("interpreta un número como presupuesto cuando ya existe quantity", async () => {
  const result = await new AIConversationService().understand({ message: "5", context: { need: "regalos", quantity: 500 } });
  assert.equal(result.data.patches[0]?.field, "budget");
  assert.equal(result.data.patches[0]?.value, 5);
});

test("interpreta sí como personalización cuando es el siguiente booleano obligatorio", async () => {
  const result = await new AIConversationService().understand({
    message: "sí",
    context: { need: "regalos", quantity: 500, budget: 5 },
  });
  assert.equal(result.data.patches[0]?.field, "customizable");
  assert.equal(result.data.patches[0]?.value, true);
});

test("delega expresiones comerciales complejas al proveedor LLM", async () => {
  let calls = 0;
  const provider = {
    name: "mock" as const,
    async structured<T>(request: { fallback: T }) {
      calls += 1;
      return {
        data: request.fallback,
        trace: {
          traceId: "llm",
          provider: "mock" as const,
          model: "mock",
          skill: "test",
          startedAt: new Date().toISOString(),
          durationMs: 1,
          usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
        },
        fallbackUsed: false,
      };
    },
  };
  await new AIConversationService(provider).understand({ message: "Necesito un regalo para mi tía que acaba de tener gemelos" });
  assert.equal(calls, 1);
});
