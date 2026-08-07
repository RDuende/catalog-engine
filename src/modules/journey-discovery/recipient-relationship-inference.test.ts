import assert from "node:assert/strict";
import test from "node:test";
import { inferRecipientRelationshipFacts } from "./recipient-relationship-inference.js";

function fact(message: string, key: string) {
  return inferRecipientRelationshipFacts(message).find((item) => item.key === key);
}

test("infiere relación, alcance y cantidad desde un destinatario posesivo singular", () => {
  assert.equal(fact("un regalo para la comunión de mi sobrino de 7 años", "gift.scope")?.value, "personal");
  assert.equal(fact("un regalo para la comunión de mi sobrino de 7 años", "recipient.relationship")?.value, "nephew");
  assert.equal(fact("un regalo para la comunión de mi sobrino de 7 años", "recipient.count")?.value, 1);
});

test("resuelve una respuesta contextual corta", () => {
  assert.equal(fact("es mi sobrino", "recipient.relationship")?.value, "nephew");
  assert.equal(fact("es mi hermana", "recipient.relationship")?.value, "sibling");
  assert.equal(fact("es mi hijo", "recipient.relationship")?.value, "child");
});

test("no confunde posesivos de datos con destinatarios", () => {
  for (const message of [
    "mis colores favoritos son azul y verde",
    "mi presupuesto es 30 euros",
    "mi foto no se ve bien",
    "mis gustos son clásicos",
  ]) {
    assert.deepEqual(inferRecipientRelationshipFacts(message), []);
  }
});

test("no inventa una cantidad exacta para relaciones plurales", () => {
  assert.equal(fact("es para mis sobrinos", "recipient.relationship")?.value, "nephew");
  assert.equal(fact("es para mis sobrinos", "recipient.count"), undefined);
});
