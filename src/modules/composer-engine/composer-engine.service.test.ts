import assert from "node:assert/strict";
import test from "node:test";

import {
  ComposerEngineService,
} from "./composer-engine.service.js";

const service =
  new ComposerEngineService();

const candidates = [
  {
    id: "board",
    name: "Tabla grabada",
    price: 25,
    cost: 10,
    stock: 10,
    score: 0.95,
    canonicalInterests: [
      "cooking",
    ],
    materials: ["wood"],
    personalizationAvailable:
      true,
    bundleRoles: [
      "HERO",
      "CORE",
    ],
  },
  {
    id: "apron",
    name:
      "Delantal personalizado",
    price: 18,
    cost: 7,
    stock: 10,
    score: 0.88,
    canonicalInterests: [
      "cooking",
    ],
    personalizationAvailable:
      true,
    bundleRoles: [
      "COMPLEMENT",
    ],
  },
  {
    id: "card",
    name:
      "Tarjeta con receta familiar",
    price: 5,
    cost: 1,
    stock: 100,
    score: 0.8,
    canonicalInterests: [
      "cooking",
    ],
    personalizationAvailable:
      true,
    bundleRoles: [
      "MESSAGE",
    ],
  },
  {
    id: "box",
    name: "Caja regalo",
    price: 8,
    cost: 3,
    stock: 20,
    score: 0.7,
    bundleRoles: [
      "PACKAGING",
    ],
  },
] as const;

test("compone un lote coherente dentro de presupuesto", () => {
  const result = service.compose(
    candidates,
    {
      journeyId: "journey-1",
      ownerId: "owner-1",
      interests: ["cooking"],
      preferredMaterials: [
        "wood",
      ],
      budget: 60,
      minItems: 2,
      maxItems: 4,
    },
    {
      now:
        "2026-08-05T20:00:00.000Z",
    },
  );

  assert.equal(
    result.proposals.length > 0,
    true,
  );

  const proposal =
    result.proposals[0];

  assert.ok(proposal);
  assert.equal(
    proposal.withinBudget,
    true,
  );
  assert.equal(
    proposal.items.length >= 2,
    true,
  );
  assert.equal(
    proposal.title,
    "Recetas que unen",
  );
  assert.equal(
    proposal.marginAmount !==
      undefined,
    true,
  );
});

test("excluye productos rechazados", () => {
  const result = service.compose(
    candidates,
    {
      journeyId: "journey-2",
      ownerId: "owner-1",
      rejectedProductIds: [
        "apron",
      ],
      budget: 60,
    },
  );

  assert.equal(
    result.proposals.some(
      (proposal) =>
        proposal.items.some(
          (item) =>
            item.productId ===
            "apron",
        ),
    ),
    false,
  );
});

test("genera identificadores idempotentes", () => {
  const context = {
    journeyId: "journey-3",
    ownerId: "owner-1",
    budget: 60,
  } as const;

  const first =
    service.compose(
      candidates,
      context,
      {
        now:
          "2026-08-05T20:00:00.000Z",
      },
    );

  const second =
    service.compose(
      candidates,
      context,
      {
        now:
          "2026-08-05T20:05:00.000Z",
      },
    );

  assert.equal(
    first.proposals[0]?.id,
    second.proposals[0]?.id,
  );
});

test("calcula diagnóstico de composición", () => {
  const result =
    service.compose(
      candidates,
      {
        journeyId:
          "journey-4",
        ownerId: "owner-1",
        budget: 30,
      },
    );

  assert.equal(
    result.diagnostics
      .candidateCount,
    4,
  );
  assert.equal(
    result.diagnostics
      .eligibleCount,
    4,
  );
  assert.equal(
    result.diagnostics
      .bundleCount >= 0,
    true,
  );
});
