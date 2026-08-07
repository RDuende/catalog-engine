import type { JourneyProjectSnapshot } from "../journey-domain/index.js";
import type { JourneyQualityReport, PlannedQuestion } from "./journey-model.types.js";

const QUESTIONS: Readonly<Record<string, { question: string; base: number; gain: number; reason: string }>> = Object.freeze({
  "recipient.relationship": { question: "¿Qué relación tienes con la persona que recibirá el regalo?", base: 100, gain: 25, reason: "Define el destinatario y el tono del regalo." },
  "occasion.type": { question: "¿Qué vais a celebrar?", base: 95, gain: 22, reason: "La ocasión condiciona la propuesta y la historia." },
  "budget.max": { question: "¿Qué presupuesto máximo tienes para el regalo?", base: 88, gain: 20, reason: "Permite descartar opciones inviables y ordenar el catálogo." },
  "recipient.interests": { question: "¿Qué aficiones o intereses tiene?", base: 86, gain: 20, reason: "Es el dato que más mejora la relevancia temática." },
  "recipient.age": { question: "¿Qué edad tiene aproximadamente?", base: 78, gain: 14, reason: "Ajusta el tipo de producto, lenguaje y estilo visual." },
  "personalization.enabled": { question: "¿Te gustaría personalizarlo con su nombre, una foto o algún mensaje?", base: 58, gain: 10, reason: "Define el nivel de personalización esperado." },
  "gift.style": { question: "¿Prefieres algo divertido, emotivo, elegante o sorprendente?", base: 45, gain: 7, reason: "Afina el tono creativo sin bloquear las propuestas." },
  "occasion.date_text": { question: "¿Para cuándo necesitas el regalo?", base: 40, gain: 5, reason: "Ayuda a validar producción y envío." },
});

function alreadyAsked(snapshot: JourneyProjectSnapshot, key: string): boolean {
  const pending = snapshot.facts
    .filter((fact) => fact.key === "conversation.question_history" && Array.isArray(fact.value))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]?.value;
  return Array.isArray(pending) && pending.includes(key);
}

export function planNextQuestion(snapshot: JourneyProjectSnapshot, quality: JourneyQualityReport): PlannedQuestion | undefined {
  const missing = new Set(quality.missing);
  const candidates = Object.entries(QUESTIONS)
    .filter(([key]) => missing.has(key))
    .map(([factKey, definition]) => {
      const repeatedPenalty = alreadyAsked(snapshot, factKey) ? 35 : 0;
      const priority = definition.base + definition.gain - repeatedPenalty;
      return { factKey, ...definition, priority };
    })
    .sort((left, right) => right.priority - left.priority);
  const selected = candidates[0];
  if (!selected) return undefined;
  return Object.freeze({
    factKey: selected.factKey,
    question: selected.question,
    priority: selected.priority,
    informationGain: selected.gain,
    reason: selected.reason,
  });
}
