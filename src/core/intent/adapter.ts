import type { RecommendationCriteria } from "../recommendation/model.js";
import type { IntentParseOptions, ParsedIntent } from "./model.js";

export function intentToRecommendationCriteria(intent: ParsedIntent, options: IntentParseOptions = {}): RecommendationCriteria {
  const queryParts = [intent.recipient, intent.occasion, ...intent.terms].filter((value): value is string => Boolean(value));
  return {
    query: queryParts.length ? queryParts.join(" ") : undefined,
    attributes: Object.keys(intent.attributes).length ? intent.attributes : undefined,
    maxPriceMinor: intent.maxPriceMinor,
    validOnly: options.validOnly ?? true,
    personalization: intent.personalization,
    limit: options.defaultLimit ?? 10,
    minimumScore: options.minimumScore,
  };
}
