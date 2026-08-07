import type { CommercialContext, CommercialContextField } from "../../core/commercial-context/index.js";
import type { RuntimeGoal } from "./runtime.types.js";

export interface RequirementQuestion {
  readonly field: CommercialContextField;
  readonly question: string;
  readonly priority: number;
  readonly valueReason: string;
}

export interface RequirementPolicy {
  readonly id: string;
  readonly goal: RuntimeGoal;
  readonly required: readonly CommercialContextField[];
  readonly optional: readonly RequirementQuestion[];
}

const recommendationPolicy: RequirementPolicy = {
  id: "commercial-recommendation-v1",
  goal: "RECOMMEND_PRODUCTS",
  required: ["need", "quantity", "budget"],
  optional: [
    { field: "sustainability", priority: 80, question: "¿Quieres que el regalo sea sostenible o no tienes preferencia?", valueReason: "Mejora la selección de materiales y el perfil de recomendación." },
    { field: "deadline", priority: 55, question: "¿Para qué fecha necesitas tenerlo entregado?", valueReason: "Permite comprobar la viabilidad de producción y entrega." },
    { field: "sector", priority: 35, question: "¿A qué sector pertenece la empresa?", valueReason: "Ayuda a adaptar la propuesta al público y al contexto comercial." },
  ],
};

const proposalPolicy: RequirementPolicy = {
  id: "commercial-proposal-v1",
  goal: "PREPARE_PROPOSAL",
  required: ["need", "quantity", "budget"],
  optional: [
    { field: "deadline", priority: 90, question: "¿Para qué fecha necesitas la propuesta o la entrega?", valueReason: "Es necesaria para estimar producción y plazo con mayor precisión." },
    { field: "sustainability", priority: 65, question: "¿Quieres priorizar opciones sostenibles?", valueReason: "Permite orientar materiales y argumentario comercial." },
    { field: "sector", priority: 40, question: "¿A qué sector pertenece el cliente?", valueReason: "Mejora la adecuación de la propuesta." },
  ],
};

const understandingPolicy: RequirementPolicy = {
  id: "commercial-understanding-v1",
  goal: "UNDERSTAND_REQUEST",
  required: ["need"],
  optional: [],
};

export const defaultRequirementPolicies: readonly RequirementPolicy[] = [
  understandingPolicy,
  recommendationPolicy,
  proposalPolicy,
];

export class RequirementPolicyEngine {
  private readonly policies = new Map<RuntimeGoal, RequirementPolicy>();

  constructor(policies: readonly RequirementPolicy[] = defaultRequirementPolicies) {
    for (const policy of policies) this.policies.set(policy.goal, policy);
  }

  get(goal: RuntimeGoal): RequirementPolicy {
    const policy = this.policies.get(goal);
    if (!policy) throw new Error(`No existe política de requisitos para ${goal}.`);
    return policy;
  }

  evaluate(goal: RuntimeGoal, context: CommercialContext) {
    const policy = this.get(goal);
    const requiredMissing = policy.required.filter((field) => isMissing(context[field]));
    const optionalMissing = policy.optional
      .filter(({ field }) => isMissing(context[field]))
      .sort((a, b) => b.priority - a.priority);
    return {
      policy,
      requiredMissing,
      optionalMissing,
      blocking: requiredMissing.length > 0,
      ready: requiredMissing.length === 0,
    } as const;
  }
}

function isMissing(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}
