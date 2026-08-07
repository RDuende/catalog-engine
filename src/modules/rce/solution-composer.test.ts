import assert from "node:assert/strict";
import test from "node:test";

import { RceSolutionComposer } from "./solution-composer.js";

const products = [
  {
    id: "ball",
    title: "Balón personalizado",
    price: 20,
    available: true,
    rank: 1,
    score: 95,
    reasons: ["Afinidad directa con fútbol"],
  },
  {
    id: "shirt",
    title: "Camiseta personalizada",
    price: 25,
    available: true,
    rank: 2,
    score: 88,
    reasons: ["Producto personalizable"],
  },
];

const stories = [
  {
    id: "story-football",
    title: "El gol que nunca se olvida",
    premise: "Una historia de fútbol y recuerdos compartidos.",
    tone: "emotional",
    emotionalGoal: "connection",
    personalizationIdeas: ["Nombre", "Fecha"],
    score: 92,
    reasons: ["Relacionado con fútbol"],
  },
  {
    id: "story-team",
    title: "Siempre en el mismo equipo",
    premise: "Una historia de apoyo y complicidad.",
    tone: "warm",
    emotionalGoal: "belonging",
    personalizationIdeas: ["Dorsal"],
    score: 86,
    reasons: ["Ideal para una camiseta"],
  },
];

const images = [
  {
    id: "image-ball",
    title: "Balón protagonista",
    prompt: "Balón personalizado en una escena emotiva",
    productId: "ball",
    storySeedId: "story-football",
    score: 94,
    reasons: ["Composición directa"],
  },
  {
    id: "image-shirt",
    title: "Camiseta de equipo",
    prompt: "Camiseta personalizada sobre fondo deportivo",
    productId: "shirt",
    storySeedId: "story-team",
    score: 89,
    reasons: ["Producto y narrativa alineados"],
  },
];

test("combina productos, historias e imágenes", () => {
  const composer = new RceSolutionComposer();

  const result = composer.compose({
    conversationId: "c1",
    products,
    stories,
    images,
    budgetMax: 30,
    maxSolutions: 3,
  });

  assert.equal(result.solutions.length, 2);
  assert.equal(result.solutions[0]?.components.productId, "ball");
  assert.equal(
    result.solutions[0]?.components.storySeedId,
    "story-football",
  );
  assert.equal(
    result.solutions[0]?.components.imageVariantId,
    "image-ball",
  );
});

test("todas las soluciones indican si encajan en presupuesto", () => {
  const composer = new RceSolutionComposer();

  const result = composer.compose({
    conversationId: "c1",
    products,
    stories,
    images,
    budgetMax: 22,
  });

  const ball = result.solutions.find(
    (solution) => solution.product.id === "ball",
  );
  const shirt = result.solutions.find(
    (solution) => solution.product.id === "shirt",
  );

  assert.equal(ball?.withinBudget, true);
  assert.equal(shirt?.withinBudget, false);
});

test("evita repetir historias e imágenes cuando hay alternativas", () => {
  const composer = new RceSolutionComposer();

  const result = composer.compose({
    conversationId: "c1",
    products,
    stories,
    images,
    budgetMax: 30,
  });

  assert.equal(
    new Set(
      result.solutions.map(
        (solution) => solution.components.storySeedId,
      ),
    ).size,
    result.solutions.length,
  );

  assert.equal(
    new Set(
      result.solutions.map(
        (solution) => solution.components.imageVariantId,
      ),
    ).size,
    result.solutions.length,
  );
});

test("produce explicaciones y desglose de score", () => {
  const composer = new RceSolutionComposer();

  const result = composer.compose({
    conversationId: "c1",
    products,
    stories,
    images,
    budgetMax: 30,
  });

  const first = result.solutions[0];

  assert.equal((first?.reasons.length ?? 0) > 0, true);
  assert.equal(typeof first?.score, "number");
  assert.equal(typeof first?.breakdown.coherence, "number");
});

test("tolera entradas sin productos", () => {
  const composer = new RceSolutionComposer();

  const result = composer.compose({
    conversationId: "c1",
    products: [],
    stories,
    images,
  });

  assert.deepEqual(result.solutions, []);
  assert.equal(composer.metrics().emptyInputs, 1);
});
