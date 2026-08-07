import { randomUUID } from "node:crypto";
import type { AITrace, StructuredAIResult } from "../../modules/ai-gateway/ai-gateway.types.js";
import type { CommercialContext, CommercialContextField, ContextPatch } from "../../core/commercial-context/index.js";
import type { ConversationExtractRequest, ConversationUnderstanding } from "./conversation.types.js";

const GREETING = /^(hola|buenas|buenos\s+d[ií]as|buenas\s+tardes|buenas\s+noches|hey|ey)(\s+rai)?[!¡?.\s]*$/i;
const THANKS = /^(gracias|muchas\s+gracias|perfecto|genial|estupendo|vale|ok|de\s+acuerdo)[!¡?.\s]*$/i;
const GOODBYE = /^(adi[oó]s|hasta\s+luego|nos\s+vemos|chao|ciao)[!¡?.\s]*$/i;
const YES = /^(s[ií]|claro|correcto|afirmativo|por\s+supuesto)[!¡?.\s]*$/i;
const NO = /^(no|negativo|para\s+nada)[!¡?.\s]*$/i;
const NUMBER_ONLY = /^\s*(\d{1,7})(?:[.,](\d{1,2}))?\s*(€|eur|euros?|uds?|unidades?)?\s*$/i;

export function fastConversationUnderstanding(
  request: ConversationExtractRequest,
): StructuredAIResult<ConversationUnderstanding> | null {
  const startedAt = new Date().toISOString();
  const started = performance.now();
  const message = request.message.trim();
  const context = request.context ?? {};
  let understanding: ConversationUnderstanding | null = null;

  if (GREETING.test(message)) {
    understanding = response("GREETING", [], "¡Hola! Cuéntame qué regalo, campaña o trabajo necesitas preparar.", "¿Qué necesidad comercial quieres resolver?", ["need"], 1);
  } else if (THANKS.test(message)) {
    understanding = response("CONFIRM", [], "Perfecto. Seguimos cuando quieras.", null, missingRequired(context), 0.99);
  } else if (GOODBYE.test(message)) {
    understanding = response("OTHER", [], "Hasta luego. He conservado el contexto de esta conversación.", null, missingRequired(context), 0.99);
  } else {
    const number = NUMBER_ONLY.exec(message);
    if (number) understanding = understandNumber(number, context);
    if (!understanding && (YES.test(message) || NO.test(message))) understanding = understandBoolean(YES.test(message), context);
  }

  if (!understanding) return null;
  return {
    data: understanding,
    trace: createFastTrace(startedAt, performance.now() - started),
    fallbackUsed: false,
  };
}

function understandNumber(match: RegExpExecArray, context: CommercialContext): ConversationUnderstanding | null {
  const integer = Number(match[1]);
  const decimals = match[2] ? Number(`0.${match[2]}`) : 0;
  const value = integer + decimals;
  const unit = (match[3] ?? "").toLocaleLowerCase("es-ES");
  const explicitMoney = unit === "€" || unit === "eur" || unit.startsWith("euro");
  const explicitQuantity = unit.startsWith("ud") || unit.startsWith("unidad");

  let field: "quantity" | "budget" | null = null;
  if (explicitMoney) field = "budget";
  else if (explicitQuantity) field = "quantity";
  else if (context.quantity == null) field = "quantity";
  else if (context.budget == null) field = "budget";
  if (!field) return null;

  const normalizedValue = field === "quantity" ? Math.max(1, Math.round(value)) : value;
  const patch: ContextPatch = {
    field,
    operation: "SET",
    value: normalizedValue,
    confidence: 0.995,
    evidence: match[0].trim(),
  };
  const next = field === "quantity"
    ? "¿Qué presupuesto máximo tienes por unidad?"
    : context.customizable == null ? "¿Los productos deben ir personalizados?" : null;
  const reply = field === "quantity"
    ? `Anoto ${normalizedValue} unidades.${next ? ` ${next}` : ""}`
    : `Anoto un presupuesto máximo de ${normalizedValue.toLocaleString("es-ES")} € por unidad.${next ? ` ${next}` : ""}`;
  return response("CORRECT", [patch], reply, next, missingRequired({ ...context, [field]: normalizedValue }), 0.995);
}

function understandBoolean(value: boolean, context: CommercialContext): ConversationUnderstanding | null {
  const field = nextBooleanField(context);
  if (!field) return null;
  const patch: ContextPatch = {
    field,
    operation: "SET",
    value,
    confidence: 0.995,
    evidence: value ? "sí" : "no",
  };
  const label = field === "customizable" ? "personalización" : "sostenibilidad";
  const reply = `Perfecto, dejo ${label} como ${value ? "sí" : "no"}.`;
  return response("CONFIRM", [patch], reply, null, missingRequired({ ...context, [field]: value }), 0.995);
}

function nextBooleanField(context: CommercialContext): "customizable" | "sustainability" | null {
  if (context.need != null && context.quantity != null && context.budget != null && context.customizable == null) return "customizable";
  if (context.sustainability == null && context.customizable != null) return "sustainability";
  return null;
}

function missingRequired(context: CommercialContext): CommercialContextField[] {
  const fields: CommercialContextField[] = [];
  if (!context.need?.trim()) fields.push("need");
  if (context.quantity == null) fields.push("quantity");
  if (context.budget == null) fields.push("budget");
  if (context.customizable == null) fields.push("customizable");
  return fields;
}

function response(
  intent: ConversationUnderstanding["intent"],
  patches: readonly ContextPatch[],
  userFacingReply: string,
  nextQuestion: string | null,
  missingFields: readonly CommercialContextField[],
  confidence: number,
): ConversationUnderstanding {
  return { intent, patches, missingFields, nextQuestion, userFacingReply, confidence };
}

function createFastTrace(startedAt: string, durationMs: number): AITrace {
  return {
    traceId: randomUUID(),
    provider: "mock",
    model: "fast-conversation-v1",
    skill: "fast-conversation-v1",
    startedAt,
    durationMs: Number(durationMs.toFixed(2)),
    usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
  };
}
