import type {
  MemoryFactInput,
} from "./memory-brain.types.js";
import {
  normalizeMemoryText,
} from "./memory-normalizer.js";

const INTEREST_PATTERNS: ReadonlyArray<{
  readonly value: string;
  readonly terms: readonly string[];
}> = Object.freeze([
  {
    value: "cooking",
    terms: Object.freeze([
      "cocinar",
      "cocina",
      "chef",
      "barbacoa",
      "barbacoas",
      "reposteria",
      "repostería",
    ]),
  },
  {
    value: "football",
    terms: Object.freeze([
      "futbol",
      "fútbol",
      "balon",
      "balón",
      "porteria",
      "portería",
    ]),
  },
  {
    value: "hiking",
    terms: Object.freeze([
      "senderismo",
      "trekking",
      "montana",
      "montaña",
    ]),
  },
]);

const MATERIAL_PATTERNS: ReadonlyArray<{
  readonly value: string;
  readonly terms: readonly string[];
}> = Object.freeze([
  {
    value: "wood",
    terms: Object.freeze([
      "madera",
      "wood",
    ]),
  },
  {
    value: "metal",
    terms: Object.freeze([
      "metal",
      "metalico",
      "metálico",
      "metalica",
      "metálica",
    ]),
  },
]);

function includesAny(
  source: string,
  terms: readonly string[],
): boolean {
  return terms.some((term) =>
    source.includes(
      normalizeMemoryText(term),
    ),
  );
}

export function extractMemoryFacts(
  text: string,
): readonly MemoryFactInput[] {
  const normalized =
    normalizeMemoryText(text);
  const facts: MemoryFactInput[] = [];

  const budgetMatch =
    normalized.match(
      /(?:presupuesto|tengo|unos?|hasta)\s+(?:de\s+)?(\d{1,5})(?:\s*€|\s*euros?)?/u,
    );

  if (budgetMatch?.[1]) {
    facts.push({
      kind: "BUDGET",
      key: "budget",
      value: Number(budgetMatch[1]),
      confidence: 0.95,
      confirmed: true,
    });
  }

  const ageMatch =
    normalized.match(
      /(?:tiene|tienen|edad(?:\s+de)?)\s+(\d{1,3})\s+anos?/u,
    );

  if (ageMatch?.[1]) {
    facts.push({
      kind: "AGE",
      key: "age",
      value: Number(ageMatch[1]),
      confidence: 0.98,
      confirmed: true,
    });
  }

  if (
    normalized.includes("mis padres") ||
    normalized.includes("para mis padres")
  ) {
    facts.push(
      {
        kind: "RELATIONSHIP",
        key: "relationship",
        value: "parents",
        confidence: 1,
        confirmed: true,
      },
      {
        kind: "RECIPIENT_COUNT",
        key: "recipient-count",
        value: 2,
        confidence: 1,
        confirmed: true,
      },
    );
  } else if (
    normalized.includes("mi padre") ||
    normalized.includes("para mi padre")
  ) {
    facts.push({
      kind: "RELATIONSHIP",
      key: "relationship",
      value: "father",
      confidence: 1,
      confirmed: true,
    });
  } else if (
    normalized.includes("mi madre") ||
    normalized.includes("para mi madre")
  ) {
    facts.push({
      kind: "RELATIONSHIP",
      key: "relationship",
      value: "mother",
      confidence: 1,
      confirmed: true,
    });
  }

  for (const interest of INTEREST_PATTERNS) {
    if (
      includesAny(
        normalized,
        interest.terms,
      )
    ) {
      facts.push({
        kind: "INTEREST",
        key: "interest",
        value: interest.value,
        confidence: 0.9,
        confirmed: true,
      });
    }
  }

  for (const material of MATERIAL_PATTERNS) {
    if (
      includesAny(
        normalized,
        material.terms,
      )
    ) {
      facts.push({
        kind: "MATERIAL_PREFERENCE",
        key: "preferred-material",
        value: material.value,
        confidence: 0.85,
        confirmed: true,
      });
    }
  }

  const rejectionMatch =
    normalized.match(
      /(?:no quiero|no me gusta|descarto|sin)\s+([a-z0-9áéíóúñü -]{2,40})/u,
    );

  if (rejectionMatch?.[1]) {
    facts.push({
      kind: "PRODUCT_REJECTION",
      key: "rejected-product",
      value: rejectionMatch[1].trim(),
      confidence: 0.92,
      confirmed: true,
    });
  }

  if (
    normalized.includes("cumpleanos") ||
    normalized.includes("cumpleaños")
  ) {
    facts.push({
      kind: "OCCASION",
      key: "occasion",
      value: "birthday",
      confidence: 1,
      confirmed: true,
    });
  }

  return Object.freeze(facts);
}
