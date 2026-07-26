export interface RecipeOperation {
  id: string;
  order: number;
  name: string;
  technique?: string;
  machine?: string;
  estimatedMinutes: number;
  instructions?: string;
  qualityChecks?: string[];
}

export interface ProductionRecipe {
  id: string;
  productId: string;
  version: number;
  name: string;
  materials: Array<{ code: string; quantity: number; unit: string }>;
  operations: RecipeOperation[];
  packaging?: string;
  active: boolean;
}

export interface RecipePlan {
  recipe: ProductionRecipe;
  totalEstimatedMinutes: number;
  orderedOperations: RecipeOperation[];
}
