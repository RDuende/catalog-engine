import type { ParsedIntent } from "../intent/model.js";
import type { CapabilityRequirement } from "../capability/model.js";
import type { RecommendationCriteria } from "../recommendation/model.js";

export interface SolutionDefinition {
  id: string;
  name: string;
  description?: string;
  recipients?: string[];
  occasions?: string[];
  emotions?: string[];
  requiredCapabilities?: CapabilityRequirement[];
  productIds?: string[];
  priority?: number;
}

export interface ResolvedSolution {
  definition: SolutionDefinition;
  score: number;
  reasons: string[];
  criteria: RecommendationCriteria;
  intent: ParsedIntent;
}
