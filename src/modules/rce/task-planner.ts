import { randomUUID } from "node:crypto";
import type { RceConversationState } from "./contracts.js";
import type { RceGoalPlan } from "./goal-contracts.js";
import type {
  RceIntent,
  RcePlannedTask,
  RceTaskType,
} from "./conversation-planner.contracts.js";

function task(
  type: RceTaskType,
  priority: number,
  reason: string,
  input: Readonly<Record<string, unknown>>,
): RcePlannedTask {
  return Object.freeze({
    id: randomUUID(),
    type,
    status: type === "NOOP" ? "SKIPPED" : "PLANNED",
    priority,
    reason,
    input,
  });
}

function compactFacts(state: RceConversationState): Readonly<Record<string, unknown>> {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(state.facts).map(([key, fact]) => [key, fact.value]),
    ),
  );
}

export function planTasks(input: {
  readonly state: RceConversationState;
  readonly goals: RceGoalPlan;
  readonly intent: RceIntent;
}): readonly RcePlannedTask[] {
  const facts = compactFacts(input.state);
  const hasRecipient = Boolean(facts["recipient.relationship"] || facts["gift.scope"] === "generic");
  const hasOccasion = Boolean(facts["occasion.type"]);
  const hasInterests = Array.isArray(facts["recipient.interests"])
    ? (facts["recipient.interests"] as unknown[]).length > 0
    : Boolean(facts["recipient.interests"]);
  const hasBudget = typeof facts["budget.max"] === "number";

  const tasks: RcePlannedTask[] = [];

  if (hasRecipient && (hasOccasion || hasInterests)) {
    tasks.push(
      task(
        "SEARCH_PRODUCTS",
        90,
        "Ya existe contexto suficiente para iniciar una búsqueda preliminar.",
        facts,
      ),
    );
  }

  if (hasInterests) {
    tasks.push(
      task(
        "SEARCH_TEMPLATES",
        65,
        "Los intereses permiten preparar líneas visuales compatibles.",
        facts,
      ),
    );
  }

  if (hasRecipient && hasOccasion) {
    tasks.push(
      task(
        "PREPARE_STORY_SEEDS",
        55,
        "La relación y la ocasión permiten anticipar enfoques emocionales.",
        facts,
      ),
    );
  }

  if (hasBudget && (hasOccasion || hasInterests)) {
    tasks.push(
      task(
        "RANK_PRODUCTS",
        85,
        "El presupuesto permite ordenar candidatos viables.",
        facts,
      ),
    );
  }

  if (
    input.intent === "GENERATE_PROPOSALS" ||
    input.goals.readyForProposals
  ) {
    tasks.push(
      task(
        "PREPARE_PROPOSALS",
        100,
        "La conversación está preparada para construir propuestas.",
        facts,
      ),
    );
  }

  if (
    input.intent === "IMPROVE_PROPOSALS" ||
    input.intent === "CHANGE_STYLE" ||
    input.intent === "REDUCE_PRICE" ||
    input.intent === "NEXT_PROPOSAL"
  ) {
    tasks.push(
      task(
        "REFINE_PROPOSALS",
        100,
        `La intención ${input.intent} requiere evolucionar propuestas existentes.`,
        facts,
      ),
    );
  }

  if (!tasks.length) {
    tasks.push(task("NOOP", 0, "Todavía no hay trabajo útil que lanzar.", facts));
  }

  return Object.freeze(
    tasks.sort((left, right) => right.priority - left.priority),
  );
}
