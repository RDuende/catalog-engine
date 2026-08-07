import type { RceConversationState } from "./contracts.js";
import type { RceGoalPlan, RceGoalStatus, RceInformationGoal } from "./goal-contracts.js";

interface GoalDefinition {
  readonly id: string;
  readonly factKey: string;
  readonly label: string;
  readonly required: boolean;
  readonly basePriority: number;
  readonly question: string;
  readonly valueScore: number;
}

const PERSONAL_GOALS: readonly GoalDefinition[] = Object.freeze([
  { id: "recipient.relationship", factKey: "recipient.relationship", label: "Relación", required: true, basePriority: 100, valueScore: 0.9, question: "¿Qué relación tienes con la persona que recibirá el regalo?" },
  { id: "occasion.type", factKey: "occasion.type", label: "Ocasión", required: false, basePriority: 95, valueScore: 0.9, question: "¿Qué vais a celebrar?" },
  { id: "recipient.interests", factKey: "recipient.interests", label: "Intereses", required: false, basePriority: 90, valueScore: 1, question: "¿Qué le gusta o qué aficiones tiene?" },
  { id: "budget.max", factKey: "budget.max", label: "Presupuesto", required: false, basePriority: 85, valueScore: 0.95, question: "¿Sobre qué presupuesto quieres moverte?" },
  { id: "recipient.age", factKey: "recipient.age", label: "Edad", required: false, basePriority: 80, valueScore: 0.8, question: "¿Qué edad tiene?" },
  { id: "personalization.enabled", factKey: "personalization.enabled", label: "Personalización", required: false, basePriority: 60, valueScore: 0.7, question: "¿Quieres personalizarlo con nombre, foto o algún mensaje?" },
  { id: "gift.style", factKey: "gift.style", label: "Estilo", required: false, basePriority: 45, valueScore: 0.55, question: "¿Prefieres algo divertido, emotivo, elegante o sencillo?" },
]);

const GENERIC_GOALS: readonly GoalDefinition[] = Object.freeze([
  { id: "occasion.type", factKey: "occasion.type", label: "Ocasión", required: false, basePriority: 90, valueScore: 0.9, question: "¿Buscas ideas para alguna ocasión concreta?" },
  { id: "budget.max", factKey: "budget.max", label: "Presupuesto", required: false, basePriority: 85, valueScore: 0.95, question: "¿Sobre qué presupuesto quieres moverte?" },
  { id: "gift.style", factKey: "gift.style", label: "Estilo", required: false, basePriority: 70, valueScore: 0.55, question: "¿Qué estilo de regalo te gustaría explorar?" },
]);

function hasValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  return typeof value !== "string" || value.trim().length > 0;
}

function reason(key: string, satisfied: boolean): string {
  if (satisfied) return "Este dato ya está definido.";
  if (key === "recipient.interests") return "Los intereses mejoran mucho la relevancia.";
  if (key === "budget.max") return "El presupuesto evita propuestas inviables.";
  if (key === "occasion.type") return "La ocasión condiciona el tipo de regalo.";
  if (key === "recipient.relationship") return "La relación ajusta el tono emocional.";
  if (key === "recipient.age") return "La edad filtra productos apropiados.";
  return "Este dato mejora la calidad de la propuesta.";
}

export class RceGoalEngine {
  plan(state: RceConversationState, now = new Date().toISOString()): RceGoalPlan {
    const defs = state.facts["gift.scope"]?.value === "generic" ? GENERIC_GOALS : PERSONAL_GOALS;

    const goals = defs.map((def): RceInformationGoal => {
      const satisfied = hasValue(state.facts[def.factKey]?.value);
      const status: RceGoalStatus = satisfied ? "SATISFIED" : def.required ? "PENDING" : "OPTIONAL";
      let priority = satisfied ? 0 : def.basePriority;

      if (!satisfied && def.factKey === "recipient.interests" && hasValue(state.facts["occasion.type"]?.value)) priority += 12;
      if (!satisfied && def.factKey === "budget.max" && hasValue(state.facts["recipient.interests"]?.value)) priority += 10;

      return Object.freeze({
        id: def.id,
        factKey: def.factKey,
        label: def.label,
        status,
        required: def.required,
        priority,
        valueScore: def.valueScore,
        reason: reason(def.factKey, satisfied),
        question: def.question,
      });
    });

    const pending = goals
      .filter((goal) => goal.status !== "SATISFIED")
      .sort((a, b) => Number(b.required) - Number(a.required) || b.priority - a.priority || b.valueScore - a.valueScore);

    const missingRequired = goals.filter((goal) => goal.required && goal.status !== "SATISFIED").map((goal) => goal.factKey);
    const relevant = goals.filter((goal) => goal.required || goal.valueScore >= 0.7);
    const total = relevant.reduce((sum, goal) => sum + goal.valueScore, 0);
    const earned = relevant.filter((goal) => goal.status === "SATISFIED").reduce((sum, goal) => sum + goal.valueScore, 0);
    const score = total ? Math.round((earned / total) * 10000) / 100 : 100;
    const readyForProposals =
      missingRequired.length === 0 &&
      (score >= 55 || hasValue(state.facts["recipient.interests"]?.value) || hasValue(state.facts["budget.max"]?.value));

    return Object.freeze({
      goals: Object.freeze(goals),
      ...(pending[0] ? { nextGoal: pending[0] } : {}),
      readyForProposals,
      score,
      missingRequired: Object.freeze(missingRequired),
      generatedAt: now,
    });
  }
}
