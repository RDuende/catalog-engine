import { MvpOrchestrator } from "../modules/mvp-orchestrator/index.js";

const result = await new MvpOrchestrator().run({
  journeyId: "demo-mvp-gemelas",
  message: "Quiero un regalo de cumpleaños para mis gemelas de 7 años. Mi presupuesto es de 60 euros y les encantan las superheroínas.",
});

console.log(JSON.stringify({
  status: result.status,
  journey: { id: result.journey.id, status: result.journey.status, version: result.journey.version },
  creativeBrief: result.creativeBrief,
  stories: result.storySet?.concepts.map(({ id, title, logline }) => ({ id, title, logline })),
  imageBriefs: result.imageBriefSet?.briefs.map(({ id, title, promptSeed }) => ({ id, title, promptSeed })),
  solutions: result.solutionSet?.solutions.map(({ id, title, total, currency, products, score }) => ({
    id, title, total, currency, score, products: products.map(({ name, quantity }) => ({ name, quantity })),
  })),
  timing: result.timing,
}, null, 2));
