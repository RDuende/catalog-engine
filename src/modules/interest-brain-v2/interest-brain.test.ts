import assert from "node:assert/strict";
import test from "node:test";

import {
  InterestBrainV2Service,
} from "./interest-brain.service.js";
import {
  interestContextForGiftBrain,
  interestContextForProductBrain,
  interestContextForProposalBrain,
} from "./interest-brain.adapters.js";

test("canoniza fútbol y lo prioriza", () => {
  const result =
    new InterestBrainV2Service()
      .analyze({
        message:
          "Le encanta el fútbol.",
      });

  assert.equal(
    result.primaryInterest,
    "football",
  );

  assert.equal(
    result.canonicalInterests.includes(
      "football",
    ),
    true,
  );
});

test("monte expande afinidades implícitas", () => {
  const result =
    new InterestBrainV2Service()
      .analyze({
        message:
          "Le encanta el monte y hacer rutas.",
      });

  assert.equal(
    result.canonicalInterests.includes(
      "hiking",
    ),
    true,
  );

  assert.equal(
    result.canonicalInterests.includes(
      "nature",
    ),
    true,
  );

  assert.equal(
    result.canonicalInterests.includes(
      "adventure",
    ),
    true,
  );
});

test("madera conserva afinidad directa por encima de inferencias", () => {
  const result =
    new InterestBrainV2Service()
      .analyze({
        interests: [
          "madera",
        ],
      });

  assert.equal(
    result.primaryInterest,
    "wood",
  );

  assert.equal(
    result.signals[0]
      ?.source,
    "EXPLICIT",
  );
});

test("barcos genera navegación y mar como afinidades secundarias", () => {
  const result =
    new InterestBrainV2Service()
      .analyze({
        message:
          "Le gustan mucho los barcos.",
      });

  assert.equal(
    result.canonicalInterests.includes(
      "boats",
    ),
    true,
  );

  assert.equal(
    result.canonicalInterests.includes(
      "sea",
    ),
    true,
  );
});

test("expone adaptadores para Gift, Product y Proposal Brain", () => {
  const result =
    new InterestBrainV2Service()
      .analyze({
        message:
          "Fútbol y motos",
      });

  const gift =
    interestContextForGiftBrain(
      result,
    );

  const product =
    interestContextForProductBrain(
      result,
    );

  const proposal =
    interestContextForProposalBrain(
      result,
    );

  assert.equal(
    gift.canonicalInterests.length >
      0,
    true,
  );

  assert.equal(
    product.interests.length >
      0,
    true,
  );

  assert.equal(
    Object.keys(
      proposal.interestWeights,
    ).length >
      0,
    true,
  );
});
