import { randomUUID } from "node:crypto";
import type { AIProvider, AITrace, StructuredAIRequest, StructuredAIResult } from "./ai-gateway.types.js";

interface OpenAIResponseBody {
  readonly id?: string;
  readonly model?: string;
  readonly output_text?: string;
  readonly output?: readonly {
    readonly content?: readonly { readonly type?: string; readonly text?: string }[];
  }[];
  readonly usage?: {
    readonly input_tokens?: number;
    readonly output_tokens?: number;
    readonly total_tokens?: number;
  };
  readonly error?: { readonly message?: string };
}

function extractText(body: OpenAIResponseBody): string {
  if (typeof body.output_text === "string" && body.output_text.trim()) return body.output_text;
  for (const item of body.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }
  throw new Error("OpenAI no devolvió contenido estructurado.");
}

export class OpenAIProvider implements AIProvider {
  readonly name = "openai" as const;

  constructor(
    private readonly apiKey = process.env.OPENAI_API_KEY,
    private readonly model = process.env.OPENAI_MODEL ?? "gpt-5-mini",
    private readonly baseUrl = process.env.OPENAI_API_BASE_URL ?? "https://api.openai.com/v1",
  ) {}

  async structured<T>(request: StructuredAIRequest<T>): Promise<StructuredAIResult<T>> {
    if (!this.apiKey) throw new Error("Falta OPENAI_API_KEY.");
    const started = performance.now();
    const startedAt = new Date().toISOString();
    const response = await fetch(`${this.baseUrl}/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        store: false,
        input: [
          { role: "system", content: [{ type: "input_text", text: request.system }] },
          { role: "user", content: [{ type: "input_text", text: request.input }] },
        ],
        text: {
          format: {
            type: "json_schema",
            name: request.schemaName,
            strict: true,
            schema: request.schema,
          },
          verbosity: "low",
        },
      }),
    });

    const requestId = response.headers.get("x-request-id") ?? undefined;
    const body = await response.json() as OpenAIResponseBody;
    if (!response.ok) throw new Error(body.error?.message ?? `OpenAI respondió ${response.status}.`);
    const data = JSON.parse(extractText(body)) as T;
    const usage = body.usage ?? {};
    const trace: AITrace = {
      traceId: randomUUID(),
      provider: this.name,
      model: body.model ?? this.model,
      skill: request.skill,
      startedAt,
      durationMs: Number((performance.now() - started).toFixed(2)),
      usage: {
        inputTokens: usage.input_tokens ?? 0,
        outputTokens: usage.output_tokens ?? 0,
        totalTokens: usage.total_tokens ?? ((usage.input_tokens ?? 0) + (usage.output_tokens ?? 0)),
      },
      ...(requestId ? { requestId } : {}),
    };
    return { data, trace, fallbackUsed: false };
  }
}
