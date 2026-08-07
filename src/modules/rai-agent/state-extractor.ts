import type { ResponsesClient } from "./openai-responses.js";

export type RaiStatePatch = {
  recipientName?: string | null;
  recipientRelation?: string | null;
  recipientAge?: number | null;
  occasion?: string | null;
  budget?: number | null;
  interests?: string[] | null;
};

function extractOutputText(response: any): string {
  if (typeof response?.output_text === "string" && response.output_text.trim()) return response.output_text.trim();
  const chunks: string[] = [];
  for (const item of response?.output ?? []) {
    if (item?.type !== "message") continue;
    for (const content of item?.content ?? []) {
      if ((content?.type === "output_text" || content?.type === "text") && typeof content?.text === "string") {
        chunks.push(content.text);
      }
    }
  }
  return chunks.join("\n").trim();
}

const extractionInstructions = `Extrae únicamente datos explícitos del último mensaje del usuario para actualizar el estado de un asesor de regalos.
Comprende español natural, abreviaturas y faltas ortográficas.
No inventes ni completes datos ausentes.

- recipientName: nombre de quien recibe el regalo.
- recipientRelation: relación con el usuario, por ejemplo hermano, hija, amigo o pareja.
- recipientAge: edad del destinatario, no la del usuario.
- occasion: ocasión, normalizada en minúsculas.
- budget: presupuesto máximo o aproximado en euros como número.
- interests: aficiones, gustos o temas explícitos.
Un valor null significa que el mensaje no aporta una actualización para ese campo.
No interpretes nombres de productos como selección. No extraigas selectedProduct.`;

function requestFor(
  model: string,
  message: string,
  currentState: unknown,
  maxOutputTokens: number,
) {
  return {
    model,
    instructions: extractionInstructions,
    input: `ESTADO ACTUAL:\n${JSON.stringify(currentState)}\n\nÚLTIMO MENSAJE:\n${message}`,
    store: false,
    max_output_tokens: maxOutputTokens,
    reasoning: { effort: "minimal" },
    text: {
      verbosity: "low",
      format: {
        type: "json_schema",
        name: "rai_state_patch",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            recipientName: { type: ["string", "null"] },
            recipientRelation: { type: ["string", "null"] },
            recipientAge: { type: ["number", "null"] },
            occasion: { type: ["string", "null"] },
            budget: { type: ["number", "null"] },
            interests: { type: ["array", "null"], items: { type: "string" } },
          },
          required: ["recipientName", "recipientRelation", "recipientAge", "occasion", "budget", "interests"],
        },
      },
    },
  };
}

function parsePatch(raw: string): RaiStatePatch | undefined {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as RaiStatePatch
      : undefined;
  } catch {
    return undefined;
  }
}

export async function extractStatePatch(
  client: ResponsesClient,
  model: string,
  message: string,
  currentState: unknown,
): Promise<{ patch: RaiStatePatch; responseId?: string; usage?: unknown }> {
  let response = await client.create(
    requestFor(model, message, currentState, 700),
  );

  let raw = extractOutputText(response);
  let patch = raw ? parsePatch(raw) : undefined;

  if (!patch) {
    response = await client.create(
      requestFor(model, message, currentState, 1400),
    );

    raw = extractOutputText(response);
    patch = raw ? parsePatch(raw) : undefined;
  }

  return {
    patch: patch ?? {},
    responseId: response.id,
    usage: response.usage,
  };
}
