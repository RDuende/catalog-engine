import { AIConversationService } from "../../ai/conversation/conversation.service.js";
import { mergeCommercialContext } from "../../core/commercial-context/index.js";
import { SalesBrainService } from "../sales-brain/sales-brain.service.js";
import { QuestionRankingEngine } from "./question-ranking.js";
import { RequirementPolicyEngine } from "./requirement-policy.js";
import { commercialFactsFrom, withRuntimeCommercialFacts } from "./runtime-handler-context.js";
import type { RuntimeDecisionTrace, RuntimeSkill, RuntimeState, RuntimeTool } from "./runtime.types.js";

/** M2.3: canonical handler. RaiContext is the source of truth. */
export class ConversationUnderstandingSkill implements RuntimeSkill {
  readonly id = "conversation-understanding";
  readonly type = "SKILL" as const;
  readonly contextMode = "RAI_CONTEXT" as const;

  constructor(private readonly conversation = new AIConversationService()) {}

  async execute(state: RuntimeState): Promise<RuntimeState> {
    const currentFacts = commercialFactsFrom(state);
    const result = await this.conversation.understand({
      message: state.raiContext.conversation.message,
      context: currentFacts,
    });
    const merged = mergeCommercialContext(currentFacts, result.data.patches);
    const next = withRuntimeCommercialFacts(state, merged.context);
    return {
      ...next,
      understanding: result.data,
      aiTrace: result.trace,
      reply: result.data.userFacingReply,
      data: {
        ...state.data,
        appliedPatches: merged.applied,
        rejectedPatches: merged.rejected,
        conversationFallbackUsed: result.fallbackUsed,
        llmMissingFields: result.data.missingFields,
      },
    };
  }
}

/** M2.3: evaluates requirements from canonical context facts. */
export class RequirementGateTool implements RuntimeTool {
  readonly id = "requirement-gate";
  readonly type = "TOOL" as const;
  readonly contextMode = "RAI_CONTEXT" as const;

  constructor(
    private readonly policies = new RequirementPolicyEngine(),
    private readonly questions = new QuestionRankingEngine(),
  ) {}

  async execute(state: RuntimeState): Promise<RuntimeState> {
    const facts = commercialFactsFrom(state);
    const evaluation = this.policies.evaluate(state.request.goal ?? "RECOMMEND_PRODUCTS", facts);
    const ranked = this.questions.rank(evaluation.requiredMissing, evaluation.optionalMissing);
    const selected = ranked[0];
    const decisionTrace: RuntimeDecisionTrace = {
      policyId: evaluation.policy.id,
      requiredFields: evaluation.policy.required,
      missingRequired: evaluation.requiredMissing,
      missingOptional: evaluation.optionalMissing.map((item) => item.field),
      ready: evaluation.ready,
      selectedQuestion: selected,
      alternatives: ranked.slice(1).map(({ field, score, reason, blocking }) => ({ field, score, reason, blocking })),
      decision: evaluation.blocking ? "ASK_REQUIRED" : evaluation.optionalMissing.length > 0 ? "CONTINUE_WITH_OPTIONAL_GAPS" : "CONTINUE",
      reason: evaluation.blocking
        ? `Faltan ${evaluation.requiredMissing.length} requisito(s) obligatorio(s).`
        : evaluation.optionalMissing.length > 0
          ? "Los requisitos obligatorios están completos; los campos opcionales no bloquean la recomendación."
          : "El contexto cumple completamente la política del objetivo.",
    };

    const data = {
      ...state.data,
      missingFields: evaluation.requiredMissing,
      optionalMissingFields: evaluation.optionalMissing.map((item) => item.field),
      decisionTrace,
    };

    if (!evaluation.blocking) return { ...state, context: facts, data };

    return {
      ...state,
      context: facts,
      reply: selected?.question ?? "Necesito algún dato más antes de continuar.",
      stop: true,
      status: "WAITING_FOR_USER",
      data,
    };
  }
}

/** M2.3: invokes the sales brain with data sourced from RaiContext. */
export class SalesBrainTool implements RuntimeTool {
  readonly id = "sales-brain";
  readonly type = "TOOL" as const;
  readonly contextMode = "RAI_CONTEXT" as const;

  constructor(private readonly salesBrain = new SalesBrainService()) {}

  async execute(state: RuntimeState): Promise<RuntimeState> {
    const decision = await this.salesBrain.decide({
      message: state.raiContext.conversation.message,
      context: commercialFactsFrom(state),
      limit: state.request.limit,
      recommendNow: state.request.recommendNow ?? true,
    });
    const next = withRuntimeCommercialFacts(state, decision.analysis.context);
    return {
      ...next,
      decision,
      reply: decision.reply ?? state.reply,
      status: "COMPLETED",
      data: { ...state.data, strategy: decision.strategy },
    };
  }
}

export class RuntimeResponseSkill implements RuntimeSkill {
  readonly id = "runtime-response";
  readonly type = "SKILL" as const;
  readonly contextMode = "RAI_CONTEXT" as const;

  async execute(state: RuntimeState): Promise<RuntimeState> {
    const reply = state.reply
      ?? state.decision?.reply
      ?? state.understanding?.userFacingReply
      ?? "Proceso completado.";
    return { ...state, reply };
  }
}
