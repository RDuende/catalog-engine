import type { RceRankedProductCandidate } from "./product-runtime.contracts.js";
import type { RceStorySeed } from "./story-runtime.contracts.js";
import type { RceImageVariant } from "./image-runtime.contracts.js";

export interface RceSolutionInput {
  readonly conversationId: string;
  readonly products: readonly RceRankedProductCandidate[];
  readonly stories: readonly RceStorySeed[];
  readonly images: readonly RceImageVariant[];
  readonly budgetMax?: number;
  readonly maxSolutions?: number;
}

export interface RceSolutionComponentRefs {
  readonly productId: string;
  readonly storySeedId?: string;
  readonly imageVariantId?: string;
}

export interface RceSolutionScoreBreakdown {
  readonly product: number;
  readonly story: number;
  readonly image: number;
  readonly budget: number;
  readonly coherence: number;
}

export interface RceComposedSolution {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly totalPrice?: number;
  readonly withinBudget: boolean;
  readonly score: number;
  readonly reasons: readonly string[];
  readonly components: RceSolutionComponentRefs;
  readonly breakdown: RceSolutionScoreBreakdown;
  readonly product: RceRankedProductCandidate;
  readonly story?: RceStorySeed;
  readonly image?: RceImageVariant;
}

export interface RceSolutionSet {
  readonly conversationId: string;
  readonly solutions: readonly RceComposedSolution[];
  readonly generatedAt: string;
  readonly version: number;
}

export interface RceSolutionComposerMetrics {
  readonly compositions: number;
  readonly emptyInputs: number;
  readonly generatedSolutions: number;
}
