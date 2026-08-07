import assert from "node:assert/strict";
import test from "node:test";

import {
  buildProductionPackage,
} from "./production-package.builder.js";

test("conserva referencias creativas en el paquete de producción", () => {
  const productionPackage = buildProductionPackage({
    id: "order-1",
    journeyId: "journey-1",
    status: "PAID",
    lines: [
      {
        productId: "mug",
        sku: "MUG-1",
        name: "Taza",
        quantity: 1,
        unitPrice: 15,
        lineTotal: 15,
        currency: "EUR",
        presentationArtifactId: "preview-1",
        purchaseIntentArtifactId: "intent-1",
        workspaceArtifactIds: [
          "personalization-1",
          "design-1",
          "render-1",
          "preview-1",
        ],
        proposalId: "proposal-1",
      },
    ],
    totals: {
      subtotal: 15,
      shipping: 4.95,
      tax: 0,
      total: 19.95,
      currency: "EUR",
    },
    createdAt: "2026-08-04T20:00:00.000Z",
    updatedAt: "2026-08-04T21:00:00.000Z",
    paidAt: "2026-08-04T21:00:00.000Z",
  });

  assert.equal(
    productionPackage.lines[0]?.proposalId,
    "proposal-1",
  );
  assert.equal(
    productionPackage.lines[0]?.artifacts.some(
      (item) =>
        item.artifactId === "intent-1" &&
        item.role === "PURCHASE_INTENT",
    ),
    true,
  );
  assert.equal(
    productionPackage.lines[0]?.artifacts.some(
      (item) =>
        item.artifactId === "preview-1",
    ),
    true,
  );
});
