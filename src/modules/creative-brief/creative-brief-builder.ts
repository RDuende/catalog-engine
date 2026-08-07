import { createHash, randomUUID } from "node:crypto";
import type { JourneyFact, JourneyParticipant, JourneyProjectSnapshot } from "../journey-domain/index.js";
import { buildGiftModel } from "../journey-model/index.js";
import { CreativeBriefValidator } from "./creative-brief-validator.js";
import type {
  BuildCreativeBriefInput, CreativeAudienceProfile, CreativeBrief, CreativeBriefQualityGate,
  CreativeBriefSource, CreativeConstraint, EmotionalGoal, NarrativeStyle, VisualStyle,
} from "./creative-brief.types.js";

function latestFact(facts: readonly JourneyFact[], key: string): JourneyFact | undefined {
  return [...facts].filter((fact) => fact.key === key).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
}
function factValue<T>(facts: readonly JourneyFact[], key: string): T | undefined { return latestFact(facts, key)?.value as T | undefined; }
function stringList(value: unknown): readonly string[] {
  if (Array.isArray(value)) return Object.freeze(value.filter((v): v is string => typeof v === "string").map((v) => v.trim()).filter(Boolean));
  if (typeof value === "string") return Object.freeze(value.split(/[,;]|\by\b/i).map((v) => v.trim()).filter(Boolean));
  return Object.freeze([]);
}
function interestsFor(participant: JourneyParticipant, facts: readonly JourneyFact[]): readonly string[] {
  const own = stringList(participant.preferences.interests ?? participant.facts.interests);
  const linked = facts.find((fact) => fact.key === "recipient.interests" && fact.participantId === participant.id);
  const global = latestFact(facts.filter((fact) => !fact.participantId), "recipient.interests");
  return Object.freeze([...new Set([...own, ...stringList(linked?.value), ...stringList(global?.value)])]);
}
function syntheticAudience(snapshot: JourneyProjectSnapshot): readonly CreativeAudienceProfile[] {
  const model = buildGiftModel(snapshot);
  if ((model.recipient.count ?? 0) < 1 && !model.recipient.relationship && !model.recipient.name && model.recipient.age === undefined) return Object.freeze([]);
  const count = Math.max(1, model.recipient.count ?? 1);
  return Object.freeze(Array.from({ length: count }, (_, index) => Object.freeze({
    participantId: `derived-recipient-${index + 1}`, role: "RECIPIENT",
    ...(index === 0 && model.recipient.name ? { name: model.recipient.name } : {}),
    ...(model.recipient.age !== undefined ? { age: model.recipient.age } : {}),
    ...(model.recipient.relationship ? { relationship: model.recipient.relationship } : {}),
    interests: model.recipient.interests,
  })));
}
function audienceFor(snapshot: JourneyProjectSnapshot): readonly CreativeAudienceProfile[] {
  const recipients = snapshot.participants.filter((p) => p.role === "RECIPIENT");
  if (recipients.length === 0) return syntheticAudience(snapshot);
  return Object.freeze(recipients.map((p) => Object.freeze({
    participantId: p.id, role: p.role, ...(p.name ? { name: p.name } : {}), ...(p.age !== undefined ? { age: p.age } : {}),
    ...(p.relationship ? { relationship: p.relationship } : {}), interests: interestsFor(p, snapshot.facts),
  })));
}
function inferGoals(occasion: string | undefined, audience: readonly CreativeAudienceProfile[], tones: readonly string[]): readonly EmotionalGoal[] {
  const goals = new Set<EmotionalGoal>(["SURPRISE"]);
  if (["birthday", "anniversary", "communion", "wedding"].includes(occasion ?? "")) goals.add("CELEBRATION");
  if (occasion === "retirement") goals.add("GRATITUDE");
  if (occasion === "wedding") goals.add("REMEMBRANCE");
  if (audience.length > 1) goals.add("CONNECTION");
  if (tones.some((tone) => /divertid|humor|fun/i.test(tone)) || audience.some((r) => (r.age ?? 99) <= 12)) goals.add("FUN");
  return Object.freeze([...goals]);
}
function inferNarrative(themes: readonly string[], tones: readonly string[], audience: readonly CreativeAudienceProfile[]): NarrativeStyle {
  const normalized = [...themes, ...tones].join(" ").toLowerCase();
  if (/divertid|broma|humor|rap|graffiti/.test(normalized)) return "HUMOROUS";
  if (/superher|aventur|explor/.test(normalized)) return "ADVENTURE";
  if (/magia|unicorn|hada|fantas/.test(normalized)) return "MAGICAL";
  if (/celebr/.test(normalized)) return "CELEBRATORY";
  if (audience.some((item) => (item.age ?? 99) <= 12)) return "ADVENTURE";
  return "EMOTIONAL";
}
function inferVisual(themes: readonly string[], audience: readonly CreativeAudienceProfile[], photoAvailable?: boolean): VisualStyle {
  const normalized = themes.join(" ").toLowerCase();
  if (photoAvailable) return "PHOTOGRAPHIC";
  if (/rap|graffiti|comic|superher/.test(normalized)) return "COMIC";
  if (/acuarela/.test(normalized)) return "WATERCOLOR";
  if (audience.some((item) => (item.age ?? 99) <= 12)) return "COLORFUL_ILLUSTRATION";
  return "UNSPECIFIED";
}
function fingerprint(snapshot: JourneyProjectSnapshot): string {
  const relevant = snapshot.facts.filter((f) => /^(gift\.|recipient\.|occasion\.|budget\.|personalization\.|delivery\.|creative\.)/.test(f.key))
    .map((f) => ({ key: f.key, value: f.value, participantId: f.participantId ?? null })).sort((a, b) => `${a.key}:${a.participantId}`.localeCompare(`${b.key}:${b.participantId}`));
  return createHash("sha256").update(JSON.stringify(relevant)).digest("hex").slice(0, 24);
}
function qualityGate(validationValid: boolean, pendingFacts: readonly string[], themes: readonly string[], budgetKnown: boolean): CreativeBriefQualityGate {
  const blocking = pendingFacts.filter((key) => key === "recipient.count" || key === "occasion.type");
  const warnings = [...(themes.length ? [] : ["Faltan intereses o temas concretos."]), ...(budgetKnown ? [] : ["El presupuesto no está confirmado."])];
  const score = Math.max(0, Math.min(100, 100 - blocking.length * 40 - warnings.length * 10));
  return Object.freeze({ passed: validationValid && blocking.length === 0, score, blockingIssues: Object.freeze(blocking), warnings: Object.freeze(warnings) });
}

export class CreativeBriefBuilder {
  private readonly validator = new CreativeBriefValidator();
  build(input: BuildCreativeBriefInput): CreativeBrief {
    const { journey } = input;
    const model = buildGiftModel(journey, input.now);
    const audience = audienceFor(journey);
    const occasion = model.occasion.type ?? factValue<string>(journey.facts, "occasion.type");
    const occasionDateText = model.occasion.dateText ?? factValue<string>(journey.facts, "delivery.date_text");
    const themes = Object.freeze([...new Set([...model.recipient.interests, ...stringList(factValue(journey.facts, "creative.themes"))])]);
    const tones = Object.freeze([...new Set([...model.style, ...model.recipient.personality])]);
    const emotionalGoals = inferGoals(occasion, audience, tones);
    const objective = `Crear un regalo personalizado y memorable${audience[0]?.name ? ` para ${audience[0].name}` : ""}${occasion ? ` con motivo de ${occasion}` : ""}.`;
    const budgetMax = model.budget.max;
    const currency = model.budget.currency;
    const pendingFacts: string[] = [];
    if (audience.length === 0) pendingFacts.push("recipient.count");
    if (!occasion) pendingFacts.push("occasion.type");
    if (themes.length === 0) pendingFacts.push("recipient.interests");
    const constraints: CreativeConstraint[] = [];
    if (budgetMax !== undefined) constraints.push(Object.freeze({ id: "budget.maximum", kind: "BUDGET", description: `La propuesta completa no debe superar ${budgetMax} ${currency}.`, blocking: true }));
    if (audience.some((item) => (item.age ?? 99) < 14)) constraints.push(Object.freeze({ id: "audience.minors", kind: "AUDIENCE", description: "El contenido y los productos deben ser apropiados para menores.", blocking: true }));
    if (occasionDateText) constraints.push(Object.freeze({ id: "production.deadline", kind: "PRODUCTION", description: `La propuesta debe poder entregarse para ${occasionDateText}.`, blocking: false }));
    for (const key of pendingFacts) constraints.push(Object.freeze({ id: `missing.${key}`, kind: "MISSING_DATA", description: `Falta el dato ${key}.`, blocking: key !== "recipient.interests" }));
    const sources: CreativeBriefSource[] = [
      { field: "audience", source: journey.participants.some((p) => p.role === "RECIPIENT") ? "PARTICIPANT" : "GIFT_MODEL", confidence: audience.length ? 0.98 : 0, reason: "Destinatarios derivados del Journey consolidado." },
      { field: "creativeDirection", source: "GIFT_MODEL", confidence: themes.length || tones.length ? 0.9 : 0.55, reason: "Dirección derivada de intereses, personalidad y estilo." },
      { field: "emotionalGoals", source: "RULE", confidence: 0.82, reason: "Inferidos de ocasión, edad, audiencia y tono." },
    ];
    for (const [field, key] of [["occasion", "occasion.type"], ["budget", "budget.max"], ["themes", "recipient.interests"], ["personalization", "personalization.enabled"]] as const) {
      const fact = latestFact(journey.facts, key); if (fact) sources.push({ field, factKey: key, source: fact.source, confidence: fact.confidence, reason: "Hecho consolidado del Journey." });
    }
    const validation = this.validator.validate({ objective, audience, occasion, emotionalGoals, themes });
    const gate = qualityGate(validation.valid, pendingFacts, themes, budgetMax !== undefined);
    const priorVersions = journey.artifacts.filter((a) => a.type === "CREATIVE_BRIEF");
    const narrativeStyle = inferNarrative(themes, tones, audience);
    const visualStyle = inferVisual(themes, audience, model.personalization.photoAvailable);
    return Object.freeze({
      id: input.id ?? randomUUID(), specificationVersion: "v2", builderVersion: "creative-brief-v2-gift-model",
      journeyId: journey.id, journeyVersion: journey.version, version: priorVersions.reduce((max, a) => Math.max(max, a.version), 0) + 1,
      fingerprint: fingerprint(journey), status: gate.passed ? "READY" : "INVALID", objective, audience,
      ...(occasion ? { occasion } : {}), ...(occasionDateText ? { occasionDateText } : {}), emotionalGoals, themes,
      narrativeStyle, visualStyle,
      creativeDirection: Object.freeze({ tone: tones, themes, emotionalGoal: emotionalGoals.includes("FUN") ? "sorprender y divertir" : "crear una conexión emocional" }),
      personalization: Object.freeze({ ...(model.personalization.enabled !== undefined ? { enabled: model.personalization.enabled } : {}), ...(model.personalization.name ? { name: model.personalization.name } : {}), ...(model.personalization.photoAvailable !== undefined ? { includePhoto: model.personalization.photoAvailable } : {}), ...(model.personalization.phrase ? { phrase: model.personalization.phrase } : {}) }),
      ...(budgetMax !== undefined ? { budget: Object.freeze({ maximum: budgetMax, currency }) } : {}), constraints: Object.freeze(constraints), pendingFacts: Object.freeze(pendingFacts),
      sources: Object.freeze(sources.map((source) => Object.freeze(source))), validation, qualityGate: gate, createdAt: input.now ?? new Date().toISOString(),
    });
  }
}
