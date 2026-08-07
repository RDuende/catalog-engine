import type { CreativeBrief, EmotionalGoal, VisualStyle } from "../creative-brief/index.js";
import type { ImageBrief, ImageBriefSet } from "../image-brief/index.js";
import type { StoryConcept, StoryConceptSet } from "../story-engine/index.js";

export type SolutionStatus = "DRAFT" | "READY" | "REJECTED";
export type ProductCategory = "TEXTILE" | "DECORATION" | "PUZZLE" | "BOOK" | "DRINKWARE" | "VOUCHER";

export interface SolutionProduct {
  readonly productId: string;
  readonly sku: string;
  readonly name: string;
  readonly category: ProductCategory;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly totalPrice: number;
  readonly currency: string;
  readonly role: "PRIMARY" | "COMPLEMENT" | "PACKAGING";
  readonly reason: string;
}

export interface SolutionConstraintResult {
  readonly policyId: string;
  readonly passed: boolean;
  readonly score: number;
  readonly reasons: readonly string[];
  readonly warnings: readonly string[];
}

export interface Solution {
  readonly id: string;
  readonly version: number;
  readonly status: SolutionStatus;
  readonly journeyId: string;
  readonly journeyVersion: number;
  readonly creativeBriefId: string;
  readonly creativeBriefVersion: number;
  readonly storyConceptId: string;
  readonly storyConceptVersion: number;
  readonly imageBriefId: string;
  readonly imageBriefVersion: number;
  readonly title: string;
  readonly description: string;
  readonly emotionalPromise: string;
  readonly products: readonly SolutionProduct[];
  readonly subtotal: number;
  readonly total: number;
  readonly currency: string;
  readonly withinBudget: boolean;
  readonly score: number;
  readonly reasons: readonly string[];
  readonly warnings: readonly string[];
  readonly policyResults: readonly SolutionConstraintResult[];
  readonly engineId: string;
  readonly engineVersion: string;
  readonly createdAt: string;
}

export interface SolutionSet {
  readonly id: string;
  readonly journeyId: string;
  readonly journeyVersion: number;
  readonly creativeBriefId: string;
  readonly creativeBriefVersion: number;
  readonly storySetId: string;
  readonly storySetVersion: number;
  readonly imageBriefSetId: string;
  readonly imageBriefSetVersion: number;
  readonly version: number;
  readonly solutions: readonly Solution[];
  readonly rejectedCandidates: number;
  readonly createdAt: string;
}

export interface CatalogProduct {
  readonly id: string;
  readonly sku: string;
  readonly name: string;
  readonly category: ProductCategory;
  readonly unitPrice: number;
  readonly currency: string;
  readonly available: boolean;
  readonly minAge?: number;
  readonly maxAge?: number;
  readonly compatibleVisualStyles: readonly VisualStyle[];
  readonly supportedEmotionalGoals: readonly EmotionalGoal[];
  readonly tags: readonly string[];
}

export interface CatalogRepository {
  listAvailable(): readonly CatalogProduct[];
  getById(productId: string): CatalogProduct | undefined;
}

export interface SolutionCandidate {
  readonly id: string;
  readonly story: StoryConcept;
  readonly imageBrief: ImageBrief;
  readonly productSelections: readonly { readonly productId: string; readonly quantity: number; readonly role: SolutionProduct["role"] }[];
  readonly title: string;
  readonly description: string;
}

export interface SolutionPolicyContext {
  readonly creativeBrief: CreativeBrief;
  readonly story: StoryConcept;
  readonly imageBrief: ImageBrief;
  readonly products: readonly CatalogProduct[];
  readonly total: number;
}

export interface SolutionPolicy {
  readonly id: string;
  readonly weight: number;
  evaluate(context: SolutionPolicyContext): SolutionConstraintResult;
}

export interface BuildSolutionsInput {
  readonly creativeBrief: CreativeBrief;
  readonly storySet: StoryConceptSet;
  readonly imageBriefSet: ImageBriefSet;
  readonly count?: number;
  readonly setVersion?: number;
  readonly now?: string;
}
