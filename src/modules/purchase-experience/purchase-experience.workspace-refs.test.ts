import assert from "node:assert/strict";
import test from "node:test";

import { InMemorySmartCatalogRepository } from "../smart-catalog/index.js";
import { InMemoryPurchaseOrderRepository } from "./in-memory-purchase-order.repository.js";
import { PurchaseExperienceService } from "./purchase-experience.service.js";

test("conserva referencias del Purchase Intent y Workspace en la línea", () => {
  const service = new PurchaseExperienceService(
    new InMemoryPurchaseOrderRepository(),
    new InMemorySmartCatalogRepository(),
  );

  const order = service.create({
    journeyId: "journey-workspace",
    lines: [
      {
        productId: "mug-ceramic",
        quantity: 1,
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
  });

  assert.equal(
    order.lines[0]?.purchaseIntentArtifactId,
    "intent-1",
  );
  assert.deepEqual(
    order.lines[0]?.workspaceArtifactIds,
    [
      "personalization-1",
      "design-1",
      "render-1",
      "preview-1",
    ],
  );
  assert.equal(order.lines[0]?.proposalId, "proposal-1");
});
