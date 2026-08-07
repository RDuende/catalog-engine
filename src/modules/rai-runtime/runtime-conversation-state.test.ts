import assert from "node:assert/strict";
import test from "node:test";
import { createRaiContext } from "../../platform/runtime/context/index.js";
import { RaiRuntimeService } from "./runtime.service.js";

test("runContext resuelve el estado tras clasificar la intención", async () => {
  const runtime = new RaiRuntimeService();
  const result = await runtime.runContext({
    goal: "UNDERSTAND_REQUEST",
    context: createRaiContext({
      message: "Quiero hacer un regalo de cumpleaños a mis gemelas",
      sessionId: "state-runtime",
      facts: { recipientRelationship: "hijas", occasion: "cumpleaños" },
    }),
  });

  assert.equal(result.context.conversation.intent?.primary, "CREATE_GIFT");
  assert.equal(result.context.session.state, "INSPIRE");
  assert.equal(result.trace[0]?.stepId, "classify-intent");
  assert.equal(result.trace[1]?.stepId, "resolve-conversation-state");
});

test("el estado del Runtime declara el resolver canónico", () => {
  const runtime = new RaiRuntimeService();
  assert.equal(runtime.status().skills.includes("conversation-state-resolution"), true);
});
