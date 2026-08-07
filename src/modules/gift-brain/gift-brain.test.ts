import assert from "node:assert/strict";
import test from "node:test";

import {
  GiftBrainService,
} from "./gift-brain.service.js";

test("no hace propuestas con perfil incompleto", () => {
  const result =
    new GiftBrainService().analyze({
      recipientLabel: "mi padre",
    });

  assert.equal(
    result.readyForProposals,
    false,
  );
  assert.equal(
    typeof result.nextQuestion,
    "string",
  );
});

test("selecciona una estrategia con perfil completo", () => {
  const result =
    new GiftBrainService().analyze({
      recipientLabel: "mi padre",
      occasion: "cumpleaños",
      budget: 70,
      interests: ["motocross"],
      desiredImpact: ["sorprender"],
    });

  assert.equal(
    result.readyForProposals,
    true,
  );
  assert.ok(result.decision);
  assert.equal(
    result.simulations.length > 2,
    true,
  );
});

test("varios destinatarios favorecen experiencia compartida", () => {
  const result =
    new GiftBrainService().analyze({
      recipientLabel: "mis padres",
      occasion: "aniversario",
      budget: 90,
      interests: ["viajes"],
      recipientCount: 2,
    });

  assert.equal(
    result.strategies.some(
      (item) =>
        item.kind === "SHARED_EXPERIENCE",
    ),
    true,
  );
});
