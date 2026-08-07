import type { AddJourneyParticipantInput, SetJourneyFactInput } from "../journey-domain/index.js";
import type { DiscoveryEvidence, DiscoveryExtractInput, DiscoveryExtraction } from "./discovery.types.js";

const VERSION = "v2.0.0-gift-model-memory";

function normalize(input: string): string {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}


const RECIPIENT_POSSESSIVE_HEADS: ReadonlySet<string> = new Set([
  "padre", "padres", "madre", "madres",
  "hermano", "hermana", "hermanos", "hermanas",
  "hijo", "hija", "hijos", "hijas",
  "sobrino", "sobrina", "sobrinos", "sobrinas",
  "tio", "tia", "tios", "tias",
  "abuelo", "abuela", "abuelos", "abuelas",
  "amigo", "amiga", "amigos", "amigas",
  "compañero", "compañera", "compañeros", "compañeras",
  "companero", "companera", "companeros", "companeras",
  "pareja", "novio", "novia", "marido", "mujer",
  "jefe", "jefa", "profesor", "profesora",
  "gemelo", "gemela", "gemelos", "gemelas",
  "primo", "prima", "primos", "primas",
  "nieto", "nieta", "nietos", "nietas",
  "padrino", "madrina",
]);

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
  if (!RECIPIENT_POSSESSIVE_HEADS.has(head)) return undefined;
  return { plural: possessive === "mis", head };
}

function evidence(message: string, match: RegExpMatchArray): DiscoveryEvidence {
  const start = match.index ?? 0;
  return { text: message.slice(start, start + match[0].length), start, end: start + match[0].length };
}

function relationshipFrom(text: string): string | undefined {
  const pairs: ReadonlyArray<readonly [RegExp, string]> = [
    [/\bgemelas?\b/, "daughter"], [/\bhijas?\b/, "daughter"], [/\bhijos?\b/, "son"],
    [/\bpadres\b|\bprogenitores\b/, "parent"], [/\bmadre\b|\bmama\b/, "mother"], [/\bpadre\b|\bpapa\b/, "father"],
    [/\bpareja\b|\bmujer\b|\bmarido\b|\bespos[oa]\b/, "partner"],
    [/\bherman[oa]s?\b/, "sibling"], [/\babuel[oa]s?\b/, "grandparent"],
    [/\bti[oa]s?\b/, "uncle_aunt"], [/\bprim[oa]s?\b/, "cousin"],
    [/\bsuegr[oa]s?\b/, "parent_in_law"], [/\bamig[oa]s?\b/, "friend"],
    [/\bcompan(?:ero|era|eros|eras)\b/, "coworker"], [/\bvecin[oa]s?\b/, "neighbor"],
    [/\bclient(?:e|es)\b/, "client"], [/\bprofesor(?:a|es|as)?\b/, "teacher"],
    [/\bemplead[oa]s?\b/, "employee"],
  ];
  return pairs.find(([pattern]) => pattern.test(text))?.[1];
}


function canonicalInterest(value: string): string {
  const text = normalize(value).trim();
  const aliases: Readonly<Record<string, string>> = Object.freeze({
    musica: "music", rap: "rap", hiphop: "rap", "hip hop": "rap", futbol: "football",
    barcos: "boats", barco: "boats", lectura: "reading", videojuegos: "gaming", gaming: "gaming",
    cocina: "cooking", fotografia: "photography", pesca: "fishing", motocross: "motocross",
  });
  return aliases[text] ?? text;
}

function standaloneInterests(message: string): readonly string[] {
  const text = normalize(message).replace(/[.!?]/g, " ").trim();
  const candidates = text.split(/\s+y\s+|,\s*/u).map((item) => item.trim()).filter(Boolean);
  const known = new Set(["musica", "rap", "hip hop", "hiphop", "futbol", "barcos", "barco", "lectura", "videojuegos", "gaming", "cocina", "fotografia", "pesca", "motocross"]);
  return Object.freeze(candidates.filter((item) => known.has(item)).map(canonicalInterest));
}

function occasionFrom(text: string): string | undefined {
  if (/cumpleanos|cumple/.test(text)) return "birthday";
  if (/navidad/.test(text)) return "christmas";
  if (/aniversario/.test(text)) return "anniversary";
  if (/boda/.test(text)) return "wedding";
  if (/comunion/.test(text)) return "communion";
  if (/graduacion/.test(text)) return "graduation";
  if (/jubilacion/.test(text)) return "retirement";
  return undefined;
}

export class DiscoveryExtractor {
  extract(input: DiscoveryExtractInput): DiscoveryExtraction {
    const message = input.message.trim();
    const text = normalize(message);
    const participants: AddJourneyParticipantInput[] = [];
    const facts: SetJourneyFactInput[] = [];
    const evidences: DiscoveryEvidence[] = [];

    const ageMatch = text.match(/\b(?:de\s+)?(\d{1,3})\s+anos?\b/);
    const age = ageMatch ? Number(ageMatch[1]) : undefined;
    if (ageMatch) evidences.push(evidence(message, ageMatch));

    const relationship = relationshipFrom(text);
    const possessive = possessiveRecipient(text);
    const twins = /\bgemelas?\b/.test(text);
    const pairedParents = /\bmis padres\b|\bpadre y (?:mi )?madre\b|\bpapa y mama\b/.test(text);
    const namesMatch = message.match(/(?:se llaman|son)\s+([A-ZÁÉÍÓÚÑ][\p{L}-]+)\s+y\s+([A-ZÁÉÍÓÚÑ][\p{L}-]+)/iu);
    const names = namesMatch ? [namesMatch[1], namesMatch[2]] : [];
    const recipientCount = twins || pairedParents
      ? 2
      : names.length > 0
        ? names.length
        : relationship && (possessive?.plural === false || !/\b(?:hijos|hijas|hermanos|hermanas|amigos|amigas|companeros|companeras|tios|tias|primos|primas|abuelos|abuelas)\b/.test(text))
          ? 1
          : 0;
    if (namesMatch) evidences.push(evidence(message, namesMatch));

    for (let index = 0; index < recipientCount; index += 1) {
      participants.push({
        role: "RECIPIENT",
        name: names[index],
        age,
        relationship,
        facts: twins ? { twinGroup: true } : {},
      });
    }

    if (recipientCount > 0) {
      facts.push({ key: "recipient.count", value: recipientCount, confidence: 1, source: "CONVERSATION", evidence: twins ? "gemelas" : relationship });
    }
    if (relationship) {
      facts.push({ key: "recipient.relationship", value: relationship, confidence: 0.95, source: "CONVERSATION", evidence: relationship });
    }
    if (age !== undefined && age >= 0 && age <= 130) {
      facts.push({ key: "recipient.age", value: age, confidence: 1, source: "CONVERSATION", evidence: ageMatch?.[0] });
    }

    const occasion = occasionFrom(text);
    if (occasion) {
      facts.push({ key: "occasion.type", value: occasion, confidence: 0.98, source: "CONVERSATION", evidence: occasion });
    }

    const budgetPatterns: readonly RegExp[] = [
      /\bpresupuesto(?:\s+m[aá]ximo)?(?:\s+(?:de|es|ser[ií]a))?\s*(?:de\s*)?(?:€\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:€|euros?)?\b/,
      /\b(?:quiero\s+gastar|puedo\s+gastar|gastar)?\s*hasta\s+(?:€\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:€|euros?)?\b/,
      /\b(?:dispongo\s+de\s+)?unos?\s+(?:€\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:€|euros?)?\b/,
      /\bsobre\s+(?:€\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:€|euros?)?\b/,
      /(?:€\s*)(\d+(?:[.,]\d{1,2})?)/,
      /(\d+(?:[.,]\d{1,2})?)\s*(?:€|euros?)\b/,
    ];
    const budgetMatch = budgetPatterns
      .map((pattern) => text.match(pattern))
      .find((match): match is RegExpMatchArray => Boolean(match));
    if (budgetMatch) {
      const amount = Number(budgetMatch[1]?.replace(",", "."));
      if (Number.isFinite(amount)) {
        facts.push({ key: "budget.max", value: amount, confidence: 0.95, source: "CONVERSATION", evidence: budgetMatch[0] });
        facts.push({ key: "budget.currency", value: "EUR", confidence: 1, source: "SYSTEM" });
        evidences.push(evidence(message, budgetMatch));
      }
    }

    const interestsMatch = message.match(/(?:le|les)\s+(?:encanta|encantan|gusta|gustan)\s+(?:mucho\s+)?(?:el|la|los|las)?\s*([^.,;!?]+)/iu);
    const explicitInterests = interestsMatch?.[1]
      ? interestsMatch[1].trim().split(/\s+y\s+|,\s*/u).map((item) => canonicalInterest(item.trim())).filter(Boolean)
      : [];
    const contextualInterests = standaloneInterests(message);
    const interests = [...new Set([...explicitInterests, ...contextualInterests])];
    if (interests.length > 0) {
      facts.push({ key: "recipient.interests", value: interests, confidence: interestsMatch ? 0.92 : 0.88, source: "CONVERSATION", evidence: interestsMatch?.[0] ?? message, merge: "APPEND_UNIQUE" });
      if (interestsMatch) evidences.push(evidence(message, interestsMatch));
    }

    const nameMatch = message.match(/(?:se llama|su nombre es|personaliz(?:ado|arlo) con)\s+[«"']?([A-ZÁÉÍÓÚÑ][\p{L}-]+)[»"']?/iu);
    if (nameMatch?.[1]) {
      facts.push({ key: "recipient.name", value: nameMatch[1], confidence: 0.98, source: "CONVERSATION", evidence: nameMatch[0] });
      facts.push({ key: "personalization.name", value: nameMatch[1], confidence: 0.98, source: "CONVERSATION", evidence: nameMatch[0] });
    }

    if (/\bdivertid[oa]\b/.test(text)) facts.push({ key: "gift.style", value: ["fun"], confidence: 0.95, source: "CONVERSATION", evidence: message, merge: "APPEND_UNIQUE" });
    if (/\bemotiv[oa]\b|\bespecial\b/.test(text)) facts.push({ key: "gift.style", value: ["emotional"], confidence: 0.9, source: "CONVERSATION", evidence: message, merge: "APPEND_UNIQUE" });
    if (/\b(?:sin foto|no tengo foto|no hay foto)\b/.test(text)) facts.push({ key: "personalization.photo_available", value: false, confidence: 1, source: "CONVERSATION", evidence: message });
    if (/\b(?:con foto|tengo una foto|si tengo foto)\b/.test(text)) facts.push({ key: "personalization.photo_available", value: true, confidence: 1, source: "CONVERSATION", evidence: message });
    const monthMatch = text.match(/\b(?:para|en)\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/);
    if (monthMatch?.[1]) {
      facts.push({ key: "occasion.date_text", value: monthMatch[1], confidence: 0.9, source: "CONVERSATION", evidence: monthMatch[0] });
      facts.push({ key: "delivery.date_text", value: monthMatch[1], confidence: 0.85, source: "INFERENCE", evidence: monthMatch[0] });
    }

    const giftIntent = /\bregalo\b|\bregalar\b/.test(text);
    if (giftIntent) facts.push({ key: "journey.intent", value: "create_gift", confidence: 0.98, source: "CONVERSATION", evidence: "regalo" });

    const genericScope = /\b(?:regalo|idea)\s+(?:generic[oa]|general)\b|\b(?:algo|ideas?)\s+para\s+tener\s+en\s+stock\b/.test(text);
    const personalScope = recipientCount > 0
      || Boolean(possessive)
      || /\bpara\s+(?:alguien|una persona|[A-ZÁÉÍÓÚÑ])/u.test(message);
    if (genericScope) {
      facts.push({ key: "gift.scope", value: "generic", confidence: 0.99, source: "CONVERSATION", evidence: message });
    } else if (personalScope) {
      facts.push({ key: "gift.scope", value: "personal", confidence: 0.98, source: "CONVERSATION", evidence: message });
    }

    const confidenceSignals = [recipientCount > 0, age !== undefined, Boolean(occasion), giftIntent, Boolean(budgetMatch)].filter(Boolean).length;
    const confidence = Number(Math.min(1, 0.45 + confidenceSignals * 0.11).toFixed(2));

    return Object.freeze({
      extractorVersion: VERSION,
      participants: Object.freeze(participants),
      facts: Object.freeze(facts),
      evidence: Object.freeze(evidences),
      confidence,
    });
  }
}
