import assert from "node:assert/strict";
import test from "node:test";

import {
  ProposalBrainV2Service,
} from "./proposal-brain-v2.service.js";

test("ranking v2 devuelve propuestas explicables", () => {
  const result =
    new ProposalBrainV2Service()
      .analyze({
        budget: 70,
        occasion: "cumpleaños",
        interests: [
          "motocross",
          "madera",
        ],
        strategy:
          "HERO_PLUS_COMPLEMENTS",
        targetItemCount: 3,
        confidence: 0.84,
        candidates: [
          {
            id: "a",
            name:
              "Termo motocross",
            category:
              "botellas",
            price: 25,
            stock: 10,
            score: 0.92,
            canonicalInterests:
              ["motocross"],
            personalizationAvailable:
              true,
            marginPercent: 55,
            bundleRoles:
              ["HERO"],
            imageUrl:
              "/img/a.jpg",
          },
          {
            id: "b",
            name:
              "Llavero madera",
            category:
              "llaveros",
            price: 9,
            stock: 20,
            score: 0.8,
            canonicalInterests:
              ["madera"],
            personalizationAvailable:
              true,
            marginPercent: 60,
            bundleRoles:
              ["COMPLEMENT"],
            imageUrl:
              "/img/b.jpg",
          },
          {
            id: "c",
            name:
              "Caja madera",
            category:
              "packaging",
            price: 14,
            stock: 8,
            score: 0.72,
            materials:
              ["madera"],
            personalizationAvailable:
              true,
            marginPercent: 45,
            bundleRoles:
              ["PACKAGING"],
            imageUrl:
              "/img/c.jpg",
          },
        ],
      });

  assert.equal(
    result.proposals.length > 0,
    true,
  );

  const proposal =
    result.proposals[0];

  assert.ok(proposal);

  assert.equal(
    typeof proposal.confidence,
    "number",
  );

  assert.equal(
    proposal.explanation
      .detailed.length > 20,
    true,
  );

  assert.equal(
    proposal.confidenceBreakdown
      .factors.length > 0,
    true,
  );
});

test("bundle optimizer mantiene presupuesto", () => {
  const result =
    new ProposalBrainV2Service()
      .analyze({
        budget: 50,
        interests: ["cooking"],
        targetItemCount: 2,
        candidates: [
          {
            id: "a",
            name: "Delantal",
            category: "textil",
            price: 18,
            score: 0.9,
            stock: 5,
            canonicalInterests:
              ["cooking"],
            personalizationAvailable:
              true,
          },
          {
            id: "b",
            name: "Tabla",
            category: "madera",
            price: 22,
            score: 0.86,
            stock: 5,
            canonicalInterests:
              ["cooking"],
            personalizationAvailable:
              true,
          },
        ],
      });

  assert.equal(
    result.proposals[0]
      ?.withinBudget,
    true,
  );
});
