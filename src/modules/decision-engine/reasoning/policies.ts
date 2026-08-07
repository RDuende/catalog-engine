import type { NextAction, ReasoningCandidate, ReasoningFacts } from "../../../platform/runtime/contracts/index.js";
import type { DecisionPolicy } from "./decision-policy.js";

abstract class BasePolicy implements DecisionPolicy {
  abstract readonly id: string;
  abstract readonly priority: number;
  abstract evaluate(facts: ReasoningFacts): ReasoningCandidate | null;

  protected candidate(
    action: NextAction,
    score: number,
    facts: ReasoningFacts,
    code: string,
    message: string,
    options: {
      capabilities?: readonly string[];
      reply?: string;
      metadata?: Readonly<Record<string, unknown>>;
    } = {},
  ): ReasoningCandidate {
    return Object.freeze({
      action,
      score,
      policyId: this.id,
      priority: this.priority,
      reasons: Object.freeze([{ code, message, evidence: { intent: facts.intent, state: facts.conversationState } }]),
      requiredCapabilities: Object.freeze([...(options.capabilities ?? [])]),
      reply: options.reply,
      metadata: Object.freeze({ ...(options.metadata ?? {}) }),
    });
  }
}

export class HumanSupportPolicy extends BasePolicy {
  readonly id = "human-support";
  readonly priority = 100;
  evaluate(facts: ReasoningFacts) {
    return facts.intent === "HUMAN_SUPPORT"
      ? this.candidate("ESCALATE", 1, facts, "HUMAN_SUPPORT_REQUESTED", "El usuario solicita atención humana.")
      : null;
  }
}

export class MissingContextPolicy extends BasePolicy {
  readonly id = "missing-context";
  readonly priority = 90;
  evaluate(facts: ReasoningFacts) {
    if (facts.missingFields.length === 0) return null;
    return this.candidate(
      "ASK_QUESTION",
      0.97,
      facts,
      "REQUIRED_CONTEXT_MISSING",
      `Faltan datos necesarios: ${facts.missingFields.join(", ")}.`,
      { metadata: { missingFields: facts.missingFields } },
    );
  }
}

export class GreetingPolicy extends BasePolicy {
  readonly id = "greeting";
  readonly priority = 80;
  evaluate(facts: ReasoningFacts) {
    return facts.intent === "GREETING"
      ? this.candidate("FAST_REPLY", 0.96, facts, "GREETING_DETECTED", "Puede responderse por Fast Path.")
      : null;
  }
}

export class ImagePolicy extends BasePolicy {
  readonly id = "image-action";
  readonly priority = 75;
  evaluate(facts: ReasoningFacts) {
    if (facts.intent !== "EDIT_IMAGE" && facts.intent !== "GENERATE_IMAGE") return null;
    return this.candidate(
      "GENERATE_IMAGE",
      facts.intent === "EDIT_IMAGE" ? 0.94 : 0.96,
      facts,
      "IMAGE_CAPABILITY_REQUIRED",
      "La solicitud necesita una capacidad avanzada de imagen.",
      { capabilities: [facts.intent === "EDIT_IMAGE" ? "image.edit" : "image.generate"] },
    );
  }
}

export class GiftPolicy extends BasePolicy {
  readonly id = "gift-journey";
  readonly priority = 70;
  evaluate(facts: ReasoningFacts) {
    if (facts.intent !== "CREATE_GIFT" && facts.intent !== "CHOOSE_PRODUCT") return null;
    if (facts.intent === "CREATE_GIFT" && !facts.creativeSignalKnown) {
      return this.candidate("BUILD_STORY", 0.9, facts, "CREATIVE_SIGNAL_REQUIRED", "El núcleo del regalo está completo y conviene inspirar antes de proponer.", { capabilities: ["story.discover"] });
    }
    return this.candidate("CREATE_PROPOSAL", 0.93, facts, "PROPOSAL_CONTEXT_READY", "Existe contexto suficiente para preparar una propuesta.", { capabilities: ["proposal.create"] });
  }
}

export class ProductPolicy extends BasePolicy {
  readonly id = "product-assistance";
  readonly priority = 65;
  evaluate(facts: ReasoningFacts) {
    if (facts.intent === "PRODUCT_QUESTION" || facts.intent === "CHECK_ORDER") {
      return this.candidate("SEARCH_KNOWLEDGE", 0.92, facts, "KNOWLEDGE_LOOKUP_REQUIRED", "La respuesta debe obtenerse de una fuente de conocimiento verificable.", { capabilities: [facts.intent === "CHECK_ORDER" ? "order.status" : "catalog.search"] });
    }
    if (facts.intent === "PERSONALIZE_PRODUCT") {
      return this.candidate("BUILD_SOLUTION", 0.9, facts, "PERSONALIZATION_READY", "Hay un producto seleccionado y debe configurarse la solución.", { capabilities: ["product.personalize"] });
    }
    return null;
  }
}

export class ResumeProjectPolicy extends BasePolicy {
  readonly id = "resume-project";
  readonly priority = 60;
  evaluate(facts: ReasoningFacts) {
    return facts.intent === "RESUME_PROJECT"
      ? this.candidate("SEARCH_KNOWLEDGE", 0.9, facts, "PROJECT_CONTEXT_LOOKUP", "Debe recuperarse el proyecto antes de continuar.", { capabilities: ["project.load"] })
      : null;
  }
}

export class UnknownIntentPolicy extends BasePolicy {
  readonly id = "unknown-intent";
  readonly priority = 10;
  evaluate(facts: ReasoningFacts) {
    return facts.intent === "UNKNOWN"
      ? this.candidate("ASK_QUESTION", 0.7, facts, "INTENT_UNCLEAR", "La intención no está suficientemente clara.")
      : null;
  }
}

export class DefaultContinuationPolicy extends BasePolicy {
  readonly id = "default-continuation";
  readonly priority = 0;
  evaluate(facts: ReasoningFacts) {
    return this.candidate("COMPLETE", 0.5, facts, "NO_SPECIAL_ACTION", "No se requiere una acción especializada.");
  }
}

export const DEFAULT_DECISION_POLICIES: readonly DecisionPolicy[] = Object.freeze([
  new HumanSupportPolicy(),
  new MissingContextPolicy(),
  new GreetingPolicy(),
  new ImagePolicy(),
  new GiftPolicy(),
  new ProductPolicy(),
  new ResumeProjectPolicy(),
  new UnknownIntentPolicy(),
  new DefaultContinuationPolicy(),
]);
