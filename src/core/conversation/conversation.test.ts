import assert from "node:assert/strict";
import test from "node:test";
import { ConversationEngine } from "./engine.js";

test("mantiene y completa el contexto entre mensajes", () => {
  const engine = new ConversationEngine();
  const first = engine.continue("Quiero un regalo para mi madre");
  const second = engine.continue("Es por su cumpleaños y tengo 30 euros", first.session.sessionId);
  assert.equal(second.session.mergedIntent?.recipient, "madre");
  assert.equal(second.session.mergedIntent?.occasion, "cumpleanos");
  assert.equal(second.session.mergedIntent?.maxPriceMinor, 3000);
  assert.ok(second.session.turns.length >= 3);
});

test("conserva los datos anteriores al completar la personalización", () => {
  const engine = new ConversationEngine();
  const first = engine.continue("Busco un regalo para mi madre por su cumpleaños");
  const second = engine.continue("Tengo unos 30 €", first.session.sessionId);
  const third = engine.continue("Quiero que lleve una foto", first.session.sessionId);

  assert.equal(third.session.mergedIntent?.recipient, "madre");
  assert.equal(third.session.mergedIntent?.occasion, "cumpleanos");
  assert.equal(third.session.mergedIntent?.maxPriceMinor, 3000);
  assert.equal(third.session.mergedIntent?.personalization, true);
  assert.equal(third.readyForIdeas, true);
  assert.deepEqual(third.session.missingFields, []);
  assert.ok(second.session.turns.length < third.session.turns.length);
});

test("actualiza un presupuesto cuando el usuario lo corrige explícitamente", () => {
  const engine = new ConversationEngine();
  const first = engine.continue("Es para mi madre, por su cumpleaños, con foto y tengo 30 euros");
  const second = engine.continue("Mejor como máximo 40 euros", first.session.sessionId);

  assert.equal(first.session.mergedIntent?.maxPriceMinor, 3000);
  assert.equal(second.session.mergedIntent?.maxPriceMinor, 4000);
  assert.equal(second.session.mergedIntent?.recipient, "madre");
  assert.equal(second.session.mergedIntent?.occasion, "cumpleanos");
});
