import type { ParsedIntent } from "../intent/model.js";
import type { ReasonedRecommendation } from "../reasoning/model.js";
import type { ResolvedSolution } from "../solution/model.js";

export type CreativeStyle = "emotiva" | "elegante" | "divertida" | "original" | "practica";

export interface CreativeIdea {
  readonly id: string;
  readonly title: string;
  readonly style: CreativeStyle;
  readonly concept: string;
  readonly whyItFits: string[];
  readonly productIds: string[];
  readonly estimatedBudget?: { min: number; max: number; currency: "EUR" };
  readonly visualPrompt: string;
  readonly score: number;
}

export interface CreativityInput {
  readonly intent: ParsedIntent;
  readonly solutions: readonly ResolvedSolution[];
  readonly decisions: readonly ReasonedRecommendation[];
  readonly limit?: number;
}
