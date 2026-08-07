import type { RceConversationState } from "./contracts.js";
import type { RceGoalPlan } from "./goal-contracts.js";
import type { RceQuestionPlan } from "./question-planner.js";
import type {
  RceIntent,
  RceResponsePlan,
} from "./conversation-planner.contracts.js";
import type { RceProposalTrigger } from "./proposal-trigger.js";

const RELATIONS: Readonly<Record<string, string>> = Object.freeze({
  parent: "tus padres",
  sibling: "tu hermano o hermana",
  child: "tu hijo o hija",
  nephew: "tu sobrino o sobrina",
  friend: "un amigo o amiga",
  partner: "tu pareja",
  cousin: "tu primo o prima",
  grandparent: "tus abuelos",
});

const OCCASIONS: Readonly<Record<string, string>> = Object.freeze({
  birthday: "su cumpleaños",
  communion: "su comunión",
  wedding: "una boda",
  anniversary: "un aniversario",
  christmas: "Navidad",
});

function value(state: RceConversationState, key: string): unknown {
  return state.facts[key]?.value;
}

function summary(state: RceConversationState): string | undefined {
  const parts: string[] = [];
  const relation = value(state, "recipient.relationship");
  const age = value(state, "recipient.age");
  const occasion = value(state, "occasion.type");
  const interests = value(state, "recipient.interests");
  const budget = value(state, "budget.max");

  if (typeof relation === "string") {
    parts.push(`es para ${RELATIONS[relation] ?? relation}`);
  }
  if (typeof age === "number") {
    parts.push(`tiene ${age} años`);
  }
  if (typeof occasion === "string") {
    parts.push(`la ocasión es ${OCCASIONS[occasion] ?? occasion}`);
  }
  if (Array.isArray(interests) && interests.length) {
    parts.push(`le interesa ${interests.join(" y ")}`);
  }
  if (typeof budget === "number") {
    parts.push(`el presupuesto máximo es ${budget} €`);
  }

  if (!parts.length) return undefined;
  const selected = parts.slice(-4);
  const last = selected.pop();
  return selected.length
    ? `Ya sé que ${selected.join(", ")} y ${last}.`
    : `Ya sé que ${last}.`;
}

export function planResponse(input: {
  readonly state: RceConversationState;
  readonly intent: RceIntent;
  readonly goals: RceGoalPlan;
  readonly question: RceQuestionPlan;
  readonly proposalTrigger: RceProposalTrigger;
}): RceResponsePlan {
  const known = summary(input.state);

  if (input.intent === "WAIT") {
    return Object.freeze({
      mode: "WAIT",
      text: "Claro, paramos aquí. Cuando quieras, seguimos desde este punto.",
      ...(known ? { summary: known } : {}),
    });
  }

  if (input.intent === "ACKNOWLEDGE" && !input.question.question) {
    return Object.freeze({
      mode: "ACKNOWLEDGE",
      text: "Perfecto. Ya tengo una buena base para continuar.",
      ...(known ? { summary: known } : {}),
    });
  }

  if (input.proposalTrigger.trigger) {
    return Object.freeze({
      mode: "ACTION",
      text: known
        ? `${known} Voy a preparar varias propuestas para que puedas compararlas.`
        : "Voy a preparar varias propuestas para que puedas compararlas.",
      ...(known ? { summary: known } : {}),
      action: Object.freeze({
        type: "SHOW_PROPOSALS",
        label: "Hacer propuestas",
      }),
    });
  }

  if (input.goals.readyForProposals) {
    return Object.freeze({
      mode: "READY",
      text: known
        ? `${known} Ya tengo información suficiente para empezar.`
        : "Ya tengo información suficiente para empezar.",
      ...(known ? { summary: known } : {}),
      action: Object.freeze({
        type: "SHOW_PROPOSALS",
        label: "Hacer propuestas",
      }),
    });
  }

  const question = input.question.question ?? "Cuéntame un poco más sobre el regalo.";
  const reason = input.question.reason
    ? ` ${input.question.reason}`
    : "";

  return Object.freeze({
    mode: "ASK",
    text: known
      ? `${known}${reason} ${question}`
      : `${reason.trim()} ${question}`.trim(),
    ...(known ? { summary: known } : {}),
    question,
  });
}
