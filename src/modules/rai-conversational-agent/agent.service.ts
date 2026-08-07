import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import { DEFAULT_COMMERCIAL_CONTEXT, type CommercialContext } from "../../core/commercial-context/index.js";
import { conversationalAgentPrompt } from "./agent.prompt.js";
import { agentToolDefinitions, AgentToolExecutor, type AgentToolState } from "./agent.tools.js";
import type { AgentModelProvider, AgentToolCallTrace, ConversationalAgentRequest, ConversationalAgentResult } from "./agent.types.js";
import { OpenAIAgentProvider } from "./openai-agent.provider.js";

export class RaiConversationalAgentService {
  constructor(
    private readonly provider: AgentModelProvider = new OpenAIAgentProvider(),
    private readonly tools = new AgentToolExecutor(),
  ) {}

  status() {
    return {
      agent: "rai-conversational-agent-v2",
      configured: Boolean(process.env.OPENAI_API_KEY),
      model: process.env.OPENAI_AGENT_MODEL ?? process.env.OPENAI_CONVERSATION_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-5",
      tools: agentToolDefinitions.map((tool) => tool.name),
      architecture: "stateless-openai-conversation-with-catalog-tools",
    };
  }

  async chat(request: ConversationalAgentRequest): Promise<ConversationalAgentResult> {
    const startedAt = new Date().toISOString();
    const started = performance.now();
    const agentId = randomUUID();
    const state = {
      context: { ...DEFAULT_COMMERCIAL_CONTEXT, ...(request.context ?? {}) },
      recommendation: undefined,
      patches: [],
    } as AgentToolState;
    const toolCalls: AgentToolCallTrace[] = [];
    let totalInput = 0;
    let totalOutput = 0;
    let totalTokens = 0;
    let model = process.env.OPENAI_AGENT_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-5";

    const history = buildAgentHistory(request.history ?? []);
    const input = [
      ...history,
      { role: "user", content: [{ type: "input_text", text: request.message }] },
    ];
    const instructions = `${conversationalAgentPrompt}\n\nCONTEXTO COMERCIAL VALIDADO ACTUAL:\n${JSON.stringify(compactCommercialContext(state.context))}`;

    try {
      let turn = await this.provider.createTurn({ instructions, input, tools: agentToolDefinitions });
      model = turn.model;
      totalInput += turn.usage.inputTokens; totalOutput += turn.usage.outputTokens; totalTokens += turn.usage.totalTokens;

      for (let iteration = 0; iteration < 6 && turn.functionCalls.length > 0; iteration += 1) {
        const outputs: unknown[] = [];
        for (const call of turn.functionCalls) {
          const args = safeObject(call.arguments);
          const toolStarted = performance.now();
          const result = await this.tools.execute(call.name, args, state);
          toolCalls.push({
            callId: call.callId,
            name: call.name,
            arguments: args,
            durationMs: Number((performance.now() - toolStarted).toFixed(2)),
            resultSummary: summarizeResult(call.name, result),
          });
          outputs.push({ type: "function_call_output", call_id: call.callId, output: JSON.stringify(result) });
        }
        input.push(...serializeFunctionCalls(turn.functionCalls), ...outputs);
        turn = await this.provider.createTurn({
          instructions,
          input,
          tools: agentToolDefinitions,
        });
        model = turn.model;
        totalInput += turn.usage.inputTokens; totalOutput += turn.usage.outputTokens; totalTokens += turn.usage.totalTokens;
      }

      const reply = turn.text.trim() || "He procesado la información, pero necesito que me cuentes un poco más para ayudarte bien.";
      return {
        agentId,
        status: "COMPLETED",
        reply,
        context: state.context,
        recommendation: state.recommendation,
        toolCalls,
        patches: state.patches,
        model,
        usage: { inputTokens: totalInput, outputTokens: totalOutput, totalTokens },
        durationMs: Number((performance.now() - started).toFixed(2)),
        startedAt,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        agentId,
        status: "FAILED",
        reply: `Ahora mismo no he podido completar la consulta: ${message}`,
        context: state.context,
        recommendation: state.recommendation,
        toolCalls,
        patches: state.patches,
        model,
        usage: { inputTokens: totalInput, outputTokens: totalOutput, totalTokens },
        durationMs: Number((performance.now() - started).toFixed(2)),
        startedAt,
      };
    }
  }
}

export function serializeFunctionCalls(calls: readonly { readonly callId: string; readonly name: string; readonly arguments: string }[]): unknown[] {
  return calls.map((call) => ({
    type: "function_call",
    call_id: call.callId,
    name: call.name,
    arguments: call.arguments,
  }));
}

function safeObject(value: string): Readonly<Record<string, unknown>> {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Readonly<Record<string, unknown>> : {};
  } catch { return {}; }
}

function summarizeResult(name: string, result: unknown): string {
  if (!result || typeof result !== "object") return `${name}: completada`;
  const object = result as Record<string, unknown>;
  if (name === "search_products") {
    return `${typeof object.resultCount === "number" ? object.resultCount : 0} productos encontrados`;
  }
  if (name === "update_commercial_context") return `${Array.isArray(object.applied) ? object.applied.length : 0} cambios aplicados`;
  if (name === "get_commercial_state") return object.readyToRecommend ? "contexto listo para recomendar" : "contexto incompleto";
  return `${name}: completada`;
}

export function buildAgentHistory(history: readonly { readonly role: "user" | "assistant"; readonly content: string }[]): unknown[] {
  return history.slice(-4).map((message) => ({
    role: message.role,
    content: [{
      type: message.role === "assistant" ? "output_text" : "input_text",
      text: message.content.slice(0, 600),
    }],
  }));
}

function compactCommercialContext(context: CommercialContext): Record<string, unknown> {
  const allowed: readonly (keyof CommercialContext)[] = [
    "need", "businessGoal", "audience", "quantity", "budget", "currency",
    "sector", "campaign", "sustainability", "personalizationRequested",
    "deadline", "profile", "selectedProductId", "customerType", "giftDiscoveryMode",
    "recipientRelationship", "recipientAge", "recipientInterests", "recipientDislikes",
    "recipientPersonality", "occasion", "intendedUse", "conversationState",
  ];
  return Object.fromEntries(
    allowed.flatMap((key) => context[key] === undefined ? [] : [[key, context[key]]]),
  );
}
