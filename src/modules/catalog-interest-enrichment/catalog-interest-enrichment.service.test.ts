import assert from "node:assert/strict";
import test from "node:test";

import {
  CatalogInterestEnrichmentService,
} from "./catalog-interest-enrichment.service.js";

const service =
  new CatalogInterestEnrichmentService();

test("asigna cooking a un producto de cocina", () => {
  const product = service.enrichProduct(
    {
      id: "apron",
      sku: "APR-1",
      name: "Delantal para chef",
      category: "TEXTILE",
      tags: [
        "cocina",
        "barbacoa",
      ],
    },
    {
      now:
        "2026-08-05T08:00:00.000Z",
    },
  );

  assert.equal(
    product.canonicalInterests.includes(
      "cooking",
    ),
    true,
  );
  assert.equal(
    product.canonicalInterestEvidence
      .some(
        (item) =>
          item.interestId ===
            "cooking" &&
          item.confidence >= 0.72,
      ),
    true,
  );
});

test("conserva intereses manuales", () => {
  const product = service.enrichProduct(
    {
      id: "custom",
      name: "Producto especial",
      canonicalInterests: [
        "football",
      ],
    },
  );

  assert.deepEqual(
    product.canonicalInterests,
    ["football"],
  );
  assert.equal(
    product.canonicalInterestEvidence[0]
      ?.source,
    "MANUAL",
  );
});

test("no asigna jardinería por una palabra genérica", () => {
  const product = service.enrichProduct(
    {
      id: "natural-bag",
      name: "Bolsa natural",
      category: "BAGS",
      tags: ["natural"],
    },
  );

  assert.equal(
    product.canonicalInterests.includes(
      "gardening",
    ),
    false,
  );
});

test("genera informe de cobertura", () => {
  const result = service.enrichCatalog([
    {
      id: "cook",
      name: "Taza de chef",
      tags: ["cocina"],
    },
    {
      id: "unknown",
      name: "Artículo promocional",
    },
  ]);

  assert.equal(
    result.report.totalProducts,
    2,
  );
  assert.equal(
    result.report.changedProducts,
    1,
  );
  assert.equal(
    result.report.after
      .productsWithCanonicalInterests,
    1,
  );
  assert.equal(
    result.report.after.coveragePercent,
    50,
  );
});

test("usa Product Brain como evidencia", () => {
  const product = service.enrichProduct({
    id: "ball",
    name: "Artículo deportivo",
    productBrain: {
      objectType: "balón",
      giftRoles: [
        "PRIMARY",
      ],
      terms: [
        "fútbol",
        "portería",
      ],
    },
  });

  assert.equal(
    product.canonicalInterests.includes(
      "football",
    ),
    true,
  );
  assert.equal(
    product.canonicalInterestEvidence
      .some(
        (item) =>
          item.source ===
            "PRODUCT_BRAIN",
      ),
    true,
  );
});
