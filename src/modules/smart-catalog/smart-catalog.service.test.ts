import assert from "node:assert/strict";
import test from "node:test";
import { InMemorySmartCatalogRepository } from "./in-memory-smart-catalog.repository.js";
import { SmartCatalogService } from "./smart-catalog.service.js";

const service = new SmartCatalogService(new InMemorySmartCatalogRepository());

test("prioriza productos compatibles con presupuesto, edad e intereses", async () => {
  const recommendations = await service.recommend({ budget: 60, recipientAge: 7, interests: ["superheroínas", "gemelas"], emotionalGoals: ["FUN", "CONNECTION"], visualStyle: "COMIC", requiredQuantity: 2 }, 3);
  assert.equal(recommendations.length, 3);
  assert.equal(recommendations[0]?.product.id, "tshirt-kids");
  assert.equal(recommendations.every((item) => item.available), true);
  assert.equal(recommendations.every((item) => item.breakdown.age === 1), true);
});

test("penaliza lo que supera presupuesto sin perder explicación", async () => {
  const recommendations = await service.recommend({ budget: 20, recipientAge: 7, interests: ["historia"], visualStyle: "COMIC" }, 5);
  const story = recommendations.find((item) => item.product.id === "story-book");
  assert.equal(story?.withinBudget, false);
  assert.equal((story?.warnings.length ?? 0) > 0, true);
});

test("expone margen y plantillas de presentación", async () => {
  const first = (await service.recommend({ budget: 100, recipientAge: 7 }, 1))[0];
  assert.ok(first);
  assert.equal(first.marginAmount > 0, true);
  assert.equal(Array.isArray(first.product.presentationTemplateIds), true);
});

test("descarta productos sin relación real cuando se indica un interés", async () => {
  const repository = {
    async list() {
      return [
        { id: "urban-backpack", sku: "1843", name: "Zakian", description: "Mochila urbana con asa de transporte", providerKey: "makito", category: "Mochilas", price: 0, priceKnown: false, cost: 0, currency: "EUR", stock: 999, productionDays: 5, tags: ["fieltro rpet", "serigrafia"], emotionalGoals: [], visualStyles: [], presentationTemplateIds: [], active: true },
        { id: "football-bottle", sku: "FUT-1", name: "Botella deportiva", description: "Botella para entrenamientos y equipos de fútbol", providerKey: "makito", category: "Deporte", price: 12, priceKnown: true, cost: 5, currency: "EUR", stock: 20, productionDays: 3, tags: ["futbol", "entrenador", "equipo"], emotionalGoals: [], visualStyles: [], presentationTemplateIds: [], active: true },
      ];
    },
    getById() { return undefined; },
  };
  const recommendations = await new SmartCatalogService(repository).recommend({ interests: ["fútbol"] }, 10);
  assert.deepEqual(recommendations.map((item) => item.product.id), ["football-bottle"]);
  assert.match(recommendations[0]?.reasons.join(" ") ?? "", /fútbol/i);
});

test("trata el precio cero importado como desconocido y no como producto gratuito", async () => {
  const repository = {
    async list() {
      return [{ id: "ball", sku: "BALL", name: "Balón de fútbol", category: "Deporte", price: 0, priceKnown: false, cost: 0, currency: "EUR", stock: 10, productionDays: 2, tags: ["futbol", "balon"], emotionalGoals: [], visualStyles: [], presentationTemplateIds: [], active: true }];
    },
    getById() { return undefined; },
  };
  const [recommendation] = await new SmartCatalogService(repository).recommend({ interests: ["fútbol"], budget: 30 }, 1);
  assert.ok(recommendation);
  assert.equal(recommendation.breakdown.budget, 0);
  assert.equal(recommendation.reasons.some((reason) => reason.includes("0.00")), false);
  assert.equal(recommendation.warnings.some((warning) => /Precio no disponible/i.test(warning)), true);
});

test("ordena una coincidencia directa de fútbol por encima de una relación genérica con deporte", async () => {
  const repository = {
    async list() {
      return [
        { id: "generic-sport", sku: "SP-1", name: "Mochila urbana", description: "Complemento deportivo de uso general", category: "Deporte", price: 15, priceKnown: true, cost: 6, currency: "EUR", stock: 20, productionDays: 3, tags: ["deporte"], emotionalGoals: [], visualStyles: [], presentationTemplateIds: [], active: true },
        { id: "football-ball", sku: "FT-1", name: "Balón de fútbol", description: "Balón para entrenamientos y partidos", category: "Fútbol", price: 15, priceKnown: true, cost: 6, currency: "EUR", stock: 20, productionDays: 3, tags: ["futbol", "balon"], emotionalGoals: [], visualStyles: [], presentationTemplateIds: [], active: true },
      ];
    },
    getById() { return undefined; },
  };
  const recommendations = await new SmartCatalogService(repository).recommend({ interests: ["fútbol"] }, 10);
  assert.equal(recommendations[0]?.product.id, "football-ball");
  assert.equal(recommendations.some((item) => item.product.id === "generic-sport"), false);
  assert.match(recommendations[0]?.reasons.join(" ") ?? "", /futbol en (name|category|tags)/i);
});

test("productos distintos no reciben una afinidad idéntica solo por compartir términos genéricos", async () => {
  const repository = {
    async list() {
      return [
        { id: "direct", sku: "D", name: "Set de fútbol", description: "Balón y accesorios", category: "Fútbol", price: 20, priceKnown: true, cost: 8, currency: "EUR", stock: 10, productionDays: 2, tags: ["futbol", "balon", "deporte"], emotionalGoals: [], visualStyles: [], presentationTemplateIds: [], active: true },
        { id: "core", sku: "C", name: "Pelota antiestrés", description: "Pelota con forma deportiva", category: "Antiestrés", price: 4, priceKnown: true, cost: 1, currency: "EUR", stock: 10, productionDays: 2, tags: ["pelota", "deporte"], emotionalGoals: [], visualStyles: [], presentationTemplateIds: [], active: true },
      ];
    },
    getById() { return undefined; },
  };
  const recommendations = await new SmartCatalogService(repository).recommend({ interests: ["fútbol"] }, 10);
  assert.equal(recommendations.length, 2);
  assert.equal(recommendations[0]?.product.id, "direct");
  assert.notEqual(recommendations[0]?.score, recommendations[1]?.score);
});
