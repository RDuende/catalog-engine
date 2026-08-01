import { AIGatewayService } from "../ai-gateway/ai-gateway.service.js";
import type { ConversationPatch } from "../ai-gateway/ai-gateway.types.js";
import { mergeCommercialContext } from "../../core/commercial-context/index.js";
import { SalesBrainService } from "../sales-brain/sales-brain.service.js";
import type { SalesBrainContext } from "../sales-brain/sales-brain.types.js";
import type { RuntimeSkill, RuntimeState, RuntimeTool } from "./runtime.types.js";

const required = ["need", "quantity", "budget", "sustainability", "customizable"] as const;

function applyPatches(current: SalesBrainContext, patches: readonly ConversationPatch[]): SalesBrainContext {
  return mergeCommercialContext(current, patches).context;
}

function incomplete(context: SalesBrainContext): boolean {
  return required.some((field) => context[field] === undefined || context[field] === "");
}

export class ConversationUnderstandingSkill implements RuntimeSkill {
  readonly id = "conversation-understanding";
  readonly type = "SKILL" as const;

  constructor(private readonly ai = new AIGatewayService()) {}

  async execute(state: RuntimeState): Promise<RuntimeState> {
    const result = await this.ai.understandConversation({ message: state.request.message, context: state.context });
    const context = applyPatches(state.context, result.data.patches);
    return {
      ...state,
      context,
      understanding: result.data,
      aiTrace: result.trace,
      reply: result.data.userFacingReply,
      data: { ...state.data, conversationFallbackUsed: result.fallbackUsed },
    };
  }
}

export class RequirementGateTool implements RuntimeTool {
  readonly id = "requirement-gate";
  readonly type = "TOOL" as const;

  async execute(state: RuntimeState): Promise<RuntimeState> {
    if (!incomplete(state.context)) return state;
    const reply = state.understanding?.nextQuestion ?? state.reply ?? "Necesito algún dato más antes de continuar.";
    return { ...state, reply, stop: true, status: "WAITING_FOR_USER" };
  }
}

export class SalesBrainTool implements RuntimeTool {
  readonly id = "sales-brain";
  readonly type = "TOOL" as const;

  constructor(private readonly salesBrain = new SalesBrainService()) {}

  async execute(state: RuntimeState): Promise<RuntimeState> {
    const decision = await this.salesBrain.decide({
      message: state.request.message,
      context: state.context,
      limit: state.request.limit,
      recommendNow: state.request.recommendNow ?? true,
    });
    return {
      ...state,
      context: decision.analysis.context,
      decision,
      reply: decision.reply ?? state.reply,
      status: "COMPLETED",
    };
  }
}
