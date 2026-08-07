import type { SolutionConstraintResult, SolutionPolicy, SolutionPolicyContext } from "./solution-engine.types.js";

function result(policyId: string, passed: boolean, score: number, reasons: readonly string[], warnings: readonly string[] = []): SolutionConstraintResult {
  return Object.freeze({ policyId, passed, score, reasons: Object.freeze([...reasons]), warnings: Object.freeze([...warnings]) });
}

export class BudgetPolicy implements SolutionPolicy {
  readonly id = "budget";
  readonly weight = 0.35;

  evaluate(context: SolutionPolicyContext): SolutionConstraintResult {
    const maximum = context.creativeBrief.budget?.maximum;
    if (maximum === undefined) return result(this.id, true, 0.7, ["No existe un presupuesto máximo; la solución permanece elegible."], ["Presupuesto no definido."]);
    if (context.total <= maximum) {
      const remaining = maximum - context.total;
      return result(this.id, true, Math.max(0.7, 1 - remaining / Math.max(maximum, 1) * 0.25), [`La solución cuesta ${context.total} EUR y respeta el máximo de ${maximum} EUR.`]);
    }
    return result(this.id, false, 0, [], [`La solución supera el presupuesto en ${(context.total - maximum).toFixed(2)} EUR.`]);
  }
}

export class ProductCompatibilityPolicy implements SolutionPolicy {
  readonly id = "product-compatibility";
  readonly weight = 0.25;

  evaluate(context: SolutionPolicyContext): SolutionConstraintResult {
    const ages = context.creativeBrief.audience.map((item) => item.age).filter((age): age is number => age !== undefined);
    const incompatible = context.products.filter((product) => {
      if (!product.available) return true;
      return ages.some((age) => (product.minAge !== undefined && age < product.minAge) || (product.maxAge !== undefined && age > product.maxAge));
    });
    if (incompatible.length > 0) return result(this.id, false, 0, [], incompatible.map((item) => `${item.name} no es adecuado para la edad o no está disponible.`));
    return result(this.id, true, 1, ["Todos los productos están disponibles y son adecuados para la audiencia."]);
  }
}

export class VisualCompatibilityPolicy implements SolutionPolicy {
  readonly id = "visual-compatibility";
  readonly weight = 0.15;

  evaluate(context: SolutionPolicyContext): SolutionConstraintResult {
    const compatible = context.products.filter((product) => product.compatibleVisualStyles.includes(context.imageBrief.visualStyle));
    const score = context.products.length === 0 ? 0 : compatible.length / context.products.length;
    return result(this.id, score >= 0.5, score, [`${compatible.length} de ${context.products.length} productos admiten el estilo ${context.imageBrief.visualStyle}.`], score < 1 ? ["Algún producto podría requerir adaptar la dirección visual."] : []);
  }
}

export class EmotionPolicy implements SolutionPolicy {
  readonly id = "emotion";
  readonly weight = 0.25;

  evaluate(context: SolutionPolicyContext): SolutionConstraintResult {
    const goals = context.creativeBrief.emotionalGoals;
    const matched = new Set(context.products.flatMap((product) => product.supportedEmotionalGoals).filter((goal) => goals.includes(goal)));
    const score = goals.length === 0 ? 0.5 : matched.size / goals.length;
    return result(this.id, score > 0, Math.max(0.35, score), [`La selección cubre ${matched.size} de ${goals.length} objetivos emocionales del brief.`]);
  }
}

export const DEFAULT_SOLUTION_POLICIES: readonly SolutionPolicy[] = Object.freeze([
  new BudgetPolicy(),
  new ProductCompatibilityPolicy(),
  new VisualCompatibilityPolicy(),
  new EmotionPolicy(),
]);
