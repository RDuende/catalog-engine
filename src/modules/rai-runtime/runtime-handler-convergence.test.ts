import assert from "node:assert/strict";
import test from "node:test";
import { createRaiContext } from "../../platform/runtime/context/index.js";
import { commercialFactsFrom, withRuntimeCommercialFacts } from "./runtime-handler-context.js";
import { RequirementGateTool } from "./runtime.handlers.js";
import type { RuntimeState } from "./runtime.types.js";

function stateWithFacts(facts: Record<string, unknown>): RuntimeState {
  const raiContext = createRaiContext({
    message: "Quiero un regalo para mi madre",
    sessionId: "ses-m23",
    requestId: "req-m23",
    facts,
  });
  return {
    request: { message: "MENSAJE LEGACY QUE NO DEBE USARSE", goal: "RECOMMEND_PRODUCTS" },
    raiContext,
    context: { need: "legacy" },
    data: {},
  };
}

test("RaiContext es la fuente canónica de hechos comerciales", () => {
  const state = stateWithFacts({ recipientRelationship: "madre", occasion: "cumpleaños" });
  const facts = commercialFactsFrom(state);
  assert.equal(facts.recipientRelationship, "madre");
  assert.equal(facts.occasion, "cumpleaños");
  assert.notEqual(facts.need, "legacy");
});

test("actualiza en una operación el contexto canónico y la vista legacy", () => {
  const state = stateWithFacts({ recipientRelationship: "madre" });
  const next = withRuntimeCommercialFacts(state, {
    ...commercialFactsFrom(state),
    occasion: "cumpleaños",
    conversationState: "PROPOSAL",
  });
  assert.equal(next.context.occasion, "cumpleaños");
  assert.equal(next.raiContext.conversation.facts?.occasion, "cumpleaños");
  assert.equal(next.raiContext.session.state, "PROPOSE");
});

test("RequirementGateTool declara y consume contexto canónico", async () => {
  const tool = new RequirementGateTool();
  assert.equal(tool.contextMode, "RAI_CONTEXT");
  const result = await tool.execute(stateWithFacts({
    need: "regalo",
    recipientRelationship: "madre",
    occasion: "cumpleaños",
  }));
  assert.equal(result.context.recipientRelationship, "madre");
  assert.equal(result.raiContext.conversation.facts?.recipientRelationship, "madre");
});
