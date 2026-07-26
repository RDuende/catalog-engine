import { IntentEngine, type IntentAnalysis } from "../../core/intent/index.js";
import { RecommendationService } from "../recommendation-engine/recommendation.service.js";
import type { RecommendationRequest, RecommendationResponse } from "../recommendation-engine/recommendation.types.js";
import type { IntentAnalyzeBody, IntentRecommendBody } from "./intent.schemas.js";

export interface IntentRecommendationResult {
  readonly analysis: IntentAnalysis;
  readonly recommendationRequest: RecommendationRequest;
  readonly recommendations: RecommendationResponse;
}

export class IntentApiService {
  constructor(
    private readonly intentEngine = new IntentEngine(),
    private readonly recommendationService = new RecommendationService(),
  ) {}

  analyze(input: IntentAnalyzeBody): IntentAnalysis {
    return this.intentEngine.analyze(input.query, {
      defaultLimit: input.limit,
      validOnly: input.validOnly,
      minimumScore: input.minimumScore,
    });
  }

  async recommend(input: IntentRecommendBody): Promise<IntentRecommendationResult> {
    const analysis = this.analyze(input);
    const recommendationRequest = mapAnalysisToRecommendationRequest(analysis, input);
    const recommendations = await this.recommendationService.recommend(recommendationRequest);

    return { analysis, recommendationRequest, recommendations };
  }
}

export function mapAnalysisToRecommendationRequest(
  analysis: IntentAnalysis,
  input: Pick<IntentRecommendBody, "query" | "limit" | "currency" | "debug">,
): RecommendationRequest {
  const attributeValues = Object.values(analysis.intent.attributes)
    .flatMap((values) => values ?? [])
    .map(slugify)
    .filter(Boolean);

  return {
    query: analysis.criteria.query ?? input.query,
    limit: input.limit ?? analysis.criteria.limit,
    budget: analysis.intent.maxPriceMinor === undefined
      ? undefined
      : analysis.intent.maxPriceMinor / 100,
    quantity: analysis.intent.quantity,
    currency: input.currency ?? "EUR",
    knowledgeSlugs: attributeValues.length ? [...new Set(attributeValues)] : undefined,
    customizable: analysis.intent.personalization,
    debug: input.debug,
  };
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
