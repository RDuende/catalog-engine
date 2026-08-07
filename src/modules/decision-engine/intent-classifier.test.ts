import assert from "node:assert/strict";
import test from "node:test";
import { IntentClassifier } from "./intent-classifier.js";

const classifier = new IntentClassifier();

test("clasifica una solicitud de regalo para gemelas", () => {
  const result = classifier.classify({
    message: "Quiero hacer un regalo de cumpleaños a mis gemelas",
  });
  assert.equal(result.primary, "CREATE_GIFT");
  assert.equal(result.source, "RULE");
  assert.ok(result.confidence >= 0.7);
});

test("distingue edición y generación de imágenes", () => {
  assert.equal(classifier.classify({ message: "Quita el fondo de esta foto" }).primary, "EDIT_IMAGE");
  assert.equal(classifier.classify({ message: "Genera una ilustración de dos superheroínas" }).primary, "GENERATE_IMAGE");
});

test("detecta seguimiento de pedido y soporte humano", () => {
  assert.equal(classifier.classify({ message: "Dónde está mi pedido" }).primary, "CHECK_ORDER");
  assert.equal(classifier.classify({ message: "Quiero hablar con una persona" }).primary, "HUMAN_SUPPORT");
});

test("conserva la intención previa en una continuación breve", () => {
  const previous = classifier.classify({ message: "Quiero hacer un regalo para mis hijas" });
  const result = classifier.classify({ message: "7", previous });
  assert.equal(result.primary, "CREATE_GIFT");
  assert.equal(result.source, "CONTEXT_FALLBACK");
});

test("devuelve UNKNOWN cuando no existe señal suficiente", () => {
  const result = classifier.classify({ message: "azul" });
  assert.equal(result.primary, "UNKNOWN");
  assert.equal(result.source, "DEFAULT");
});
