import type { ParsedIntent } from "../intent/model.js";
import type { RecommendationItemResult } from "../../modules/recommendation-engine/recommendation.types.js";
import type { ConstraintEvaluation, ReasoningConstraint } from "./model.js";

export class ConstraintEngine {
  build(intent: ParsedIntent): ReasoningConstraint[] {
    const constraints: ReasoningConstraint[] = [];
    if (intent.maxPriceMinor !== undefined) {
      constraints.push({ code: "BUDGET", severity: "hard", expected: intent.maxPriceMinor / 100, description: `Precio máximo ${formatMoney(intent.maxPriceMinor / 100)}` });
    }
    if (intent.personalization !== undefined) {
      constraints.push({ code: "PERSONALIZATION", severity: intent.personalization ? "hard" : "soft", expected: intent.personalization, description: intent.personalization ? "Debe admitir personalización" : "No requiere personalización" });
    }
    if (intent.quantity !== undefined) {
      constraints.push({ code: "QUANTITY", severity: "soft", expected: intent.quantity, description: `Cantidad solicitada: ${intent.quantity}` });
    }
    if (intent.priority === "high") {
      constraints.push({ code: "DELIVERY", severity: "soft", expected: "fast", description: "Prioridad de entrega alta" });
    }
    return constraints;
  }

  evaluate(item: RecommendationItemResult, constraints: readonly ReasoningConstraint[]): ConstraintEvaluation[] {
    return constraints.map((constraint) => evaluateConstraint(item, constraint));
  }
}

function evaluateConstraint(item: RecommendationItemResult, constraint: ReasoningConstraint): ConstraintEvaluation {
  if (constraint.code === "BUDGET") {
    if (item.unitPrice === null) return unknown(constraint, "No hay precio disponible para validar el presupuesto.");
    const ok = item.unitPrice <= Number(constraint.expected);
    return { constraint, status: ok ? "satisfied" : "violated", contribution: ok ? 12 : -100, explanation: ok ? `Precio ${formatMoney(item.unitPrice)} dentro del presupuesto.` : `Precio ${formatMoney(item.unitPrice)} supera el presupuesto.` };
  }
  if (constraint.code === "PERSONALIZATION") {
    const expected = Boolean(constraint.expected);
    const ok = item.customizable === expected;
    return { constraint, status: ok ? "satisfied" : "violated", contribution: ok ? 10 : constraint.severity === "hard" ? -100 : -8, explanation: ok ? "Cumple el requisito de personalización." : "No cumple el requisito de personalización." };
  }
  if (constraint.code === "QUANTITY") {
    return unknown(constraint, "La capacidad por cantidad todavía no está confirmada en el catálogo.");
  }
  const fastSignals = [...item.knowledge, ...item.categories, item.name].join(" ").toLowerCase();
  const fast = /rapida|rapido|express|24h|48h|urgente/.test(fastSignals);
  return { constraint, status: fast ? "satisfied" : "unknown", contribution: fast ? 8 : 0, explanation: fast ? "Hay señales de producción o entrega rápida." : "El plazo de entrega debe confirmarse." };
}

function unknown(constraint: ReasoningConstraint, explanation: string): ConstraintEvaluation {
  return { constraint, status: "unknown", contribution: 0, explanation };
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value);
}
