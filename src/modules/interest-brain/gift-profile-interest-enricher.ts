import {
  defaultInterestBrain,
  normalizeInterestText,
  tokenizeInterestText,
} from "./interest-brain.service.js";
import type {
  InterestDefinition,
} from "./interest-brain.types.js";

export interface GiftProfileWithInterests {
  readonly interests?: readonly string[];
}

function canonicalGiftInterest(
  definition: InterestDefinition,
): string {
  if (definition.domain === "cooking") {
    return "cooking";
  }

  return definition.id;
}

function variants(value: string): readonly string[] {
  const normalized = normalizeInterestText(value);
  const result = new Set<string>([normalized]);

  if (normalized.endsWith("es") && normalized.length > 4) {
    result.add(normalized.slice(0, -2));
  }

  if (normalized.endsWith("s") && normalized.length > 3) {
    result.add(normalized.slice(0, -1));
  }

  if (!normalized.endsWith("s")) {
    result.add(`${normalized}s`);
  }

  if (
    !normalized.endsWith("es") &&
    /[bdgjlmnprstxz]$/u.test(normalized)
  ) {
    result.add(`${normalized}es`);
  }

  return Object.freeze([...result].filter(Boolean));
}

function containsTerm(
  source: string,
  term: string,
): boolean {
  const normalizedSource = normalizeInterestText(source);
  const normalizedTerm = normalizeInterestText(term);

  if (!normalizedTerm) return false;

  const termTokens = tokenizeInterestText(normalizedTerm);

  if (termTokens.length === 1) {
    const sourceTokens = new Set(
      tokenizeInterestText(normalizedSource),
    );

    return variants(termTokens[0] ?? "").some(
      (candidate) => sourceTokens.has(candidate),
    );
  }

  return variants(normalizedTerm).some(
    (candidate) =>
      normalizedSource.includes(candidate),
  );
}

function definitionMatches(
  sourceMessage: string,
  definition: InterestDefinition,
): boolean {
  const directTerms = [
    definition.id,
    definition.displayName.es,
    definition.displayName.en,
    ...definition.aliases,
  ];

  if (
    directTerms.some((term) =>
      containsTerm(sourceMessage, term),
    )
  ) {
    return true;
  }

  /*
   * Un término fuerte sí puede identificar una afición.
   * Un término de contexto no puede hacerlo por sí solo.
   */
  return definition.strongTerms.some((term) =>
    containsTerm(sourceMessage, term),
  );
}

function canonicalizeExistingInterest(
  value: string,
): readonly string[] {
  const definitions =
    defaultInterestBrain.resolve(value);

  if (definitions.length === 0) {
    return Object.freeze([value]);
  }

  return Object.freeze(
    definitions.map(canonicalGiftInterest),
  );
}

export function detectCanonicalGiftInterests(
  sourceMessage: string,
  existingInterests: readonly string[] = [],
): readonly string[] {
  const canonical = new Set<string>();

  for (const interest of existingInterests) {
    for (const resolved of canonicalizeExistingInterest(
      interest,
    )) {
      if (resolved.trim()) {
        canonical.add(resolved.trim());
      }
    }
  }

  for (const definition of defaultInterestBrain.list()) {
    if (
      definitionMatches(
        sourceMessage,
        definition,
      )
    ) {
      canonical.add(
        canonicalGiftInterest(definition),
      );
    }
  }

  return Object.freeze([...canonical]);
}

export function enrichGiftProfileInterests<
  T extends GiftProfileWithInterests,
>(
  profile: T,
  sourceMessage: string,
): T & {
  readonly interests: readonly string[];
} {
  return Object.freeze({
    ...profile,
    interests: detectCanonicalGiftInterests(
      sourceMessage,
      profile.interests ?? [],
    ),
  });
}
