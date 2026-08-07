import { INTEREST_BRAIN_V1 } from "./interest-brain.data.js";
import type {
  InterestDefinition,
  InterestExpansion,
  InterestMatch,
} from "./interest-brain.types.js";

export function normalizeInterestText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase()
    .trim();
}

export function tokenizeInterestText(
  value: string,
): readonly string[] {
  return Object.freeze(
    normalizeInterestText(value)
      .split(/[^a-z0-9]+/u)
      .filter(Boolean),
  );
}

function containsTerm(
  normalizedText: string,
  term: string,
): boolean {
  const normalizedTerm = normalizeInterestText(term);
  if (!normalizedTerm) return false;

  const termTokens = tokenizeInterestText(normalizedTerm);
  if (termTokens.length === 1) {
    return new Set(tokenizeInterestText(normalizedText)).has(
      termTokens[0] ?? "",
    );
  }

  return normalizedText.includes(normalizedTerm);
}

function unique(values: readonly string[]): readonly string[] {
  return Object.freeze([
    ...new Set(
      values
        .map(normalizeInterestText)
        .filter(Boolean),
    ),
  ]);
}

export class InterestBrainService {
  readonly #definitions: readonly InterestDefinition[];
  readonly #byId = new Map<string, InterestDefinition>();
  readonly #byAlias = new Map<string, InterestDefinition[]>();

  constructor(
    definitions: readonly InterestDefinition[] =
      INTEREST_BRAIN_V1,
  ) {
    this.#definitions = Object.freeze([...definitions]);

    for (const definition of this.#definitions) {
      this.#byId.set(
        normalizeInterestText(definition.id),
        definition,
      );

      for (const term of [
        definition.id,
        definition.displayName.es,
        definition.displayName.en,
        ...definition.aliases,
      ]) {
        const normalized = normalizeInterestText(term);
        const current = this.#byAlias.get(normalized) ?? [];
        this.#byAlias.set(
          normalized,
          [...current, definition],
        );
      }
    }
  }

  list(): readonly InterestDefinition[] {
    return this.#definitions;
  }

  get(id: string): InterestDefinition | undefined {
    return this.#byId.get(normalizeInterestText(id));
  }

  resolve(
    value: string,
  ): readonly InterestDefinition[] {
    const normalized = normalizeInterestText(value);
    const exact = this.#byAlias.get(normalized);
    if (exact?.length) return Object.freeze([...exact]);

    return Object.freeze(
      this.#definitions.filter((definition) =>
        [
          definition.id,
          definition.displayName.es,
          definition.displayName.en,
          ...definition.aliases,
        ].some((term) =>
          containsTerm(normalized, term),
        ),
      ),
    );
  }

  expand(
    interests: readonly string[] | undefined,
  ): InterestExpansion {
    const canonicalIds = new Set<string>();
    const directTerms = new Set<string>();
    const strongTerms = new Set<string>();
    const contextTerms = new Set<string>();

    for (const raw of interests ?? []) {
      const normalized = normalizeInterestText(raw);
      if (!normalized) continue;
      directTerms.add(normalized);

      const definitions = this.resolve(normalized);

      if (definitions.length === 0) {
        continue;
      }

      for (const definition of definitions) {
        canonicalIds.add(definition.id);

        for (const term of [
          definition.id,
          definition.displayName.es,
          definition.displayName.en,
          ...definition.aliases,
        ]) {
          directTerms.add(normalizeInterestText(term));
        }

        for (const term of definition.strongTerms) {
          strongTerms.add(normalizeInterestText(term));
        }

        for (const term of definition.contextTerms) {
          contextTerms.add(normalizeInterestText(term));
        }
      }
    }

    return Object.freeze({
      canonicalIds: Object.freeze([...canonicalIds]),
      directTerms: Object.freeze([...directTerms]),
      strongTerms: Object.freeze([...strongTerms]),
      contextTerms: Object.freeze([...contextTerms]),
    });
  }

  match(
    text: string,
    limit = 8,
  ): readonly InterestMatch[] {
    const normalized = normalizeInterestText(text);
    const matches: InterestMatch[] = [];

    for (const definition of this.#definitions) {
      const direct = unique([
        definition.id,
        definition.displayName.es,
        definition.displayName.en,
        ...definition.aliases,
      ]).filter((term) =>
        containsTerm(normalized, term),
      );

      const strong = unique(
        definition.strongTerms,
      ).filter((term) =>
        containsTerm(normalized, term),
      );

      const context = unique(
        definition.contextTerms,
      ).filter((term) =>
        containsTerm(normalized, term),
      );

      if (
        direct.length === 0 &&
        strong.length === 0
      ) {
        continue;
      }

      const confidence = Math.min(
        1,
        (direct.length > 0 ? 0.78 : 0) +
          Math.min(0.18, strong.length * 0.09) +
          Math.min(0.04, context.length * 0.02),
      );

      matches.push(
        Object.freeze({
          interestId: definition.id,
          displayName: definition.displayName.es,
          domain: definition.domain,
          confidence:
            Math.round(confidence * 1000) / 1000,
          matchedTerms: Object.freeze([
            ...direct,
            ...strong,
            ...context,
          ]),
          evidence: Object.freeze([
            ...direct.map(
              (term) => `${term}:DIRECT`,
            ),
            ...strong.map(
              (term) => `${term}:STRONG`,
            ),
            ...context.map(
              (term) => `${term}:CONTEXT`,
            ),
          ]),
        }),
      );
    }

    return Object.freeze(
      matches
        .sort(
          (left, right) =>
            right.confidence - left.confidence ||
            left.interestId.localeCompare(
              right.interestId,
            ),
        )
        .slice(0, Math.max(1, limit)),
    );
  }
}

export const defaultInterestBrain =
  new InterestBrainService();
