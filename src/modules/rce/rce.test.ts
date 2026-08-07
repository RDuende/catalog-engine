import assert from "node:assert/strict";
import test from "node:test";
import { createConversationState, RaiConversationEngine } from "./index.js";

const engine = new RaiConversationEngine();

function run(text: string) {
  return engine.process(
    createConversationState("c1", "2026-08-03T10:00:00.000Z"),
    {
      id: "m1",
      role: "USER",
      text,
      createdAt: "2026-08-03T10:00:01.000Z",
    },
  );
}

test("extrae relación, cantidad, ocasión y edad ordinal en un solo mensaje", () => {
  const result = run("un regalo para mi sobrino para su decimo cunpleaños");

  assert.equal(result.state.facts["gift.scope"]?.value, "personal");
  assert.equal(result.state.facts["recipient.relationship"]?.value, "nephew");
  assert.equal(result.state.facts["recipient.count"]?.value, 1);
  assert.equal(result.state.facts["occasion.type"]?.value, "birthday");
  assert.equal(result.state.facts["recipient.age"]?.value, 10);
});

test("extrae simultáneamente destinatario, edad, interés y presupuesto", () => {
  const result = run(
    "Es para mi sobrino de 12 años, le gusta el fútbol y Marvel y tengo 30 €",
  );

  assert.equal(result.state.facts["recipient.relationship"]?.value, "nephew");
  assert.equal(result.state.facts["recipient.age"]?.value, 12);
  assert.deepEqual(
    result.state.facts["recipient.interests"]?.value,
    ["football", "marvel"],
  );
  assert.equal(result.state.facts["budget.max"]?.value, 30);
});

test("fusiona intereses en mensajes sucesivos", () => {
  let state = createConversationState("c1", "2026-08-03T10:00:00.000Z");

  state = engine.process(state, {
    id: "m1",
    role: "USER",
    text: "Le gusta el fútbol",
    createdAt: "2026-08-03T10:00:01.000Z",
  }).state;

  state = engine.process(state, {
    id: "m2",
    role: "USER",
    text: "También Marvel",
    createdAt: "2026-08-03T10:00:02.000Z",
  }).state;

  assert.deepEqual(
    state.facts["recipient.interests"]?.value,
    ["football", "marvel"],
  );
});

test("elimina un interés negado sin borrar los demás", () => {
  let state = createConversationState("c1", "2026-08-03T10:00:00.000Z");

  state = engine.process(state, {
    id: "m1",
    role: "USER",
    text: "Le gusta el fútbol y Pokémon",
    createdAt: "2026-08-03T10:00:01.000Z",
  }).state;

  state = engine.process(state, {
    id: "m2",
    role: "USER",
    text: "Pokémon no",
    createdAt: "2026-08-03T10:00:02.000Z",
  }).state;

  assert.deepEqual(state.facts["recipient.interests"]?.value, ["football"]);
});

test("corrige la edad y conserva historial", () => {
  let state = createConversationState("c1", "2026-08-03T10:00:00.000Z");

  state = engine.process(state, {
    id: "m1",
    role: "USER",
    text: "Tiene 12 años",
    createdAt: "2026-08-03T10:00:01.000Z",
  }).state;

  state = engine.process(state, {
    id: "m2",
    role: "USER",
    text: "Perdón, tiene 13 años",
    createdAt: "2026-08-03T10:00:02.000Z",
  }).state;

  assert.equal(state.facts["recipient.age"]?.value, 13);
  assert.equal(state.facts["recipient.age"]?.history.length, 1);
  assert.equal(state.facts["recipient.age"]?.history[0]?.value, 12);
});

test("interpreta mostrar ideas como un objetivo y no como un dato", () => {
  const result = run("Muéstrame ya algunas ideas");
  assert.equal(result.understanding.kind, "REQUEST_PROPOSALS");
  assert.deepEqual(result.state.requestedGoals, ["GENERATE_PROPOSALS"]);
});

test("no confunde datos posesivos con destinatarios", () => {
  const result = run("Mis colores favoritos son azul y verde");
  assert.equal(result.state.facts["recipient.relationship"], undefined);
  assert.equal(result.state.facts["gift.scope"], undefined);
});
