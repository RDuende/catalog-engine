import type {
  JourneyMemory,
  MemoryDiscoveryState,
  MemoryQuestion,
} from "./memory-brain.types.js";

const DISCOVERY_FIELDS = Object.freeze([
  {
    key: "relationship",
    text:
      "¿Para quién estás preparando el regalo?",
    priority: 100,
    reason:
      "Necesitamos identificar al destinatario.",
  },
  {
    key: "occasion",
    text:
      "¿Hay alguna ocasión especial?",
    priority: 80,
    reason:
      "La ocasión influye en el tono y las propuestas.",
  },
  {
    key: "interest",
    text:
      "¿Qué aficiones o gustos tiene?",
    priority: 70,
    reason:
      "Los intereses permiten buscar productos pertinentes.",
  },
  {
    key: "budget",
    text:
      "¿Qué presupuesto aproximado tienes?",
    priority: 60,
    reason:
      "El presupuesto limita y ordena las propuestas.",
  },
]);

function activeKeys(
  memory: JourneyMemory,
): Set<string> {
  return new Set(
    memory.facts
      .filter(
        (fact) =>
          fact.status === "CONFIRMED" ||
          fact.status === "INFERRED",
      )
      .map((fact) => fact.key),
  );
}

export function discoverNextQuestion(
  memory: JourneyMemory,
): MemoryDiscoveryState {
  const known = activeKeys(memory);
  const asked = new Set(
    memory.questions
      .filter(
        (question) =>
          question.askedAt &&
          !question.answeredAt,
      )
      .map((question) => question.key),
  );

  const missing =
    DISCOVERY_FIELDS.filter(
      (field) => !known.has(field.key),
    );

  const candidate =
    missing
      .filter(
        (field) =>
          !asked.has(field.key),
      )
      .sort(
        (left, right) =>
          right.priority - left.priority,
      )[0];

  const nextQuestion:
    MemoryQuestion | undefined =
    candidate
      ? Object.freeze({
          id: `question:${candidate.key}`,
          key: candidate.key,
          text: candidate.text,
          priority:
            candidate.priority,
          reason: candidate.reason,
        })
      : undefined;

  return Object.freeze({
    knownKeys:
      Object.freeze([...known]),
    missingKeys:
      Object.freeze(
        missing.map(
          (field) => field.key,
        ),
      ),
    ...(nextQuestion
      ? { nextQuestion }
      : {}),
    completionPercent:
      Math.round(
        (
          known.size /
          DISCOVERY_FIELDS.length
        ) * 100,
      ),
  });
}
