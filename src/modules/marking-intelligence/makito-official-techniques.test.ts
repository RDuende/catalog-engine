import assert from "node:assert/strict";
import test from "node:test";

import {
  buildMakitoOfficialTechniqueCatalog,
  classifyMakitoOfficialTechnique,
} from "./makito-official-techniques.js";

test("clasifica familias oficiales Makito sin depender de inferencia", () => {
  assert.equal(classifyMakitoOfficialTechnique("TAMPOGRAFÍA A").normalizedCode, "PAD_PRINTING");
  assert.equal(classifyMakitoOfficialTechnique("SERIGRAFÍA A").normalizedCode, "SCREEN_PRINTING");
  assert.equal(classifyMakitoOfficialTechnique("GRABACIÓN LASER 1").normalizedCode, "LASER");
  assert.equal(classifyMakitoOfficialTechnique("GRABACIÓN BORDADO P (FULLCOLOR)").normalizedCode, "EMBROIDERY");
  assert.equal(classifyMakitoOfficialTechnique("GRABACIÓN TRANSFER DIGITAL (FULLCOLOR)").normalizedCode, "TRANSFER");
  assert.equal(classifyMakitoOfficialTechnique("SUBLIMACIÓN TAMAÑO GRANDE (+100 cm2) (FULLCOLOR)").normalizedCode, "SUBLIMATION");
});

test("mantiene como OTHER familias oficiales sin enum propio", () => {
  assert.equal(classifyMakitoOfficialTechnique("TERMOGRABADO SECO").normalizedCode, "OTHER");
  assert.equal(classifyMakitoOfficialTechnique("DOMING - GOTA DE RESINA V1 -5 cm2 (FULLCOLOR)").normalizedCode, "OTHER");
});

test("construye catálogo oficial con precio, variante y confianza 1", () => {
  const catalog = buildMakitoOfficialTechniqueCatalog({
    generatedAt: "2026-07-22T06:55:52Z",
    printPriceList: [
      {
        id: "100400",
        code: "L1",
        category: "GRABACIÓN LASER 1",
        terms: "Condiciones láser",
        prices: {
          currency: "€",
          minPrice: 30,
          setupFee: 20,
          tiers: [{ threshold: "250", type: "UNIT", price: 0.4 }],
        },
      },
    ],
  });

  assert.equal(catalog.techniques.length, 1);
  const technique = catalog.techniques[0];
  assert.equal(technique?.providerCode, "100400");
  assert.equal(technique?.providerVariantCode, "L1");
  assert.equal(technique?.normalizedCode, "LASER");
  assert.equal(technique?.confidence, 1);
  assert.equal(technique?.pricing?.setupFee, 20);
  assert.equal(technique?.pricing?.tiers[0]?.price, 0.4);
});
