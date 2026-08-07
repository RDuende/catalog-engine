import { LocalRaiDiscoveryConverser, type RaiDiscoveryConverser, type RaiDiscoveryConverserInput } from "./rai-discovery-converser.js";

interface OpenAIResponsesPayload {
  readonly output?: readonly {
    readonly content?: readonly {
      readonly type?: string;
      readonly text?: string;
    }[];
  }[];
}

export interface OpenAIRaiDiscoveryConverserOptions {
  readonly apiKey: string;
  readonly model?: string;
  readonly baseUrl?: string;
  readonly fetchImpl?: typeof fetch;
}

const SYSTEM_PROMPT = `Eres Rai, el asistente conversacional de RecuerdArte.
Tu objetivo es conocer mejor el regalo sin convertir la conversación en un formulario.
Usa el historial y la ficha estructurada que te entrega el sistema.
No repitas preguntas ya respondidas. Haz como máximo una pregunta breve por turno.
Prioriza destinatario, relación, edad aproximada, ocasión, intereses, personalidad,
mensaje emocional, presupuesto, fecha y material disponible, pero no es obligatorio
obtenerlo todo. El usuario puede pulsar «Mostrar propuestas» en cualquier momento.
No inventes datos, precios, productos ni cantidades. Devuelve solamente el texto que
Rai debe mostrar al usuario.`;

export class OpenAIRaiDiscoveryConverser implements RaiDiscoveryConverser {
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: OpenAIRaiDiscoveryConverserOptions) {
    this.model = options.model ?? "gpt-5.6";
    this.baseUrl = options.baseUrl ?? "https://api.openai.com/v1";
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async reply(input: RaiDiscoveryConverserInput): Promise<string> {
    const profile = input.journey.facts
      .filter((fact) => fact.key !== "conversation.pending_fact")
      .map((fact) => ({ key: fact.key, value: fact.value, confidence: fact.confidence }));
    const history = input.history.slice(-16).map((message) => ({ role: message.role, text: message.text }));

    const response = await this.fetchImpl(`${this.baseUrl}/responses`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.options.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        input: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: JSON.stringify({
              latestUserMessage: input.userMessage,
              history,
              giftProfile: profile,
              missingRequired: input.engineResult.missingRequired,
              engineSuggestedQuestion: input.engineResult.nextQuestion,
              canShowProposals: true,
            }),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "rai_discovery_reply",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: { reply: { type: "string", minLength: 1 } },
              required: ["reply"],
            },
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI discovery responder failed with HTTP ${response.status}.`);
    }
    const payload = await response.json() as OpenAIResponsesPayload;
    const text = payload.output
      ?.flatMap((item) => item.content ?? [])
      .find((content) => content.type === "output_text" && typeof content.text === "string")
      ?.text;
    if (!text) throw new Error("OpenAI discovery responder returned no output text.");
    const parsed = JSON.parse(text) as { reply?: unknown };
    if (typeof parsed.reply !== "string" || !parsed.reply.trim()) {
      throw new Error("OpenAI discovery responder returned an invalid reply.");
    }
    return parsed.reply.trim();
  }
}

export function createConfiguredRaiDiscoveryConverser(): RaiDiscoveryConverser {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return new LocalRaiDiscoveryConverser();
  return new OpenAIRaiDiscoveryConverser({
    apiKey,
    model: process.env.RAI_DISCOVERY_MODEL?.trim() || undefined,
    baseUrl: process.env.OPENAI_BASE_URL?.trim() || undefined,
  });
}
