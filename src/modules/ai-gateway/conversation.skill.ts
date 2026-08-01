import type { ConversationUnderstanding } from "./ai-gateway.types.js";

export const conversationSystemPrompt = `Eres el módulo de comprensión conversacional de Rai, un asistente comercial de regalos promocionales y artes gráficas.
Tu única tarea es interpretar el mensaje y devolver datos estructurados. No busques productos, no calcules precios y no inventes información.
Distingue una necesidad comercial de un producto concreto. "Un regalo de empresa para clientes por Navidad" ya es una necesidad válida.
Interpreta respuestas cortas usando el contexto anterior. Registra correcciones como SET o UNSET. La evidencia debe ser una cita breve del mensaje del usuario.
Los campos mínimos para recomendar son: need, quantity, budget, sustainability y customizable. businessGoal, audience, sector, campaign y deadline son útiles pero no deben bloquear una recomendación si el usuario no los conoce.
En missingFields incluye solo los campos mínimos que todavía falten. Reconoce PROPOSAL cuando el usuario pide preparar, generar, calcular o cotizar una propuesta o presupuesto.
Formula como máximo una pregunta siguiente, natural y útil, priorizando: need, quantity, budget, sustainability y customizable.
userFacingReply debe ser la respuesta natural que Rai mostrará al usuario. Si falta un dato, debe contener la pregunta siguiente. Si el contexto ya está completo, confirma brevemente que vas a buscar opciones. Un saludo no es una consulta de catálogo.`;

export const conversationSchema = {
  type: "object",
  additionalProperties: false,
  required: ["intent", "patches", "missingFields", "nextQuestion", "userFacingReply", "confidence"],
  properties: {
    intent: { type: "string", enum: ["GREETING", "DISCOVER", "RECOMMEND", "COMPARE", "PROPOSAL", "CORRECT", "CONFIRM", "OTHER"] },
    patches: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["field", "operation", "value", "confidence", "evidence"],
        properties: {
          field: { type: "string", enum: ["need", "businessGoal", "audience", "quantity", "budget", "currency", "sector", "campaign", "sustainability", "customizable", "deadline"] },
          operation: { type: "string", enum: ["SET", "UNSET"] },
          value: { anyOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }, { type: "null" }] },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          evidence: { type: "string" },
        },
      },
    },
    missingFields: { type: "array", items: { type: "string", enum: ["need", "businessGoal", "audience", "quantity", "budget", "currency", "sector", "campaign", "sustainability", "customizable", "deadline"] } },
    nextQuestion: { anyOf: [{ type: "string" }, { type: "null" }] },
    userFacingReply: { type: "string" },
    confidence: { type: "number", minimum: 0, maximum: 1 },
  },
} as const;

export function deterministicFallback(message: string): ConversationUnderstanding {
  const normalized = message.trim().toLocaleLowerCase("es-ES");
  const greeting = /^(hola|buenas|buenos dias|buenas tardes|hey)(\s+rai)?[!.\s]*$/.test(normalized);
  if (greeting) {
    return {
      intent: "GREETING",
      patches: [],
      missingFields: ["need"],
      nextQuestion: "¿Qué necesidad comercial quieres resolver?",
      userFacingReply: "¡Hola! Cuéntame qué regalo, campaña o trabajo necesitas preparar.",
      confidence: 0.99,
    };
  }
  return {
    intent: "DISCOVER",
    patches: [],
    missingFields: ["need"],
    nextQuestion: "¿Qué necesitas preparar y para quién?",
    userFacingReply: "He entendido el mensaje, pero necesito concretar la necesidad comercial.",
    confidence: 0.35,
  };
}
