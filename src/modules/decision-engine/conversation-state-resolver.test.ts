import assert from "node:assert/strict";
import test from "node:test";
import { createRaiContext, withIntentClassification } from "../../platform/runtime/context/index.js";
import { ConversationStateResolver } from "./conversation-state-resolver.js";

const resolver = new ConversationStateResolver();

function resolve(primary: Parameters<typeof withIntentClassification>[1]["primary"], facts: Record<string, unknown> = {}) {
  const base = createRaiContext({ message: "prueba", sessionId: "state-test", facts: facts as never });
  const context = withIntentClassification(base, {
    primary,
    confidence: 0.9,
    candidates: [],
    source: "RULE",
    classifierVersion: "test",
  });
  return resolver.resolve({ context });
}

test("un regalo sin destinatario ni ocasión permanece en descubrimiento", () => {
  assert.equal(resolve("CREATE_GIFT").resolved, "DISCOVER");
});

test("un regalo con núcleo completo pasa a inspiración", () => {
  assert.equal(resolve("CREATE_GIFT", {
    recipientRelationship: "hijas",
    occasion: "cumpleaños",
  }).resolved, "INSPIRE");
});

test("un regalo con señal creativa puede pasar a propuesta", () => {
  assert.equal(resolve("CREATE_GIFT", {
    recipientRelationship: "hijas",
    occasion: "cumpleaños",
    recipientInterests: "superhéroes",
  }).resolved, "PROPOSE");
});

test("personalizar un producto seleccionado entra en refinado", () => {
  assert.equal(resolve("PERSONALIZE_PRODUCT", {
    selectedProductId: "shirt-1",
  }).resolved, "REFINE");
});
