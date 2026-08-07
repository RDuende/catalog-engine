import { JourneyProject } from "../modules/journey-domain/index.js";
import { DiscoveryExtractor, applyDiscovery } from "../modules/journey-discovery/index.js";
import { applyCompleteness } from "../modules/journey-completeness/index.js";
import { applyCreativeBrief } from "../modules/creative-brief/index.js";
import { applyStoryConcepts } from "../modules/story-engine/index.js";
import { applyImageBriefs } from "../modules/image-brief/index.js";

const initial = JourneyProject.create({ type: "GIFT", id: "demo-gemelas" });
const extraction = new DiscoveryExtractor().extract({
  message: "Quiero un regalo de cumpleaños para mis gemelas de 7 años. Mi presupuesto es 60 euros",
});
const discovered = applyDiscovery(initial, extraction).setFact({
  key: "recipient.interests",
  value: ["superheroínas"],
  source: "CONVERSATION",
  confidence: 1,
});
const complete = applyCompleteness(discovered).journey;
const creative = applyCreativeBrief(complete);
const stories = await applyStoryConcepts(creative.journey, creative.brief);
const images = applyImageBriefs(stories.journey, creative.brief, stories.storySet);
console.log(JSON.stringify(images.imageBriefSet, null, 2));
