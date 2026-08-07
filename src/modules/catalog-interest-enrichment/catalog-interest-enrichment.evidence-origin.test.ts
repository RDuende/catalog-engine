import assert from "node:assert/strict";
import test from "node:test";

import {
  CatalogInterestEnrichmentService,
} from "./catalog-interest-enrichment.service.js";

const service =
  new CatalogInterestEnrichmentService();

test("Product Brain conserva su origen en la evidencia", () => {
  const product =
    service.enrichProduct({
      id: "ball",
      name: "Artículo promocional",
      productBrain: {
        objectType: "balón",
        terms: [
          "fútbol",
          "portería",
        ],
      },
    });

  const evidence =
    product.canonicalInterestEvidence.find(
      (item) =>
        item.interestId === "football",
    );

  assert.ok(evidence);
  assert.equal(
    evidence.source,
    "PRODUCT_BRAIN",
  );
  assert.equal(
    evidence.evidence.some(
      (item) =>
        item.includes(
          "origin:PRODUCT_BRAIN",
        ),
    ),
    true,
  );
});

test("el texto de producto sigue marcado como Knowledge Brain", () => {
  const product =
    service.enrichProduct({
      id: "football-mug",
      name:
        "Taza con balón de fútbol",
    });

  const evidence =
    product.canonicalInterestEvidence.find(
      (item) =>
        item.interestId === "football",
    );

  assert.ok(evidence);
  assert.equal(
    evidence.source,
    "KNOWLEDGE_BRAIN",
  );
});
