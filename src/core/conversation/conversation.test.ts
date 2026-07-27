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


test("detecta hija y edad sin repetir la pregunta de destinatario", () => {
  const engine = new ConversationEngine();
  const reply = engine.continue("Busco un regalo para mi hija de 12 años");

  assert.equal(reply.session.mergedIntent?.recipient, "hija");
  assert.equal(reply.session.mergedIntent?.recipientAge, 12);
  assert.equal(reply.session.mergedIntent?.audienceSegment, "infantil");
  assert.ok(!reply.session.missingFields.includes("recipient"));
  assert.match(reply.nextQuestion ?? "", /cumpleaños/i);
});

test("entiende una respuesta corta de destinatario y avanza", () => {
  const engine = new ConversationEngine();
  const first = engine.continue("Busco un regalo");
  const second = engine.continue("mi hija", first.session.sessionId);

  assert.equal(second.session.mergedIntent?.recipient, "hija");
  assert.ok(!second.session.missingFields.includes("recipient"));
  assert.doesNotMatch(second.nextQuestion ?? "", /para quién/i);
});

test("agrupa las preguntas pendientes cuando ya conoce al destinatario", () => {
  const engine = new ConversationEngine();
  const reply = engine.continue("Es para mi padre");

  assert.match(reply.nextQuestion ?? "", /ocasión/i);
  assert.match(reply.nextQuestion ?? "", /presupuesto/i);
  assert.match(reply.nextQuestion ?? "", /foto/i);
});


test("fusiona graduación, presupuesto y foto en una sola respuesta", () => {
  const engine = new ConversationEngine();
  const first = engine.continue("Busco un regalo para mi hija de 12 años");
  const second = engine.continue("Es por su graduación, unos 50€, sí quiero añadir una foto", first.session.sessionId);

  assert.equal(second.session.mergedIntent?.recipient, "hija");
  assert.equal(second.session.mergedIntent?.recipientAge, 12);
  assert.equal(second.session.mergedIntent?.occasion, "graduacion");
  assert.equal(second.session.mergedIntent?.maxPriceMinor, 5000);
  assert.equal(second.session.mergedIntent?.personalization, true);
  assert.equal(second.readyForIdeas, true);
  assert.deepEqual(second.session.missingFields, []);
});


test("entiende una respuesta corta de personalización con foto", () => {
  const engine = new ConversationEngine();
  const first = engine.continue("Para la graduación de mi padre de 70 años");
  const second = engine.continue("50 €", first.session.sessionId);
  const third = engine.continue("una foto", first.session.sessionId);

  assert.equal(third.session.mergedIntent?.recipient, "padre");
  assert.equal(third.session.mergedIntent?.recipientAge, 70);
  assert.equal(third.session.mergedIntent?.occasion, "graduacion");
  assert.equal(third.session.mergedIntent?.maxPriceMinor, 5000);
  assert.equal(third.session.mergedIntent?.personalization, true);
  assert.equal(third.readyForIdeas, true);
  assert.deepEqual(third.session.missingFields, []);
  assert.equal(third.nextQuestion, undefined);
});

test("entiende respuestas cortas equivalentes de personalización", () => {
  for (const answer of ["foto", "una fotografía", "una imagen", "su nombre", "una dedicatoria", "una frase", "las tres"]) {
    const engine = new ConversationEngine();
    const first = engine.continue("Es para mi madre por su cumpleaños y tengo 30 €");
    const second = engine.continue(answer, first.session.sessionId);
    assert.equal(second.session.mergedIntent?.personalization, true, answer);
    assert.equal(second.readyForIdeas, true, answer);
  }
});
