import type { JourneyFactSource } from "../journey-domain/index.js";

export interface InferredRecipientFact {
  readonly key: "gift.scope" | "recipient.relationship" | "recipient.count";
  readonly value: string | number;
  readonly confidence: number;
  readonly source: JourneyFactSource;
  readonly evidence: string;
  readonly now?: string;
}

const RELATION_BY_HEAD: Readonly<Record<string, string>> = Object.freeze({
  padre: "parent",
  padres: "parent",
  madre: "parent",
  madres: "parent",
  hermano: "sibling",
  hermana: "sibling",
  hermanos: "sibling",
  hermanas: "sibling",
  hijo: "child",
  hija: "child",
  hijos: "child",
  hijas: "child",
  sobrino: "nephew",
  sobrina: "nephew",
  sobrinos: "nephew",
  sobrinas: "nephew",
  tio: "uncle",
  tia: "uncle",
  tios: "uncle",
  tias: "uncle",
  abuelo: "grandparent",
  abuela: "grandparent",
  abuelos: "grandparent",
  abuelas: "grandparent",
  nieto: "grandchild",
  nieta: "grandchild",
  nietos: "grandchild",
  nietas: "grandchild",
  primo: "cousin",
  prima: "cousin",
  primos: "cousin",
  primas: "cousin",
  amigo: "friend",
  amiga: "friend",
  amigos: "friend",
  amigas: "friend",
  compañero: "colleague",
  compañera: "colleague",
  compañeros: "colleague",
  compañeras: "colleague",
  companero: "colleague",
  companera: "colleague",
  companeros: "colleague",
  companeras: "colleague",
  pareja: "partner",
  novio: "partner",
  novia: "partner",
  marido: "partner",
  esposa: "partner",
  jefe: "colleague",
  jefa: "colleague",
  profesor: "teacher",
  profesora: "teacher",
  padrino: "godparent",
  madrina: "godparent",
  ahijado: "godchild",
  ahijada: "godchild",
});

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function inferRecipientRelationshipFacts(
  message: string,
  now?: string,
): readonly InferredRecipientFact[] {
  const normalized = normalize(message);
  const match = normalized.match(/\b(mi|mis)\s+([a-zñ]+)\b/u);
  if (!match) return Object.freeze([]);

  const possessive = match[1];
  const head = match[2];
  if (!possessive || !head) return Object.freeze([]);

  const relationship = RELATION_BY_HEAD[head];
  if (!relationship) return Object.freeze([]);

  const evidence = message.trim();
  const facts: InferredRecipientFact[] = [
    {
      key: "gift.scope",
      value: "personal",
      confidence: 1,
      source: "CONVERSATION",
      evidence,
      ...(now ? { now } : {}),
    },
    {
      key: "recipient.relationship",
      value: relationship,
      confidence: 0.99,
      source: "CONVERSATION",
      evidence,
      ...(now ? { now } : {}),
    },
  ];

  if (possessive === "mi") {
    facts.push({
      key: "recipient.count",
      value: 1,
      confidence: 0.99,
      source: "CONVERSATION",
      evidence,
      ...(now ? { now } : {}),
    });
  }

  return Object.freeze(facts);
}
