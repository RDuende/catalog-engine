import assert from "node:assert/strict";
import test from "node:test";
import { createRaiContext, withCommercialContext } from "./index.js";

test("crea el contexto canónico con identificadores y valores por defecto", () => {
  const context = createRaiContext({
    message: "Quiero un regalo",
    sessionId: "ses-1",
    requestId: "req-1",
    facts: { recipientRelationship: "madre", conversationState: "DISCOVERY" },
  });

  assert.equal(context.requestId, "req-1");
  assert.equal(context.correlationId, "req-1");
  assert.equal(context.session.state, "DISCOVER");
  assert.equal(context.actor.locale, "es-ES");
  assert.equal(context.conversation.facts?.recipientRelationship, "madre");
  assert.equal(Object.isFrozen(context), true);
});

test("sincroniza la vista comercial sin perder identidad de ejecución", () => {
  const original = createRaiContext({ message: "hola", sessionId: "ses-2", requestId: "req-2" });
  const updated = withCommercialContext(original, { occasion: "cumpleaños", conversationState: "PROPOSAL" });

  assert.equal(updated.requestId, original.requestId);
  assert.equal(updated.session.state, "PROPOSE");
  assert.equal(updated.conversation.facts?.occasion, "cumpleaños");
  assert.equal(original.conversation.facts?.occasion, undefined);
});
