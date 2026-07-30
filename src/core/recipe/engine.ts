import type { ProductionRecipe, RecipePlan } from "./model.js";

export class RecipeEngine {
  private readonly recipes = new Map<string, ProductionRecipe[]>();

  constructor(recipes: ProductionRecipe[] = []) { for (const recipe of recipes) this.register(recipe); }

  register(recipe: ProductionRecipe): void {
    validateRecipe(recipe);
    const current = this.recipes.get(recipe.productId) ?? [];
    const next = current.filter((item) => item.id !== recipe.id);
    next.push(recipe);
    this.recipes.set(recipe.productId, next);
  }

  getActive(productId: string): ProductionRecipe | undefined {
    return (this.recipes.get(productId) ?? [])
      .filter((recipe) => recipe.active)
      .sort((a, b) => b.version - a.version)[0];
  }

  build(productId: string): RecipePlan | undefined {
    const recipe = this.getActive(productId);
    if (!recipe) return undefined;
    const orderedOperations = [...recipe.operations].sort((a, b) => a.order - b.order);
    return { recipe, orderedOperations, totalEstimatedMinutes: orderedOperations.reduce((sum, operation) => sum + operation.estimatedMinutes, 0) };
  }
}

function validateRecipe(recipe: ProductionRecipe): void {
  if (!recipe.id.trim() || !recipe.productId.trim()) throw new Error("La receta requiere id y productId");
  if (!Number.isInteger(recipe.version) || recipe.version < 1) throw new Error("La versión de la receta debe ser un entero positivo");
  const orders = new Set<number>();
  for (const operation of recipe.operations) {
    if (operation.estimatedMinutes < 0) throw new Error("estimatedMinutes no puede ser negativo");
    if (orders.has(operation.order)) throw new Error("Las operaciones no pueden repetir el orden");
    orders.add(operation.order);
  }
}
