import type { ParsedIntent } from "../intent/model.js";
import type { RecommendationCriteria } from "../recommendation/model.js";
import type { ResolvedSolution, SolutionDefinition } from "./model.js";

export class SolutionEngine {
  constructor(private readonly definitions: SolutionDefinition[]) {}

  resolve(intent: ParsedIntent, limit = 5): ResolvedSolution[] {
    return this.definitions
      .map((definition) => scoreDefinition(definition, intent))
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score || (b.definition.priority ?? 0) - (a.definition.priority ?? 0))
      .slice(0, Math.max(1, limit));
  }
}

function scoreDefinition(definition: SolutionDefinition, intent: ParsedIntent): ResolvedSolution {
  let score = 0;
  const reasons: string[] = [];
  if (intent.recipient && includes(definition.recipients, intent.recipient)) { score += 40; reasons.push(`Adecuada para ${intent.recipient}`); }
  if (intent.occasion && includes(definition.occasions, intent.occasion)) { score += 35; reasons.push(`Adecuada para ${intent.occasion}`); }
  const emotions = intent.attributes.emotion ?? [];
  const matchedEmotions = emotions.filter((emotion) => includes(definition.emotions, emotion));
  if (matchedEmotions.length) { score += Math.min(20, matchedEmotions.length * 10); reasons.push(`Transmite ${matchedEmotions.join(", ")}`); }
  score += Math.max(0, Math.min(5, definition.priority ?? 0));

  const criteria: RecommendationCriteria = {
    query: [intent.recipient, intent.occasion, ...intent.terms].filter(Boolean).join(" "),
    attributes: intent.attributes,
    maxPriceMinor: intent.maxPriceMinor,
    personalization: intent.personalization,
  } as RecommendationCriteria;

  return { definition, score, reasons, criteria, intent };
}

function includes(values: string[] | undefined, candidate: string): boolean {
  const normalized = normalize(candidate);
  return (values ?? []).some((value) => normalize(value) === normalized);
}
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
