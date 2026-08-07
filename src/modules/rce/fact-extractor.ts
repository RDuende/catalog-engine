import type {
  RceFactCandidate,
  RceFactOperation,
  RceMessageKind,
} from "./contracts.js";
import { INTEREST_ALIASES, ORDINAL_AGE, RELATION_BY_TERM } from "./lexicon.js";
import { normalizeText } from "./normalize.js";

function candidate(
  messageId: string,
  evidence: string,
  key: string,
  value: unknown,
  confidence: number,
  operation: RceFactOperation = "SET",
  inferred = false,
): RceFactCandidate {
  return Object.freeze({
    key,
    value,
    confidence,
    operation,
    sourceMessageId: messageId,
    evidence,
    inferred,
  });
}

function extractRelationship(
  messageId: string,
  original: string,
  normalized: string,
): RceFactCandidate[] {
  const terms = Object.keys(RELATION_BY_TERM).sort((a, b) => b.length - a.length);
  const pattern = new RegExp(
    `\\b(mi|mis|un|una|el|la|los|las)\\s+(${terms.join("|")})\\b`,
    "u",
  );
  const match = normalized.match(pattern);
  const article = match?.[1];
  const term = match?.[2];
  if (!article || !term) return [];

  const relationship = RELATION_BY_TERM[term];
  if (!relationship) return [];

  const facts: RceFactCandidate[] = [
    candidate(messageId, original, "gift.scope", "personal", 0.99),
    candidate(messageId, original, "recipient.relationship", relationship, 0.99),
  ];

  if (new Set(["mi", "un", "una", "el", "la"]).has(article)) {
    facts.push(
      candidate(messageId, original, "recipient.count", 1, 0.98, "SET", true),
    );
  }

  return facts;
}

function extractOccasionAndAge(
  messageId: string,
  original: string,
  normalized: string,
): RceFactCandidate[] {
  const facts: RceFactCandidate[] = [];
  const birthdayPattern = /\b(cumpleanos|cunpleanos|cumpleano|cunpleano)\b/u;

  if (birthdayPattern.test(normalized)) {
    facts.push(candidate(messageId, original, "occasion.type", "birthday", 0.99));

    const ordinal = Object.keys(ORDINAL_AGE).find((word) =>
      new RegExp(
        `\\b${word}\\s+(cumpleanos|cunpleanos|cumpleano|cunpleano)\\b`,
        "u",
      ).test(normalized),
    );

    if (ordinal) {
      facts.push(
        candidate(
          messageId,
          original,
          "recipient.age",
          ORDINAL_AGE[ordinal],
          0.82,
          "SET",
          true,
        ),
      );
    }
  }

  if (/\b(comunion|primera comunion)\b/u.test(normalized)) {
    facts.push(candidate(messageId, original, "occasion.type", "communion", 0.99));
  }
  if (/\b(boda|casamiento)\b/u.test(normalized)) {
    facts.push(candidate(messageId, original, "occasion.type", "wedding", 0.98));
  }
  if (/\baniversario\b/u.test(normalized)) {
    facts.push(candidate(messageId, original, "occasion.type", "anniversary", 0.98));
  }
  if (/\b(navidad|reyes)\b/u.test(normalized)) {
    facts.push(candidate(messageId, original, "occasion.type", "christmas", 0.98));
  }

  const explicitAge = normalized.match(
    /\b(?:tiene|de|cumple)\s+(\d{1,3})\s*(?:anos|ano)?\b/u,
  );
  if (explicitAge?.[1]) {
    const age = Number(explicitAge[1]);
    if (age >= 0 && age <= 120) {
      facts.push(candidate(messageId, original, "recipient.age", age, 1));
    }
  }

  const numericBirthday = normalized.match(
    /\b(\d{1,2})\s*(?:o|º)?\s+(?:cumpleanos|cunpleanos)\b/u,
  );
  if (numericBirthday?.[1]) {
    facts.push(
      candidate(
        messageId,
        original,
        "recipient.age",
        Number(numericBirthday[1]),
        0.9,
        "SET",
        true,
      ),
    );
  }

  return facts;
}

function extractBudget(
  messageId: string,
  original: string,
  normalized: string,
): RceFactCandidate[] {
  const match =
    normalized.match(
      /\b(?:presupuesto|gastar|gastarme|maximo|hasta|tengo)\D{0,20}(\d+(?:[.,]\d{1,2})?)\s*(?:€|euros?)?\b/u,
    ) ??
    normalized.match(/\b(\d+(?:[.,]\d{1,2})?)\s*(?:€|euros?)\b/u);

  if (!match?.[1]) return [];

  const value = Number(match[1].replace(",", "."));
  if (!Number.isFinite(value) || value <= 0) return [];

  return [candidate(messageId, original, "budget.max", value, 0.98)];
}

function isInterestNegation(
  normalized: string,
  kind: RceMessageKind,
): boolean {
  return (
    kind === "NEGATION" ||
    /\b(no le gusta|quita|sin|ya no|mejor no)\b/u.test(normalized) ||
    /\b(?:no|tampoco)\s*$/u.test(normalized)
  );
}

function extractInterests(
  messageId: string,
  original: string,
  normalized: string,
  kind: RceMessageKind,
): RceFactCandidate[] {
  const found = [
    ...new Set(
      Object.entries(INTEREST_ALIASES)
        .filter(([term]) =>
          new RegExp(`\\b${term.replaceAll(" ", "\\s+")}\\b`, "u").test(normalized),
        )
        .map(([, id]) => id),
    ),
  ];

  if (!found.length) return [];

  const operation: RceFactOperation = isInterestNegation(normalized, kind)
    ? "REMOVE"
    : "ADD";

  return found.map((value) =>
    candidate(
      messageId,
      original,
      "recipient.interests",
      value,
      0.94,
      operation,
    ),
  );
}

function extractStyle(
  messageId: string,
  original: string,
  normalized: string,
): RceFactCandidate[] {
  const styles: string[] = [];
  if (/\b(divertido|gracioso|alegre)\b/u.test(normalized)) styles.push("fun");
  if (/\b(emotivo|emocional|especial)\b/u.test(normalized)) styles.push("emotional");
  if (/\b(elegante|premium|lujoso)\b/u.test(normalized)) styles.push("elegant");
  if (/\b(minimalista|sencillo)\b/u.test(normalized)) styles.push("minimal");

  return styles.map((value) =>
    candidate(messageId, original, "gift.style", value, 0.92, "ADD"),
  );
}

export function extractFacts(input: {
  readonly messageId: string;
  readonly text: string;
  readonly kind: RceMessageKind;
}): readonly RceFactCandidate[] {
  const normalized = normalizeText(input.text);

  const extracted: RceFactCandidate[] = [
    ...extractRelationship(input.messageId, input.text, normalized),
    ...extractOccasionAndAge(input.messageId, input.text, normalized),
    ...extractBudget(input.messageId, input.text, normalized),
    ...extractInterests(input.messageId, input.text, normalized, input.kind),
    ...extractStyle(input.messageId, input.text, normalized),
  ];

  if (input.kind !== "CORRECTION") {
    return Object.freeze(extracted);
  }

  return Object.freeze(
    extracted.map((fact): RceFactCandidate => {
      if (fact.operation === "ADD" || fact.operation === "REMOVE") {
        return fact;
      }

      return Object.freeze({
        ...fact,
        operation: "SET" as const,
      });
    }),
  );
}
