import { randomUUID } from "node:crypto";
import { IntentEngine } from "../intent/index.js";
import type { ParsedIntent } from "../intent/model.js";
import type { ConversationField, ConversationReply, ConversationState, ConversationTurn } from "./model.js";

const FOLLOW_UPS: Record<ConversationField, string> = {
  recipient: "¿Para quién es el regalo?",
  occasion: "¿Para qué ocasión lo necesitas?",
  budget: "¿Qué presupuesto aproximado tienes?",
  personalization: "¿Quieres incluir una foto, su nombre o una dedicatoria?",
};

export class ConversationEngine {
  private readonly sessions = new Map<string, ConversationState>();

  constructor(private readonly intentEngine = new IntentEngine()) {}

  continue(message: string, sessionId?: string): ConversationReply {
    const id = sessionId?.trim() || randomUUID();
    const previous = this.sessions.get(id);
    const analysis = this.intentEngine.analyze(message);
    const contextualIntent = applyShortAnswerContext(analysis.intent, message, previous?.missingFields[0]);
    const mergedIntent = mergeIntent(previous?.mergedIntent, contextualIntent, message);
    const missingFields = findMissingFields(mergedIntent);
    const userTurn: ConversationTurn = { role: "user", text: message, createdAt: new Date().toISOString() };
    const nextQuestion = buildFollowUp(missingFields, mergedIntent);
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
    recipientAge: current.recipientAge ?? previous?.recipientAge,
    audienceSegment: current.audienceSegment ?? previous?.audienceSegment,
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

function buildFollowUp(missing: ConversationField[], intent: ParsedIntent): string | undefined {
  if (!missing.length) return undefined;
  if (missing.includes("recipient")) return FOLLOW_UPS.recipient;

  const questions: string[] = [];
  if (missing.includes("occasion")) questions.push("¿Es para un cumpleaños o para otra ocasión?");
  if (missing.includes("budget")) questions.push("¿Qué presupuesto tienes aproximadamente?");
  if (missing.includes("personalization")) questions.push("¿Quieres añadir una foto, su nombre o una dedicatoria?");

  const intro = intent.recipient
    ? `Perfecto, ya sé que es para ${recipientLabel(intent.recipient)}${intent.recipientAge !== undefined ? ` de ${intent.recipientAge} años` : ""}.`
    : "Perfecto.";
  return `${intro} Solo necesito saber: ${questions.join(" ")}`;
}

function recipientLabel(recipient: string): string {
  return `tu ${recipient}`;
}

function applyShortAnswerContext(intent: ParsedIntent, message: string, expected?: ConversationField): ParsedIntent {
  const normalized = message.trim().toLocaleLowerCase("es-ES");
  if (expected !== "personalization" || intent.personalization !== undefined) return intent;
  if (/^(si|sí|claro|vale|por supuesto|perfecto)$/.test(normalized)) return { ...intent, personalization: true };
  if (/^(?:una?|unas?|el|la|los|las|su|sus)?\s*(?:foto(?:s|grafía|grafías)?|imagen(?:es)?|nombre(?:s)?|logo(?:s)?|dedicatoria(?:s)?|frase(?:s)?|texto(?:s)?|mensaje(?:s)?|inscripción|inscripciones)$/.test(normalized)) {
    return { ...intent, personalization: true };
  }
  if (/^(?:si|sí|claro|vale|perfecto)[,\s]+(?:una?|unas?|el|la|los|las|su|sus)?\s*(?:foto(?:s|grafía|grafías)?|imagen(?:es)?|nombre(?:s)?|logo(?:s)?|dedicatoria(?:s)?|frase(?:s)?|texto(?:s)?|mensaje(?:s)?)$/.test(normalized)) {
    return { ...intent, personalization: true };
  }
  if (/^(?:las tres|todo|todas)(?: las cosas)?$/.test(normalized)) return { ...intent, personalization: true };
  if (/^(no|ninguna|ninguno|sin personalizar|nada)$/.test(normalized)) return { ...intent, personalization: false };
  return intent;
}
