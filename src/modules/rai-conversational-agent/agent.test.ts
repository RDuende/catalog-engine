import assert from "node:assert/strict";
import test from "node:test";
import type { AgentModelProvider, AgentModelRequest, AgentModelTurn } from "./agent.types.js";
import { buildAgentHistory, RaiConversationalAgentService, serializeFunctionCalls } from "./agent.service.js";

class ScriptedProvider implements AgentModelProvider {
  private index = 0;
  constructor(private readonly turns: AgentModelTurn[]) {}
  async createTurn(_request: AgentModelRequest): Promise<AgentModelTurn> { return this.turns[this.index++]!; }
}

class FakeTools {
  async execute(name: string, args: Readonly<Record<string, unknown>>, state: any): Promise<unknown> {
    if (name === "update_commercial_context") {
      state.context = { ...state.context, need: "regalo para una tía y dos bebés", quantity: 3 };
      state.patches.push(...(args.patches as unknown[]));
      return { valid: true, context: state.context };
    }
    return { context: state.context, readyToRecommend: false, missingRequired: ["budget"] };
  }
}

test("GPT mantiene la conversación y usa herramientas sin respuestas guionizadas", async () => {
  const provider = new ScriptedProvider([
    { responseId: "r1", model: "gpt-test", text: "", functionCalls: [{ type: "function_call", callId: "c1", name: "update_commercial_context", arguments: JSON.stringify({ patches: [{ field: "need", operation: "SET", value: "regalo", confidence: 0.9, evidence: "mensaje" }] }) }], usage: { inputTokens: 10, outputTokens: 4, totalTokens: 14 } },
    { responseId: "r2", model: "gpt-test", text: "¡Qué alegría! ¿Tienes un presupuesto aproximado para cada detalle?", functionCalls: [], usage: { inputTokens: 8, outputTokens: 12, totalTokens: 20 } },
  ]);
  const service = new RaiConversationalAgentService(provider, new FakeTools() as any);
  const result = await service.chat({ message: "Mi tía acaba de tener gemelos" });
  assert.equal(result.status, "COMPLETED");
  assert.match(result.reply, /Qué alegría/);
  assert.equal(result.toolCalls.length, 1);
  assert.equal(result.context.quantity, 3);
});


test("serializa el historial con tipos válidos para Responses API", () => {
  const history = buildAgentHistory([
    { role: "user", content: "hola" },
    { role: "assistant", content: "¡Hola! ¿Cómo puedo ayudarte?" },
  ]) as Array<{ role: string; content: Array<{ type: string; text: string }> }>;
  assert.equal(history[0]?.content[0]?.type, "input_text");
  assert.equal(history[1]?.content[0]?.type, "output_text");
});

test("el prompt no convierte el saludo en un menú comercial", async () => {
  let captured: AgentModelRequest | undefined;
  const provider: AgentModelProvider = {
    async createTurn(request) {
      captured = request;
      return { responseId: "r1", model: "gpt-test", text: "¡Hola! Cuéntame, ¿en qué puedo ayudarte?", functionCalls: [], usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } };
    },
  };
  const result = await new RaiConversationalAgentService(provider, new FakeTools() as any).chat({ message: "hola" });
  assert.equal(result.status, "COMPLETED");
  assert.match(result.reply, /Hola/);
  assert.match(String(captured?.instructions), /No presentes un menú/);
});


test("continúa tool calling sin previous_response_id y con estado local", async () => {
  const requests: AgentModelRequest[] = [];
  const provider: AgentModelProvider = {
    async createTurn(request) {
      requests.push(request);
      if (requests.length === 1) {
        return { responseId: "r1", model: "gpt-test", text: "", functionCalls: [{ type: "function_call", callId: "c1", name: "update_commercial_context", arguments: JSON.stringify({ patches: [{ field: "need", operation: "SET", value: "regalo", confidence: 0.9, evidence: "mensaje" }] }) }], usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } };
      }
      return { responseId: "r2", model: "gpt-test", text: "Respuesta humana", functionCalls: [], usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } };
    },
  };
  const result = await new RaiConversationalAgentService(provider, new FakeTools() as any).chat({ message: "Necesito un regalo" });
  assert.equal(result.status, "COMPLETED");
  assert.equal(requests.length, 2);
  assert.equal("previousResponseId" in requests[1]!, false);
  const continuation = requests[1]!.input as Array<{ type?: string }>;
  assert.ok(continuation.some((item) => item.type === "function_call"));
  assert.ok(continuation.some((item) => item.type === "function_call_output"));
});

test("serializa llamadas de herramienta para una continuación autocontenida", () => {
  const serialized = serializeFunctionCalls([{ callId: "c1", name: "update_commercial_context", arguments: "{\"patches\":[]}" }]) as Array<Record<string, unknown>>;
  assert.deepEqual(serialized[0], { type: "function_call", call_id: "c1", name: "update_commercial_context", arguments: "{\"patches\":[]}" });
});
