import assert from "node:assert/strict";
import test from "node:test";
import {
  createConversationState,
  RaiConversationEngine,
} from "./engine.js";
import { decideConversation } from "./orchestrator-decision.js";

const engine = new RaiConversationEngine();

function decide(
  message: string,
  mode: "DISCOVER" | "GENERATE_PROPOSALS" = "DISCOVER",
) {
  const process = engine.process(
    createConversationState("journey-1", "2026-08-04T10:00:00.000Z"),
    {
      id: "message-1",
      role: "USER",
      text: message,
      createdAt: "2026-08-04T10:00:01.000Z",
    },
  );

  return decideConversation({
    process,
    message,
    mode,
    now: "2026-08-04T10:00:02.000Z",
  });
}

test("RCE gobierna la siguiente pregunta sin usar el guion clásico", () => {
  const result = decide("Es para mi sobrino");

  assert.equal(result.needsInput, true);
  assert.equal(result.pendingFact, "occasion.type");
  assert.equal(result.nextQuestion, "¿Qué vais a celebrar?");
});

test("RCE ofrece propuestas cuando existe contexto suficiente", () => {
  const result = decide(
    "Es para mi sobrino que cumple 10 años y le encanta el fútbol",
  );

  assert.equal(result.needsInput, false);
  assert.equal(result.readyForProposals, true);
  assert.equal(result.shouldGenerateProposals, false);
  assert.equal(result.plan.response.action?.type, "SHOW_PROPOSALS");
});

test("DISCOVER nunca genera propuestas automáticamente", () => {
  const result = decide(
    "Es para mi sobrino por su cumpleaños, le gusta Marvel",
    "DISCOVER",
  );

  assert.equal(result.shouldGenerateProposals, false);
});

test("GENERATE_PROPOSALS conserva la ejecución de motores posteriores", () => {
  const result = decide(
    "Muéstrame propuestas",
    "GENERATE_PROPOSALS",
  );

  assert.equal(result.shouldGenerateProposals, true);
});
