import type { ConversationUnderstanding } from "./conversation.types.js";

export function deterministicConversationFallback(message: string): ConversationUnderstanding {
  const normalized = message.trim().toLocaleLowerCase("es-ES");
  const greeting = /^(hola|buenas|buenos dias|buenos días|buenas tardes|hey)(\s+rai)?[!.\s]*$/.test(normalized);
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
    userFacingReply: "Necesito concretar un poco más la necesidad comercial.",
    confidence: 0.35,
  };
}
