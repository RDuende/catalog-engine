import assert from "node:assert/strict";
import test from "node:test";

import { RceProposalComposer } from "./proposal-composer.js";

const solutions = [
  {
    id: "solution-1",
    title: "El gol que nunca se olvida",
    subtitle: "Balón personalizado · emotional",
    description: "Una historia de fútbol y recuerdos compartidos.",
    emotionalStory: "Una historia de fútbol y recuerdos compartidos.",
    totalPrice: 20,
    withinBudget: true,
    score: 94,
    reasons: [
      "Afinidad directa con fútbol",
      "Encaja en el presupuesto disponible.",
    ],
    components: {
      productId: "ball",
      storySeedId: "story-1",
      imageVariantId: "image-1",
    },
    breakdown: {
      product: 95,
      story: 90,
      image: 94,
      budget: 100,
      coherence: 93,
    },
    product: {
      id: "ball",
      title: "Balón personalizado",
      price: 20,
      available: true,
      rank: 1,
      score: 95,
      reasons: ["Afinidad directa"],
      metadata: {
        image: "/media/ball.jpg",
        productionDays: 3,
        technique: "Sublimación",
      },
    },
    story: {
      id: "story-1",
      title: "El gol que nunca se olvida",
      premise: "Una historia de fútbol y recuerdos compartidos.",
      tone: "emotional",
      emotionalGoal: "connection",
      personalizationIdeas: ["Nombre"],
      score: 90,
      reasons: ["Relacionado con fútbol"],
    },
    image: {
      id: "image-1",
      title: "Balón protagonista",
      prompt: "Balón personalizado en una escena emotiva",
      aspectRatio: "1:1",
      productId: "ball",
      storySeedId: "story-1",
      score: 94,
      reasons: ["Visual coherente"],
    },
  },
] as const;

test("convierte soluciones en propuestas listas para frontend", () => {
  const composer = new RceProposalComposer();

  const result = composer.compose({
    conversationId: "c1",
    solutions,
  });

  assert.equal(result.proposals.length, 1);
  assert.equal(result.proposals[0]?.title, "El gol que nunca se olvida");
  assert.equal(result.proposals[0]?.media.imageUrl, "/media/ball.jpg");
  assert.equal(result.proposals[0]?.production.estimatedDays, 3);
  assert.equal(result.proposals[0]?.production.technique, "Sublimación");
});

test("incluye acciones de selección, favoritos y personalización", () => {
  const composer = new RceProposalComposer();

  const result = composer.compose({
    conversationId: "c1",
    solutions,
  });

  const actionTypes = result.proposals[0]?.actions.map(
    (action) => action.type,
  );

  assert.deepEqual(actionTypes, [
    "SELECT",
    "SAVE_FAVORITE",
    "CUSTOMIZE",
    "COMPARE",
    "SHOW_DETAILS",
  ]);
});

test("marca una propuesta seleccionada", () => {
  const composer = new RceProposalComposer();

  const result = composer.compose({
    conversationId: "c1",
    solutions,
    selectedProposalId: "solution-1",
  });

  const select = result.proposals[0]?.actions.find(
    (action) => action.type === "SELECT",
  );

  assert.equal(select?.enabled, false);
  assert.equal(select?.label, "Seleccionada");
});

test("genera datos de comparación", () => {
  const composer = new RceProposalComposer();

  const result = composer.compose({
    conversationId: "c1",
    solutions,
  });

  assert.equal(result.comparison.length >= 5, true);
  assert.equal(result.comparison[0]?.key, "price");
  assert.equal(
    result.comparison[0]?.values["proposal-solution-1"],
    20,
  );
});

test("tolera una lista vacía", () => {
  const composer = new RceProposalComposer();

  const result = composer.compose({
    conversationId: "c1",
    solutions: [],
  });

  assert.deepEqual(result.proposals, []);
  assert.equal(composer.metrics().emptyInputs, 1);
});
