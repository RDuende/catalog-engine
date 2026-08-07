import assert from "node:assert/strict";
import test from "node:test";
import {
  createConversationState,
  RaiConversationEngine,
} from "./engine.js";
import { RceConversationPlanner } from "./conversation-planner.js";

const engine = new RaiConversationEngine();
const planner = new RceConversationPlanner();

function process(text: string) {
  const result = engine.process(
    createConversationState("c1", "2026-08-04T10:00:00.000Z"),
    {
      id: "m1",
      role: "USER",
      text,
      createdAt: "2026-08-04T10:00:01.000Z",
    },
  );

  return planner.plan({
    state: result.state,
    text,
    understanding: result.understanding,
    now: "2026-08-04T10:00:02.000Z",
  });
}

test("planifica búsqueda en segundo plano mientras pregunta", () => {
  const plan = process(
    "Es para mi sobrino que cumple 10 años y le encanta el fútbol",
  );

  assert.equal(plan.response.mode, "READY");
  assert.equal(
    plan.tasks.some((task) => task.type === "SEARCH_PRODUCTS"),
    true,
  );
  assert.equal(
    plan.tasks.some((task) => task.type === "PREPARE_PROPOSALS"),
    true,
  );
});

test("no ejecuta propuestas automáticamente sin petición explícita", () => {
  const plan = process(
    "Es para mi sobrino por su cumpleaños y le gusta Marvel",
  );

  assert.equal(plan.response.action?.type, "SHOW_PROPOSALS");
  assert.equal(plan.intent, "DISCOVER_GIFT");
});

test("una petición explícita activa propuestas", () => {
  const plan = process("Muéstrame propuestas");

  assert.equal(plan.intent, "GENERATE_PROPOSALS");
  assert.equal(plan.response.mode, "ACTION");
  assert.equal(
    plan.tasks.some((task) => task.type === "PREPARE_PROPOSALS"),
    true,
  );
});

test("pregunta por la ocasión cuando solo conoce la relación", () => {
  const plan = process("Es para mi sobrino");

  assert.equal(plan.response.mode, "ASK");
  assert.equal(plan.response.question, "¿Qué vais a celebrar?");
});

test("interpreta más barato como evolución de propuestas", () => {
  const plan = process("Quiero algo más barato");

  assert.equal(plan.intent, "REDUCE_PRICE");
  assert.equal(
    plan.tasks.some((task) => task.type === "REFINE_PROPOSALS"),
    true,
  );
});

test("genera una respuesta contextual sin repetir un guion", () => {
  const plan = process("Es para mi sobrino por su décimo cumpleaños");

  assert.match(plan.response.text, /sobrino|sobrina/i);
  assert.match(plan.response.text, /10 años/i);
  assert.match(plan.response.text, /cumpleaños/i);
});
