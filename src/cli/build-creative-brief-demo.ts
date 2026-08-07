import { JourneyProject } from "../modules/journey-domain/index.js";
import { DiscoveryExtractor, applyDiscovery } from "../modules/journey-discovery/index.js";
import { applyCompleteness } from "../modules/journey-completeness/index.js";
import { applyCreativeBrief } from "../modules/creative-brief/index.js";

const message = "Quiero un regalo de cumpleaños para mis gemelas de 7 años. Mi presupuesto es 60 euros y les encantan las superheroínas.";
const extractor = new DiscoveryExtractor();
let journey = JourneyProject.create({ type: "GIFT", title: "Supergemelas" });
journey = applyDiscovery(journey, extractor.extract({ message }));
journey = journey.setFact({
  key: "recipient.interests",
  value: ["superheroínas"],
  source: "CONVERSATION",
  confidence: 1,
  evidence: "les encantan las superheroínas",
});
journey = applyCompleteness(journey).journey;

const result = applyCreativeBrief(journey);
console.log(JSON.stringify(result.brief, null, 2));
