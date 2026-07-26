import { randomUUID } from "node:crypto";
import { IntentEngine } from "../intent/index.js";
import type { ParsedIntent } from "../intent/model.js";
import type { ConversationField, ConversationReply, ConversationState, ConversationTurn } from "./model.js";

const FOLLOW_UPS: Record<ConversationField, string> = {
  recipient: "¿Para quién es el regalo?",
  occasion: "¿Para qué ocasión lo necesitas?",
  budget: "¿Qué presupuesto aproximado tienes?",
  personalization: "¿Quieres incluir fotos, nombres o una dedicatoria?",
};

export class ConversationEngine {
  private readonly sessions = new Map<string, ConversationState>();

  constructor(private readonly intentEngine = new IntentEngine()) {}

  continue(message: string, sessionId?: string): ConversationReply {
    const id = sessionId?.trim() || randomUUID();
    const previous = this.sessions.get(id);
    const analysis = this.intentEngine.analyze(message);
    const mergedIntent = mergeIntent(previous?.mergedIntent, analysis.intent, message);
    const missingFields = findMissingFields(mergedIntent);
    const userTurn: ConversationTurn = { role: "user", text: message, createdAt: new Date().toISOString() };
    const nextQuestion = missingFields[0] ? FOLLOW_UPS[missingFields[0]] : undefined;
    const assistantTurn: ConversationTurn | undefined = nextQuestion
      ? { role: "assistant", text: nextQuestion, createdAt: new Date().toISOString() }
      : undefined;
    const state: ConversationState = {
      sessionId: id,
      turns: [...(previous?.turns ?? []), userTurn, ...(assistantTurn ? [assistantTurn] : [])],
      mergedIntent,
      missingFields,
      updatedAt: new Date().toISOString(),
    };
    this.sessions.set(id, state);
    return { session: state, nextQuestion, readyForIdeas: missingFields.length === 0 };
  }

  get(sessionId: string): ConversationState | undefined { return this.sessions.get(sessionId); }
  clear(sessionId: string): boolean { return this.sessions.delete(sessionId); }
}

function mergeIntent(previous: ParsedIntent | undefined, current: ParsedIntent, rawText: string): ParsedIntent {
  return {
    ...current,
    rawText: previous ? `${previous.rawText} ${rawText}`.trim() : rawText,
    normalizedText: [previous?.normalizedText, current.normalizedText].filter(Boolean).join(" "),
    recipient: current.recipient ?? previous?.recipient,
    occasion: current.occasion ?? previous?.occasion,
    minPriceMinor: current.minPriceMinor ?? previous?.minPriceMinor,
    maxPriceMinor: current.maxPriceMinor ?? previous?.maxPriceMinor,
    quantity: current.quantity ?? previous?.quantity,
    personalization: current.personalization ?? previous?.personalization,
    priority: current.priority === "high" ? "high" : (previous?.priority ?? current.priority),
    attributes: mergeAttributes(previous?.attributes, current.attributes),
    terms: [...new Set([...(previous?.terms ?? []), ...current.terms])],
    confidence: Math.max(previous?.confidence ?? 0, current.confidence),
    warnings: [...new Set([...(previous?.warnings ?? []), ...current.warnings])],
  };
}

function mergeAttributes(a: ParsedIntent["attributes"] | undefined, b: ParsedIntent["attributes"]): ParsedIntent["attributes"] {
  const result = { ...(a ?? {}) } as Record<string, string[]>;
  for (const [key, values] of Object.entries(b)) {
    if (!values?.length) continue;
    result[key] = [...new Set([...(result[key] ?? []), ...values])];
  }
  return result as ParsedIntent["attributes"];
}

function findMissingFields(intent: ParsedIntent): ConversationField[] {
  const missing: ConversationField[] = [];
  if (!intent.recipient) missing.push("recipient");
  if (!intent.occasion) missing.push("occasion");
  if (intent.maxPriceMinor === undefined) missing.push("budget");
  if (intent.personalization === undefined) missing.push("personalization");
  return missing;
}
