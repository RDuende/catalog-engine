import assert from "node:assert/strict";
import test from "node:test";
import { MvpOrchestrator } from "./mvp-orchestrator.js";

function fact(result: Awaited<ReturnType<MvpOrchestrator["run"]>>, key: string): unknown {
  return result.journey.facts.find((item) => item.key === key)?.value;
}

test("pregunta primero si el regalo es genérico o personal", async () => {
  const engine = new MvpOrchestrator();
  const result = await engine.run({ message: "Quiero un regalo" });
  assert.equal(result.status, "NEEDS_INPUT");
  assert.equal(result.nextQuestion, "¿Buscas una idea de regalo genérica o quieres crear algo para alguien en particular?");
});

test("la rama personal infiere mis padres y conserva los hechos", async () => {
  const engine = new MvpOrchestrator();
  const first = await engine.run({ message: "Quiero un regalo" });
  const second = await engine.run({ message: "Para mis padres", journey: first.journey });
  assert.equal(fact(second, "gift.scope"), "personal");
  assert.equal(fact(second, "recipient.count"), 2);
  assert.equal(fact(second, "recipient.relationship"), "parent");
  const third = await engine.run({ message: "Sus cumpleaños", journey: second.journey });
  assert.equal(fact(third, "recipient.count"), 2);
  assert.equal(fact(third, "recipient.relationship"), "parent");
  assert.equal(fact(third, "occasion.type"), "birthday");
  assert.notEqual(third.nextQuestion, "¿Para cuántas personas será el regalo?");
});

test("la rama genérica no exige destinatarios", async () => {
  const engine = new MvpOrchestrator();
  const first = await engine.run({ message: "Quiero un regalo" });
  const second = await engine.run({ message: "Una idea genérica", journey: first.journey });
  assert.equal(fact(second, "gift.scope"), "generic");
  assert.equal(second.nextQuestion, "¿Para qué ocasión o finalidad buscas el regalo?");
  assert.ok(!second.missingRequired.includes("recipient.count"));
  assert.ok(!second.missingRequired.includes("recipient.relationship"));
});
