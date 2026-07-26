import assert from "node:assert/strict";
import test from "node:test";
import { parseConstraints } from "./constraint-parser.js";

test("extrae presupuestos expresados de forma natural", () => {
  const cases: Array<[string, number]> = [
    ["tengo 30 euros", 3000],
    ["tengo unos 30 €", 3000],
    ["mi presupuesto es de 30 euros", 3000],
    ["puedo gastar 30 eur", 3000],
    ["aproximadamente 30 euros", 3000],
    ["30 €", 3000],
  ];

  for (const [text, expected] of cases) {
    assert.equal(parseConstraints(text).maxPriceMinor, expected, text);
  }
});

test("extrae límites y rangos de presupuesto", () => {
  assert.equal(parseConstraints("menos de 50 euros").maxPriceMinor, 5000);
  assert.equal(parseConstraints("como máximo 40 €").maxPriceMinor, 4000);
  assert.equal(parseConstraints("al menos 20 euros").minPriceMinor, 2000);
  assert.deepEqual(
    { min: parseConstraints("entre 20 y 30 euros").minPriceMinor, max: parseConstraints("entre 20 y 30 euros").maxPriceMinor },
    { min: 2000, max: 3000 },
  );
});


test("detecta peticiones naturales de personalización", () => {
  const positive = [
    "Quiero que lleve una foto",
    "que incluya fotos",
    "poner el nombre",
    "quiero una dedicatoria",
    "con logo",
    "personalizado",
  ];

  for (const text of positive) {
    assert.equal(parseConstraints(text).personalization, true, text);
  }

  assert.equal(parseConstraints("sin personalizar").personalization, false);
});
