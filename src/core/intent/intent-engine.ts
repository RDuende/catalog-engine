import { intentToRecommendationCriteria } from "./adapter.js";
import { parseConstraints } from "./constraint-parser.js";
import { EntityResolver } from "./entity-resolver.js";
import type { IntentAnalysis, IntentParseOptions, ParsedIntent } from "./model.js";
import { normalizeIntentText, uniqueTerms } from "./text.js";

export class IntentEngine {
  constructor(private readonly resolver = new EntityResolver()) {}

  parse(rawText: string): ParsedIntent {
    const normalizedText = normalizeIntentText(rawText);
    const entities = this.resolver.resolve(rawText);
    const constraints = parseConstraints(rawText);
    const attributes: ParsedIntent["attributes"] = {};

    for (const entity of entities) {
      const values = attributes[entity.type] ?? [];
      values.push(entity.canonical);
      attributes[entity.type] = uniqueTerms(values);
    }

    const recipient = attributes.audience?.[0];
    const occasion = attributes.occasion?.[0];
    const recognized = entities.map((entity) => entity.matched);
    const terms = extractResidualTerms(normalizedText, recognized);
    const signals = entities.length + countConstraints(constraints);
    const confidence = Math.min(1, Number((0.25 + signals * 0.11).toFixed(2)));

    return {
      rawText,
      normalizedText,
      recipient,
      occasion,
      minPriceMinor: constraints.minPriceMinor,
      maxPriceMinor: constraints.maxPriceMinor,
      quantity: constraints.quantity,
      personalization: constraints.personalization,
      priority: constraints.priority,
      attributes,
      terms,
      confidence,
      warnings: constraints.warnings,
    };
  }

  analyze(rawText: string, options: IntentParseOptions = {}): IntentAnalysis {
    const intent = this.parse(rawText);
    return { intent, criteria: intentToRecommendationCriteria(intent, options) };
  }
}

function countConstraints(value: ReturnType<typeof parseConstraints>): number {
  return [value.minPriceMinor, value.maxPriceMinor, value.quantity, value.personalization, value.priority === "high" ? true : undefined]
    .filter((item) => item !== undefined).length;
}

function extractResidualTerms(text: string, recognized: string[]): string[] {
  let residual = ` ${text} `;
  for (const phrase of recognized.sort((a, b) => b.length - a.length)) residual = residual.replace(` ${phrase} `, " ");
  const stop = new Set(["quiero", "busco", "necesito", "regalo", "producto", "para", "por", "de", "un", "una", "unos", "unas", "que", "sea", "con", "sin", "menos", "mas", "hasta", "euros", "euro", "y", "o", "mi"]);
  return uniqueTerms(residual.split(" ").filter((term) => term.length > 2 && !stop.has(term) && !/^\d+$/.test(term)));
}
