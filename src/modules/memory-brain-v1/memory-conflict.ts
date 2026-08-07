import {
  createHash,
} from "node:crypto";

import type {
  MemoryConflict,
  MemoryRecord,
} from "./memory-brain.types.js";

function sameValue(
  left: unknown,
  right: unknown,
): boolean {
  return JSON.stringify(left) ===
    JSON.stringify(right);
}

export function resolveMemoryConflict(
  previous: MemoryRecord,
  incoming: MemoryRecord,
): MemoryConflict | undefined {
  if (
    previous.subjectKey !== incoming.subjectKey ||
    previous.key !== incoming.key ||
    sameValue(previous.value, incoming.value)
  ) {
    return undefined;
  }

  let resolution:
    MemoryConflict["resolution"] =
      "REVIEW";

  let reason =
    "Los recuerdos contienen valores diferentes.";

  if (
    incoming.source ===
    "CORRECTION"
  ) {
    resolution =
      "USE_INCOMING";
    reason =
      "Una corrección explícita sustituye el dato anterior.";
  } else if (
    incoming.source ===
      "USER_EXPLICIT" &&
    previous.source !==
      "USER_EXPLICIT"
  ) {
    resolution =
      "USE_INCOMING";
    reason =
      "El dato explícito tiene prioridad sobre inferencias.";
  } else if (
    incoming.confidence >
      previous.confidence + 0.15
  ) {
    resolution =
      "USE_INCOMING";
    reason =
      "El nuevo recuerdo tiene una confianza claramente superior.";
  } else if (
    previous.confidence >
      incoming.confidence + 0.15
  ) {
    resolution =
      "KEEP_PREVIOUS";
    reason =
      "El recuerdo anterior conserva una confianza claramente superior.";
  } else if (
    Array.isArray(previous.value) &&
    Array.isArray(incoming.value)
  ) {
    resolution =
      "MERGE";
    reason =
      "Ambos recuerdos son colecciones compatibles.";
  }

  const id =
    `memory-conflict-${createHash("sha1")
      .update(`${previous.id}:${incoming.id}`)
      .digest("hex")
      .slice(0, 12)}`;

  return Object.freeze({
    id,
    subjectKey:
      incoming.subjectKey,
    key:
      incoming.key,
    previous,
    incoming,
    resolution,
    reason,
  });
}
