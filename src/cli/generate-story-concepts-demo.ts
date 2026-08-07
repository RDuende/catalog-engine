import { JourneyProject } from "../modules/journey-domain/index.js";
import { DiscoveryExtractor, applyDiscovery } from "../modules/journey-discovery/index.js";
import { applyCompleteness } from "../modules/journey-completeness/index.js";
import { applyCreativeBrief } from "../modules/creative-brief/index.js";
import { applyStoryConcepts } from "../modules/story-engine/index.js";

const discovery = new DiscoveryExtractor().extract({
  message: "Quiero un regalo de cumpleaños para mis gemelas de 7 años. Mi presupuesto es de 60 euros y les encantan las superheroínas.",
});

let journey = applyDiscovery(JourneyProject.create({ type: "GIFT", id: "demo-gemelas" }), discovery);
journey = journey.setFact({
  key: "recipient.interests",
  value: ["superheroínas"],
  source: "CONVERSATION",
  confidence: 1,
});
journey = applyCompleteness(journey).journey;
const briefResult = applyCreativeBrief(journey);
const result = await applyStoryConcepts(briefResult.journey, briefResult.brief);

console.log(JSON.stringify({
  journeyId: result.storySet.journeyId,
  brief: {
    objective: briefResult.brief.objective,
    themes: briefResult.brief.themes,
  },
  concepts: result.storySet.concepts.map((concept) => ({
    title: concept.title,
    logline: concept.logline,
    emotionalPromise: concept.emotionalPromise,
    visualHooks: concept.visualHooks,
  })),
}, null, 2));
