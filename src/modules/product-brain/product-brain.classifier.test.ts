import assert from "node:assert/strict";
import test from "node:test";
import { classifyProductBrain } from "./product-brain.classifier.js";

test("clasifica un llavero de balón como complemento futbolístico", () => {
  const brain = classifyProductBrain({
    id: "p1", providerKey: "makito", name: "Concord",
    description: "Llavero con diseño de clásico balón de fútbol en relieve.",
    categories: ["Llaveros"], tags: ["deporte"], customizable: true,
    attributes: { personalizationMethods: ["laser"] }, metadata: {},
  }, "2026-08-02T00:00:00.000Z");
  assert.equal(brain.objectType, "keyring");
  assert.equal(brain.interests.some((item) => item.id === "football"), true);
  assert.equal(brain.giftRoles.includes("COMPLEMENT"), true);
  assert.equal(brain.giftRoles.includes("PRIMARY"), false);
  assert.equal(brain.personalizationScore > 0.6, true);
});

test("clasifica un balón como regalo principal", () => {
  const brain = classifyProductBrain({
    id: "p2", providerKey: "makito", name: "Balón de fútbol",
    description: "Balón de fútbol tamaño 5 para entrenamiento.", categories: ["Deporte"],
    tags: [], customizable: true, attributes: {}, metadata: {},
  });
  assert.equal(brain.objectType, "football_ball");
  assert.equal(brain.giftRoles.includes("PRIMARY"), true);
  assert.equal(brain.giftSuitabilityScore > 0.8, true);
});


test("clasifica una taza personalizable como soporte genérico principal", () => {
  const brain = classifyProductBrain({
    id: "p3", providerKey: "makito", name: "Taza cerámica",
    description: "Taza blanca apta para sublimación.", categories: ["Tazas"],
    tags: [], customizable: true, attributes: { personalizationMethods: ["sublimacion"] }, metadata: {},
  });
  assert.equal(brain.objectType, "mug");
  assert.equal(brain.giftRoles.includes("PRIMARY"), true);
  assert.equal(brain.personalizationScore >= 0.7, true);
});

test("separa un aplaudidor con diseño de balón del balón real", () => {
  const brain = classifyProductBrain({
    id: "p4", providerKey: "makito", name: "Bekor",
    description: "Aplaudidor fabricado en resistente PP, con diseño de balón de fútbol.",
    categories: ["Regalos promocionales"], tags: ["deporte"], customizable: true,
    attributes: { personalizationMethods: ["serigrafia"] }, metadata: {},
  });
  assert.equal(brain.objectType, "clapper");
  assert.equal(brain.shapes.some((item) => item.id === "football_ball"), true);
  assert.equal(brain.interests.some((item) => item.id === "football"), true);
  assert.equal(brain.giftRoles.includes("PROMOTIONAL"), true);
  assert.equal(brain.giftRoles.includes("PRIMARY"), false);
});

test("un antiestrés con forma de balón conserva su objeto físico", () => {
  const brain = classifyProductBrain({
    id: "p5", providerKey: "makito", name: "Chaiss",
    description: "Antiestrés con forma de balón de fútbol.", categories: ["Antiestrés"],
    tags: ["deporte"], customizable: true, attributes: {}, metadata: {},
  });
  assert.equal(brain.objectType, "anti_stress");
  assert.equal(brain.shapes.some((item) => item.id === "football_ball"), true);
  assert.equal(brain.giftRoles.includes("PROMOTIONAL"), true);
});

test("solo clasifica como football_ball un balón real", () => {
  const brain = classifyProductBrain({
    id: "p6", providerKey: "makito", name: "Horisun",
    description: "Balón de fútbol tamaño 5 fabricado en PVC para entrenamiento.",
    categories: ["Deporte > Balones"], tags: [], customizable: true,
    attributes: {}, metadata: {},
  });
  assert.equal(brain.objectType, "football_ball");
  assert.equal(brain.shapes.some((item) => item.id === "football_ball"), true);
  assert.equal(brain.giftRoles.includes("PRIMARY"), true);
});

test("prioriza el bloc de notas sobre el bolígrafo incluido", () => {
  const brain = classifyProductBrain({
    id: "glaze",
    providerKey: "makito",
    name: "Glaze",
    description: "Bloc de notas con tapas rígidas en PU. Incluye 80 hojas, marcapáginas de tela y bolígrafo a juego.",
    categories: ["Produccion > PRODUCTOS > Blocs, libretas y notas adhesivas > Blocs de notas"],
    tags: [],
    material: "PU",
    customizable: true,
    attributes: {},
    metadata: {},
  });

  assert.equal(brain.objectType, "notebook");
});

test("no interpreta marcapáginas como interés náutico", () => {
  const brain = classifyProductBrain({
    id: "bookmark-boundary",
    providerKey: "makito",
    name: "Bloc de notas",
    description: "Incluye elástico de sujeción y marcapáginas de tela.",
    categories: ["Blocs de notas"],
    tags: [],
    customizable: true,
    attributes: {},
    metadata: {},
  });

  assert.equal(brain.interests.some((interest) => interest.id === "nautical"), false);
});
