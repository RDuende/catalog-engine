import type { IntentAnalysis } from "../intent/model.js";
import type { RecommendationCriteria } from "../recommendation/model.js";
import { SolutionEngine } from "./engine.js";
import type { ResolvedSolution, SolutionDefinition } from "./model.js";

export interface SolutionRecommendationPlan {
  analysis: IntentAnalysis;
  solutions: ResolvedSolution[];
  primarySolution?: ResolvedSolution;
  criteria: RecommendationCriteria;
}

/**
 * Une Intent -> Solution -> RecommendationCriteria sin acoplar el motor de
 * intención a la implementación de recomendaciones ni a Prisma.
 */
export class SolutionRecommendationOrchestrator {
  private readonly solutionEngine: SolutionEngine;

  constructor(definitions: SolutionDefinition[]) {
    this.solutionEngine = new SolutionEngine(definitions);
  }

  plan(analysis: IntentAnalysis, limit = 3): SolutionRecommendationPlan {
    const solutions = this.solutionEngine.resolve(analysis.intent, limit);
    const primarySolution = solutions.at(0);
    const criteria = mergeCriteria(analysis.criteria, primarySolution?.criteria);

    return {
      analysis,
      solutions,
      primarySolution,
      criteria,
    };
  }
}

function mergeCriteria(
  base: RecommendationCriteria,
  solution?: RecommendationCriteria,
): RecommendationCriteria {
  if (!solution) return { ...base };

  return {
    ...base,
    ...solution,
    query: [base.query, solution.query]
      .filter((value): value is string => Boolean(value?.trim()))
      .join(" "),
    categories: unique([...(base.categories ?? []), ...(solution.categories ?? [])]),
    attributes: mergeAttributes(base.attributes, solution.attributes),
    maxPriceMinor: base.maxPriceMinor ?? solution.maxPriceMinor,
    personalization: base.personalization ?? solution.personalization,
    limit: base.limit,
    minimumScore: base.minimumScore,
  };
}

function mergeAttributes(
  base: RecommendationCriteria["attributes"],
  solution: RecommendationCriteria["attributes"],
): RecommendationCriteria["attributes"] {
  const result: Record<string, string[]> = {};
  const keys = new Set([
    ...Object.keys(base ?? {}),
    ...Object.keys(solution ?? {}),
  ]);

  for (const key of keys) {
    const baseValues = (base as Record<string, string[]> | undefined)?.[key] ?? [];
    const solutionValues = (solution as Record<string, string[]> | undefined)?.[key] ?? [];
    result[key] = unique([...baseValues, ...solutionValues]);
  }

  return result as RecommendationCriteria["attributes"];
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
