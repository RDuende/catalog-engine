import assert from "node:assert/strict";
import test from "node:test";
import { BlockDetectorService } from "./block-detector.service.js";

test("detecta cabecera, productos y pie", () => {
  const detector = new BlockDetectorService();
  const blocks = detector.detectPage({
    page: 12,
    text: [
      "MAKITO 2027",
      "MOCHILAS",
      "20411 TURAM",
      "Mochila de poliéster reciclado.",
      "Medidas: 30 x 40 cm",
      "1 100 500 2,10 1,95 1,80",
      "20412 PALAN",
      "Mochila plegable.",
      "www.ejemplo.com 12"
    ].join("\n")
  });

  assert.equal(blocks.some((block) => block.type === "HEADER"), true);
  assert.equal(blocks.filter((block) => block.type === "PRODUCT").length, 2);
  assert.equal(blocks.at(-1)?.type, "FOOTER");
  assert.match(blocks.find((block) => block.type === "PRODUCT")?.text ?? "", /20411 TURAM/);
});

test("genera estadísticas consistentes", () => {
  const detector = new BlockDetectorService();
  const result = detector.detect([
    { page: 1, text: "CATÁLOGO\n12345 ITEM\nDescripción" },
    { page: 2, text: "BOTELLAS\n54321 BOTTLE\n500 ml\n2,50 €" }
  ]);

  assert.equal(result.pages, 2);
  assert.equal(result.statistics.total, result.blocks.length);
  assert.equal(result.statistics.byType.PRODUCT, 2);
  assert.ok(result.statistics.averageConfidence > 0);
});
