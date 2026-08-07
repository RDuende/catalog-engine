import assert from "node:assert/strict";
import test from "node:test";
import { JourneyProject } from "../journey-domain/index.js";
import { applyDiscovery, DiscoveryExtractor } from "./index.js";

const extractor = new DiscoveryExtractor();

test("extrae gemelas, edad, ocasión e intención de regalo", () => {
  const result = extractor.extract({ message: "Quiero hacer un regalo de cumpleaños a mis gemelas de 7 años" });
  assert.equal(result.participants.length, 2);
  assert.equal(result.participants[0]?.age, 7);
  assert.equal(result.participants[0]?.relationship, "daughter");
  assert.equal(result.facts.find((fact) => fact.key === "occasion.type")?.value, "birthday");
  assert.equal(result.facts.find((fact) => fact.key === "recipient.count")?.value, 2);
  assert.equal(result.facts.find((fact) => fact.key === "journey.intent")?.value, "create_gift");
});

test("extrae nombres y presupuesto en euros", () => {
  const result = extractor.extract({ message: "Se llaman Lucía y Sofía y tengo un presupuesto de 60 euros" });
  assert.deepEqual(result.participants.map((item) => item.name), ["Lucía", "Sofía"]);
  assert.equal(result.facts.find((fact) => fact.key === "budget.max")?.value, 60);
  assert.equal(result.facts.find((fact) => fact.key === "budget.currency")?.value, "EUR");
});



test("extrae variantes habituales de presupuesto", () => {
  const cases = [
    ["Tengo un presupuesto de 60 euros", 60],
    ["Mi presupuesto máximo es 75 €", 75],
    ["Quiero gastar hasta 40 euros", 40],
    ["Dispongo de unos 29,95 €", 29.95],
    ["Sobre €50", 50],
    ["Mi presupuesto sería de 80 euros", 80],
    ["Puedo gastar €45", 45],
  ] as const;

  for (const [message, expected] of cases) {
    const result = extractor.extract({ message });
    assert.equal(
      result.facts.find((fact) => fact.key === "budget.max")?.value,
      expected,
      message,
    );
  }
});

test("aplica el descubrimiento al JourneyProject y conserva trazabilidad", () => {
  const project = JourneyProject.create({ type: "GIFT", sessionId: "session-v1-2", now: "2026-08-02T00:00:00.000Z" });
  const extraction = extractor.extract({ message: "Quiero un regalo de cumpleaños para mis gemelas de 7 años" });
  const updated = applyDiscovery(project, extraction);
  assert.equal(updated.status, "DISCOVERING");
  assert.equal(updated.snapshot().participants.length, 2);
  assert.equal(updated.snapshot().facts.find((fact) => fact.key === "recipient.age")?.value, 7);
  assert.equal(
    updated.snapshot().facts.find((fact) => fact.key === "discovery.last_extractor_version")?.value,
    extraction.extractorVersion,
  );
  assert.equal(project.snapshot().participants.length, 0);
});

test("no duplica participantes al reaplicar la misma extracción", () => {
  const extraction = extractor.extract({ message: "Regalo de cumpleaños para mis gemelas de 7 años" });
  const once = applyDiscovery(JourneyProject.create({ type: "GIFT" }), extraction);
  const twice = applyDiscovery(once, extraction);
  assert.equal(twice.snapshot().participants.length, 2);
});


test("no presupone destinatario ante un regalo ambiguo", () => {
  const result = new DiscoveryExtractor().extract({ message: "Quiero un regalo" });
  assert.equal(result.facts.find((fact) => fact.key === "gift.scope"), undefined);
});

test("clasifica regalos genéricos y personales", () => {
  const generic = new DiscoveryExtractor().extract({ message: "Busco una idea de regalo genérica" });
  assert.equal(generic.facts.find((fact) => fact.key === "gift.scope")?.value, "generic");
  const personal = new DiscoveryExtractor().extract({ message: "Quiero un regalo para mis padres" });
  assert.equal(personal.facts.find((fact) => fact.key === "gift.scope")?.value, "personal");
  assert.equal(personal.facts.find((fact) => fact.key === "recipient.count")?.value, 2);
});


test("extrae una idea genérica en femenino", () => {
  const result = new DiscoveryExtractor().extract({ message: "Busco una idea genérica" });
  assert.equal(result.facts.find((fact) => fact.key === "gift.scope")?.value, "generic");
});

test("cualquier destinatario introducido por mis fija alcance personal", () => {
  const cases = [
    ["un regalo de aniversario poara mis tíos", "uncle_aunt"],
    ["un detalle para mis amigos", "friend"],
    ["algo para mis compañeros", "coworker"],
    ["un regalo para mis vecinos", "neighbor"],
    ["un detalle para mis clientes", "client"],
  ] as const;

  for (const [message, relationship] of cases) {
    const result = extractor.extract({ message });
    assert.equal(result.facts.find((fact) => fact.key === "gift.scope")?.value, "personal", message);
    assert.equal(result.facts.find((fact) => fact.key === "recipient.relationship")?.value, relationship, message);
    assert.equal(result.facts.find((fact) => fact.key === "recipient.count"), undefined, message);
  }
});

test("mi destinatario singular fija cantidad uno", () => {
  const result = extractor.extract({ message: "un regalo para mi hermana" });
  assert.equal(result.facts.find((fact) => fact.key === "gift.scope")?.value, "personal");
  assert.equal(result.facts.find((fact) => fact.key === "recipient.relationship")?.value, "sibling");
  assert.equal(result.facts.find((fact) => fact.key === "recipient.count")?.value, 1);
});

test("no confunde posesivos de datos con destinatarios", () => {
  const cases = ["mi presupuesto es de 60 euros", "mis ideas son estas", "mis colores favoritos son azul y verde"];
  for (const message of cases) {
    const result = extractor.extract({ message });
    assert.equal(result.facts.find((fact) => fact.key === "gift.scope"), undefined, message);
  }
});
