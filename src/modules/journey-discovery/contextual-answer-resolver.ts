import type { JourneyProjectSnapshot, SetJourneyFactInput } from "../journey-domain/index.js";

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}


function latestFactValue(snapshot: JourneyProjectSnapshot, key: string): unknown {
  return [...snapshot.facts].filter((fact) => fact.key === key).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]?.value;
}

function hasFact(snapshot: JourneyProjectSnapshot, key: string): boolean {
  const value = latestFactValue(snapshot, key);
  return value !== undefined && value !== null && (!(typeof value === "string") || value.trim().length > 0);
}

function latestCompleteness(snapshot: JourneyProjectSnapshot): Record<string, unknown> | undefined {
  const fact = [...snapshot.facts]
    .filter((item) => item.key === "journey.completeness")
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
  return fact?.value && typeof fact.value === "object"
    ? fact.value as Record<string, unknown>
    : undefined;
}

export function pendingRequiredFact(snapshot: JourneyProjectSnapshot): string | undefined {
  const explicitPending = [...snapshot.facts]
    .filter((item) => item.key === "conversation.pending_fact")
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]?.value;
  if (typeof explicitPending === "string" && explicitPending.trim()) return explicitPending;

  const completeness = latestCompleteness(snapshot);
  const missing = completeness?.missingRequired;
  return Array.isArray(missing) && typeof missing[0] === "string" ? missing[0] : undefined;
}

function countFromMessage(text: string): number | undefined {
  if (/^(?:uno|una|1)$/.test(text)) return 1;
  if (/^(?:dos|2)$/.test(text)) return 2;
  if (/^(?:tres|3)$/.test(text)) return 3;
  if (/^(?:cuatro|4)$/.test(text)) return 4;
  const numeric = text.match(/^(\d{1,2})(?:\s+personas?)?$/);
  if (numeric) return Number(numeric[1]);
  if (/\bmis padres\b|\bmi padre y mi madre\b|\bpapa y mama\b/.test(text)) return 2;
  if (/\bgemel[oa]s\b|\bmelliz[oa]s\b/.test(text)) return 2;
  return undefined;
}

const NON_RECIPIENT_POSSESSIVES = new Set([
  "presupuesto", "idea", "ideas", "intencion", "objetivo", "objetivos",
  "color", "colores", "gusto", "gustos", "preferencia", "preferencias",
  "pedido", "pedidos", "regalo", "regalos", "diseno", "disenos",
  "foto", "fotos", "dinero", "tiempo", "direccion", "cuenta", "datos",
]);

function possessiveRecipient(text: string): { plural: boolean; head: string } | undefined {
  const match = text.match(/\b(mi|mis)\s+([a-zñ][a-zñ-]*)/u);
  if (!match) return undefined;
  const possessive = match[1];
  const head = match[2];
  if (!possessive || !head) return undefined;
  if (NON_RECIPIENT_POSSESSIVES.has(head)) return undefined;
  return { plural: possessive === "mis", head };
}

function relationshipFromMessage(text: string): string | undefined {
  if (/\bmis padres\b|\bpadres\b|\bprogenitores\b/.test(text)) return "parent";
  if (/\bmadre\b|\bmama\b/.test(text)) return "mother";
  if (/\bpadre\b|\bpapa\b/.test(text)) return "father";
  if (/\bpareja\b|\bespos[oa]\b|\bmarido\b|\bmujer\b/.test(text)) return "partner";
  if (/\bhij[oa]s?\b/.test(text)) return "child";
  if (/\bherman[oa]s?\b/.test(text)) return "sibling";
  if (/\babuel[oa]s?\b/.test(text)) return "grandparent";
  if (/\bti[oa]s?\b/.test(text)) return "uncle_aunt";
  if (/\bprim[oa]s?\b/.test(text)) return "cousin";
  if (/\bsuegr[oa]s?\b/.test(text)) return "parent_in_law";
  if (/\bamig[oa]s?\b/.test(text)) return "friend";
  if (/\bcompan(?:ero|era|eros|eras)\b/.test(text)) return "coworker";
  if (/\bvecin[oa]s?\b/.test(text)) return "neighbor";
  if (/\bclient(?:e|es)\b/.test(text)) return "client";
  if (/\bprofesor(?:a|es|as)?\b/.test(text)) return "teacher";
  if (/\bemplead[oa]s?\b/.test(text)) return "employee";
  return undefined;
}

function giftScopeFromMessage(text: string): "generic" | "personal" | undefined {
  if (/\b(?:generic[oa]|general|sin destinatario|ideas? generales?)\b/.test(text)) return "generic";
  if (/\b(?:para alguien|para una persona|alguien en particular|personal|personalizado)\b/.test(text)) return "personal";
  if (possessiveRecipient(text) || relationshipFromMessage(text)) return "personal";
  return undefined;
}

function occasionFromMessage(text: string): string | undefined {
  if (/\bcumple(?:anos)?\b|\bcumpleanos\b/.test(text)) return "birthday";
  if (/\bnavidad\b/.test(text)) return "christmas";
  if (/\baniversario\b/.test(text)) return "anniversary";
  if (/\bboda\b/.test(text)) return "wedding";
  if (/\bcomunion\b/.test(text)) return "communion";
  if (/\bgraduacion\b/.test(text)) return "graduation";
  if (/\bjubilacion\b/.test(text)) return "retirement";
  return undefined;
}

export function resolveContextualAnswer(
  snapshot: JourneyProjectSnapshot | undefined,
  message: string,
  now?: string,
): readonly SetJourneyFactInput[] {
  if (!snapshot) return Object.freeze([]);

  const expected = pendingRequiredFact(snapshot);
  const text = normalize(message);
  const facts = new Map<string, SetJourneyFactInput>();
  const addFact = (fact: SetJourneyFactInput): void => {
    facts.set(`${fact.participantId ?? "journey"}:${fact.key}`, fact);
  };

  // Hotfix: los hechos semánticamente inequívocos se conservan aunque el
  // Journey esté esperando otra respuesta. Así una relación como "mi hermana"
  // fija siempre el alcance personal y una ocasión como "boda" no depende del
  // orden de las preguntas.
  const scope = giftScopeFromMessage(text);
  const relationship = relationshipFromMessage(text);
  const occasion = occasionFromMessage(text);

  if (scope) {
    addFact({ key: "gift.scope", value: scope, confidence: 1, source: "CONVERSATION", evidence: message, now });
  }
  if (relationship) {
    addFact({ key: "recipient.relationship", value: relationship, confidence: 0.98, source: "CONVERSATION", evidence: message, now });
    addFact({ key: "gift.scope", value: "personal", confidence: 1, source: "CONVERSATION", evidence: message, now });
  }
  if (occasion) {
    addFact({ key: "occasion.type", value: occasion, confidence: 0.98, source: "CONVERSATION", evidence: message, now });
  }

  // Las respuestas puramente numéricas siguen interpretándose únicamente
  // cuando el contexto espera una cantidad, para evitar falsos positivos.
  if (expected === "gift.scope" && scope === "personal") {
    const count = countFromMessage(text);
    if (count !== undefined) {
      addFact({ key: "recipient.count", value: count, confidence: 1, source: "CONVERSATION", evidence: message, now });
    } else if (relationship && possessiveRecipient(text)?.plural === false) {
      addFact({ key: "recipient.count", value: 1, confidence: 0.98, source: "CONVERSATION", evidence: message, now });
    }
  } else if (expected === "recipient.count") {
    const count = countFromMessage(text);
    if (count !== undefined && Number.isInteger(count) && count >= 1 && count <= 20) {
      addFact({ key: "recipient.count", value: count, confidence: 1, source: "CONVERSATION", evidence: message, now });
    } else if (relationship && possessiveRecipient(text)?.plural === false) {
      addFact({ key: "recipient.count", value: 1, confidence: 0.98, source: "CONVERSATION", evidence: message, now });
    }
  }

  // Respuestas breves dentro del descubrimiento libre. Se aplican solo cuando
  // el estado previo hace inequívoco el dato esperado, evitando interpretar
  // cualquier sí/no o nombre aislado fuera de contexto.
  const affirmative = /^(?:si|sí|claro|vale|correcto)$/iu.test(message.trim());
  const negative = /^(?:no|nop|ninguna|ninguno)$/iu.test(message.trim());
  if ((affirmative || negative) && hasFact(snapshot, "recipient.interests") && !hasFact(snapshot, "personalization.enabled")) {
    addFact({ key: "personalization.enabled", value: affirmative, confidence: 0.96, source: "CONVERSATION", evidence: message, now });
  } else if ((affirmative || negative) && hasFact(snapshot, "personalization.name") && !hasFact(snapshot, "personalization.photo_available")) {
    addFact({ key: "personalization.photo_available", value: affirmative, confidence: 0.98, source: "CONVERSATION", evidence: message, now });
  }

  const possibleName = message.trim().match(/^([A-ZÁÉÍÓÚÑ][\p{L}-]{1,40})$/u)?.[1];
  if (possibleName && latestFactValue(snapshot, "personalization.enabled") === true && !hasFact(snapshot, "personalization.name")) {
    addFact({ key: "recipient.name", value: possibleName, confidence: 0.96, source: "CONVERSATION", evidence: message, now });
    addFact({ key: "personalization.name", value: possibleName, confidence: 0.96, source: "CONVERSATION", evidence: message, now });
  }

  return Object.freeze([...facts.values()]);
}
