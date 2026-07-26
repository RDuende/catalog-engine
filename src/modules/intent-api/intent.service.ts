import { IntentEngine, type IntentAnalysis } from "../../core/intent/index.js";
import {
  DEFAULT_SOLUTION_DEFINITIONS,
  SolutionRecommendationOrchestrator,
  type ResolvedSolution,
  type SolutionRecommendationPlan,
} from "../../core/solution/index.js";
import { RecommendationService } from "../recommendation-engine/recommendation.service.js";
import { ReasoningEngine, type ReasoningTrace } from "../../core/reasoning/index.js";
import type { RecommendationRequest, RecommendationResponse } from "../recommendation-engine/recommendation.types.js";
import type { IntentAnalyzeBody, IntentRecommendBody } from "./intent.schemas.js";

export interface IntentRecommendationResult {
  readonly analysis: IntentAnalysis;
  readonly solutionPlan: {
    readonly primary?: SolutionSummary;
    readonly alternatives: SolutionSummary[];
  };
  readonly recommendationRequest: RecommendationRequest;
  readonly recommendations: RecommendationResponse;
  readonly reasoning: ReasoningTrace;
}

export interface SolutionSummary {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly score: number;
  readonly reasons: string[];
  readonly requiredCapabilities: Array<{
    code: string;
    value?: string | number | boolean;
    minimumConfidence?: number;
  }>;
}

export class IntentApiService {
  private readonly solutionOrchestrator: SolutionRecommendationOrchestrator;

  constructor(
    private readonly intentEngine = new IntentEngine(),
    private readonly recommendationService = new RecommendationService(),
    solutionOrchestrator?: SolutionRecommendationOrchestrator,
    private readonly reasoningEngine = new ReasoningEngine(),
  ) {
    this.solutionOrchestrator = solutionOrchestrator
      ?? new SolutionRecommendationOrchestrator(DEFAULT_SOLUTION_DEFINITIONS);
  }

  analyze(input: IntentAnalyzeBody): IntentAnalysis {
    return this.intentEngine.analyze(input.query, {
      defaultLimit: input.limit,
      validOnly: input.validOnly,
      minimumScore: input.minimumScore,
    });
  }

  async recommend(input: IntentRecommendBody): Promise<IntentRecommendationResult> {
    const analysis = this.analyze(input);
    const plan = this.solutionOrchestrator.plan(analysis, input.solutionLimit ?? 3);
    const recommendationRequest = mapPlanToRecommendationRequest(plan, input);
    const recommendations = await this.recommendationService.recommend(recommendationRequest);
    const reasoning = this.reasoningEngine.reason({
      intent: analysis.intent,
      solution: plan.primarySolution,
      candidates: recommendations.items,
    });

    return {
      analysis,
      solutionPlan: {
        primary: plan.primarySolution ? summarizeSolution(plan.primarySolution) : undefined,
        alternatives: plan.solutions.slice(plan.primarySolution ? 1 : 0).map(summarizeSolution),
      },
      recommendationRequest,
      recommendations,
      reasoning,
    };
  }
}

export function mapAnalysisToRecommendationRequest(
  analysis: IntentAnalysis,
  input: Pick<IntentRecommendBody, "query" | "limit" | "currency" | "debug">,
): RecommendationRequest {
  const fallbackPlan: SolutionRecommendationPlan = {
    analysis,
    solutions: [],
    criteria: analysis.criteria,
  };
  return mapPlanToRecommendationRequest(fallbackPlan, input);
}

export function mapPlanToRecommendationRequest(
  plan: SolutionRecommendationPlan,
  input: Pick<IntentRecommendBody, "query" | "limit" | "currency" | "debug">,
): RecommendationRequest {
  const attributeValues = Object.values(plan.criteria.attributes ?? {})
    .flatMap((values) => values ?? [])
    .map(slugify)
    .filter(Boolean);

  const solutionKnowledge = plan.primarySolution
    ? [
        plan.primarySolution.definition.name,
        ...(plan.primarySolution.definition.recipients ?? []),
        ...(plan.primarySolution.definition.occasions ?? []),
        ...(plan.primarySolution.definition.emotions ?? []),
      ].map(slugify).filter(Boolean)
    : [];

  const primaryDescription = plan.primarySolution?.definition.description;
  const query = [
    plan.criteria.query ?? input.query,
    plan.primarySolution?.definition.name,
    primaryDescription,
  ].filter((value): value is string => Boolean(value?.trim())).join(" ");

  return {
    query,
    limit: input.limit ?? plan.criteria.limit,
    budget: plan.analysis.intent.maxPriceMinor === undefined
      ? undefined
      : plan.analysis.intent.maxPriceMinor / 100,
    quantity: plan.analysis.intent.quantity,
    currency: input.currency ?? "EUR",
    knowledgeSlugs: [...new Set([...attributeValues, ...solutionKnowledge])].slice(0, 30),
    customizable: plan.analysis.intent.personalization,
    debug: input.debug,
  };
}

function summarizeSolution(solution: ResolvedSolution): SolutionSummary {
  return {
    id: solution.definition.id,
    name: solution.definition.name,
    description: solution.definition.description,
    score: solution.score,
    reasons: solution.reasons,
    requiredCapabilities: solution.definition.requiredCapabilities ?? [],
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
