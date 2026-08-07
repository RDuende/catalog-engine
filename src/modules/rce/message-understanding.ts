import type { RceUnderstanding } from "./contracts.js";
import { normalizeText } from "./normalize.js";

export function understandMessage(text: string): RceUnderstanding {
  const normalized = normalizeText(text);

  if (/\b(muestrame|ensename|quiero ver|dame|genera|haz)\b.*\b(propuestas|ideas|opciones)\b/u.test(normalized)) {
    return Object.freeze({
      kind: "REQUEST_PROPOSALS",
      confidence: 0.99,
      requestedGoal: "GENERATE_PROPOSALS",
    });
  }

  if (/\b(perdon|rectifico|en realidad|me equivoque|no era|mejor)\b/u.test(normalized)) {
    return Object.freeze({ kind: "CORRECTION", confidence: 0.95 });
  }

  if (
    /^(no|sin)\\b/u.test(normalized) ||
    /\\bno le gusta\\b/u.test(normalized) ||
    /\\b(?:no|tampoco)\\s*$/u.test(normalized) ||
    /\\b(?:ya no|mejor no)\\b/u.test(normalized)
  ) {
    return Object.freeze({ kind: "NEGATION", confidence: 0.94 });
  }

if (
    /^(no|sin)\\b/u.test(normalized) ||
    /\\bno le gusta\\b/u.test(normalized) ||
    /\\b(?:no|tampoco)\\s*$/u.test(normalized) ||
    /\\b(?:ya no|mejor no)\\b/u.test(normalized)
  ) {
    return Object.freeze({ kind: "NEGATION", confidence: 0.94 });
  }

  if (/\b(no me gusta|prefiero otra|cambia|quita|anade)\b/u.test(normalized)) {
    return Object.freeze({ kind: "FEEDBACK", confidence: 0.9 });
  }

  if (normalized.length > 0) {
    return Object.freeze({ kind: "INFORMATION", confidence: 0.8 });
  }

  return Object.freeze({ kind: "UNKNOWN", confidence: 0.2 });
}
