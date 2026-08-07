import type { CommercialContextField, ContextPatch } from "../../core/commercial-context/index.js";
import { deterministicConversationFallback } from "./conversation.fallback.js";
import type { ConversationExtractRequest, ConversationIntent, ConversationUnderstanding, ConversationValidationResult } from "./conversation.types.js";

const intents = new Set<ConversationIntent>(["GREETING", "DISCOVER", "RECOMMEND", "COMPARE", "PROPOSAL", "CORRECT", "CONFIRM", "OTHER"]);
const fields = new Set<CommercialContextField>([
  "need", "businessGoal", "audience", "quantity", "budget", "currency", "sector", "campaign", "sustainability",
  "customizable", "deadline", "providerKey", "profile", "selectedProductId",
]);

export function validateConversationUnderstanding(
  candidate: unknown,
  request: ConversationExtractRequest,
): ConversationValidationResult {
  const fallback = deterministicConversationFallback(request.message);
  const issues: string[] = [];
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return { valid: false, value: fallback, issues: ["La salida no es un objeto."] };
  }

  const raw = candidate as Record<string, unknown>;
  const intent = typeof raw.intent === "string" && intents.has(raw.intent as ConversationIntent)
    ? raw.intent as ConversationIntent
    : fallback.intent;
  if (intent === fallback.intent && raw.intent !== fallback.intent) issues.push("Intent no válido.");

  const patches: ContextPatch[] = [];
  if (!Array.isArray(raw.patches)) {
    issues.push("patches no es un array.");
  } else {
    raw.patches.forEach((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        issues.push(`patches[${index}] no es un objeto.`);
        return;
      }
      const patch = item as Record<string, unknown>;
      if (typeof patch.field !== "string" || !fields.has(patch.field as CommercialContextField)) {
        issues.push(`patches[${index}].field no es válido.`);
        return;
      }
      if (patch.operation !== "SET" && patch.operation !== "UNSET") {
        issues.push(`patches[${index}].operation no es válida.`);
        return;
      }
      const confidence = typeof patch.confidence === "number" && Number.isFinite(patch.confidence)
        ? Math.max(0, Math.min(1, patch.confidence))
        : undefined;
      patches.push({
        field: patch.field as CommercialContextField,
        operation: patch.operation,
        value: patch.operation === "UNSET" ? null : normalizeScalar(patch.value),
        ...(confidence !== undefined ? { confidence } : {}),
        ...(typeof patch.evidence === "string" ? { evidence: patch.evidence.slice(0, 240) } : {}),
      });
    });
  }

  const missingFields = Array.isArray(raw.missingFields)
    ? raw.missingFields.filter((field): field is CommercialContextField => typeof field === "string" && fields.has(field as CommercialContextField))
    : fallback.missingFields;
  if (!Array.isArray(raw.missingFields)) issues.push("missingFields no es un array.");

  const confidence = typeof raw.confidence === "number" && Number.isFinite(raw.confidence)
    ? Math.max(0, Math.min(1, raw.confidence))
    : fallback.confidence;
  if (confidence === fallback.confidence && raw.confidence !== fallback.confidence) issues.push("confidence no es válido.");

  const nextQuestion = raw.nextQuestion === null || typeof raw.nextQuestion === "string"
    ? raw.nextQuestion
    : fallback.nextQuestion;
  const userFacingReply = typeof raw.userFacingReply === "string" && raw.userFacingReply.trim()
    ? raw.userFacingReply.trim()
    : fallback.userFacingReply;

  const value: ConversationUnderstanding = {
    intent,
    patches,
    missingFields,
    nextQuestion,
    userFacingReply,
    confidence,
  };
  return { valid: issues.length === 0, value, issues };
}

function normalizeScalar(value: unknown): string | number | boolean | null {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) return value;
  return null;
}
