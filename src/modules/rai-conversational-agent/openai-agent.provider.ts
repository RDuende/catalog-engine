import type { AgentModelProvider, AgentModelRequest, AgentModelTurn } from "./agent.types.js";

interface ResponseBody {
  readonly id?: string;
  readonly model?: string;
  readonly output_text?: string;
  readonly output?: readonly {
    readonly type?: string;
    readonly call_id?: string;
    readonly name?: string;
    readonly arguments?: string;
    readonly content?: readonly { readonly type?: string; readonly text?: string }[];
  }[];
  readonly usage?: { readonly input_tokens?: number; readonly output_tokens?: number; readonly total_tokens?: number };
  readonly error?: { readonly message?: string };
}

function extractText(body: ResponseBody): string {
  if (typeof body.output_text === "string") return body.output_text.trim();
  const chunks: string[] = [];
  for (const item of body.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") chunks.push(content.text);
    }
  }
  return chunks.join("\n").trim();
}

export class OpenAIAgentProvider implements AgentModelProvider {
  constructor(
    private readonly apiKey = process.env.OPENAI_API_KEY,
    private readonly model = process.env.OPENAI_AGENT_MODEL ?? process.env.OPENAI_CONVERSATION_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-5",
    private readonly baseUrl = process.env.OPENAI_API_BASE_URL ?? "https://api.openai.com/v1",
  ) {}

  async createTurn(request: AgentModelRequest): Promise<AgentModelTurn> {
    if (!this.apiKey) throw new Error("Falta OPENAI_API_KEY.");
    const bodyPayload: Record<string, unknown> = {
      model: this.model,
      store: false,
      instructions: request.instructions,
      input: request.input,
      tools: request.tools,
      tool_choice: "auto",
      parallel_tool_calls: false,
      text: { verbosity: "low" },
      reasoning: { effort: "low" },
    };

    const response = await fetch(`${this.baseUrl}/responses`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(bodyPayload),
    });
    const body = await response.json() as ResponseBody;
    if (!response.ok) throw new Error(body.error?.message ?? `OpenAI respondió ${response.status}.`);
    if (!body.id) throw new Error("OpenAI no devolvió response id.");
    const usage = body.usage ?? {};
    return {
      responseId: body.id,
      model: body.model ?? this.model,
      text: extractText(body),
      functionCalls: (body.output ?? []).flatMap((item) => item.type === "function_call" && item.call_id && item.name
        ? [{ type: "function_call" as const, callId: item.call_id, name: item.name, arguments: item.arguments ?? "{}" }]
        : []),
      usage: {
        inputTokens: usage.input_tokens ?? 0,
        outputTokens: usage.output_tokens ?? 0,
        totalTokens: usage.total_tokens ?? ((usage.input_tokens ?? 0) + (usage.output_tokens ?? 0)),
      },
    };
  }
}
