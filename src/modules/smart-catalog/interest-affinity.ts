import {
  defaultInterestBrain,
  normalizeInterestText,
  tokenizeInterestText,
} from "../interest-brain/index.js";

export const normalizeSemanticText =
  normalizeInterestText;
export const tokenizeSemanticText =
  tokenizeInterestText;

export function expandInterestTerms(
  interests: readonly string[] | undefined,
): readonly string[] {
  const expansion =
    defaultInterestBrain.expand(interests);


  return Object.freeze([
    ...new Set([
      ...expansion.directTerms,
      ...expansion.strongTerms,
      ...expansion.contextTerms,
    ]),
  ]);
}

export interface ProductInterestEvidence {
  readonly canonicalInterests?: readonly string[];
  readonly name: string;
  readonly description?: string;
  readonly category: string;
  readonly tags: readonly string[];
}

export interface InterestAffinity {
  readonly score: number;
  readonly matchedTerms: readonly string[];
  readonly strongMatch: boolean;
  readonly evidence: readonly string[];
  readonly canonicalInterests?: readonly string[];
}

type TermTier =
  | "DIRECT"
  | "STRONG"
  | "CONTEXT";
type FieldName =
  | "name"
  | "category"
  | "tags"
  | "description";

const TIER_WEIGHT: Readonly<
  Record<TermTier, number>
> = Object.freeze({
  DIRECT: 1,
  STRONG: 0.72,
  CONTEXT: 0.22,
});

const FIELD_WEIGHT: Readonly<
  Record<FieldName, number>
> = Object.freeze({
  name: 1,
  category: 0.85,
  tags: 0.75,
  description: 0.45,
});

function containsTerm(
  value: string,
  term: string,
): boolean {
  const normalized =
    normalizeSemanticText(value);
  const tokens = new Set(
    tokenizeSemanticText(normalized),
  );
  const termTokens =
    tokenizeSemanticText(term);

  return termTokens.length === 1
    ? tokens.has(termTokens[0] ?? "")
    : normalized.includes(
        normalizeSemanticText(term),
      );
}

export function calculateProductInterestAffinity(
  product: ProductInterestEvidence,
  interests: readonly string[] | undefined,
): InterestAffinity {
  if (!interests || interests.length === 0) {
    return Object.freeze({
      score: 0.5,
      matchedTerms: Object.freeze([]),
      strongMatch: false,
      evidence: Object.freeze([]),
      canonicalInterests: Object.freeze([]),
    });
  }

  const expansion =
    defaultInterestBrain.expand(interests);

  const requestedCanonical =
    new Set<string>(
      expansion.canonicalIds,
    );

  const canonicalIntersection =
    (product.canonicalInterests ?? [])
      .filter((interestId: string) =>
        requestedCanonical.has(interestId),
      );

  if (canonicalIntersection.length > 0) {
    return Object.freeze({
      score: 1,
      matchedTerms:
        Object.freeze([
          ...canonicalIntersection,
        ]),
      strongMatch: true,
      evidence:
        Object.freeze(
          canonicalIntersection.map(
            (interestId: string) =>
              `${interestId} en canonicalInterests`,
          ),
        ),
      canonicalInterests:
        expansion.canonicalIds,
    });
  }

  const tiers: ReadonlyArray<
    readonly [TermTier, readonly string[]]
  > = [
    ["DIRECT", expansion.directTerms],
    ["STRONG", expansion.strongTerms],
    ["CONTEXT", expansion.contextTerms],
  ];

  const fields: Readonly<
    Record<FieldName, readonly string[]>
  > = Object.freeze({
    name: Object.freeze([product.name]),
    category: Object.freeze([
      product.category,
    ]),
    tags: product.tags,
    description: Object.freeze(
      product.description
        ? [product.description]
        : [],
    ),
  });

  const matches: Array<{
    term: string;
    tier: TermTier;
    field: FieldName;
    value: number;
  }> = [];

  for (const [tier, terms] of tiers) {
    for (const term of terms) {
      for (const field of Object.keys(
        fields,
      ) as FieldName[]) {
        if (
          fields[field].some((value) =>
            containsTerm(value, term),
          )
        ) {
          matches.push({
            term,
            tier,
            field,
            value:
              TIER_WEIGHT[tier] *
              FIELD_WEIGHT[field],
          });
        }
      }
    }
  }

  if (matches.length === 0) {
    return Object.freeze({
      score: 0,
      matchedTerms: Object.freeze([]),
      strongMatch: false,
      evidence: Object.freeze([]),
      canonicalInterests:
        expansion.canonicalIds,
    });
  }

  const strongestByTerm = new Map<
    string,
    (typeof matches)[number]
  >();

  for (const match of matches) {
    const current =
      strongestByTerm.get(match.term);

    if (
      !current ||
      match.value > current.value
    ) {
      strongestByTerm.set(
        match.term,
        match,
      );
    }
  }

  const unique = [
    ...strongestByTerm.values(),
  ].sort((left, right) =>
    right.value - left.value
  );

  const strongMatch = unique.some(
    (item) =>
      item.tier === "DIRECT" ||
      item.tier === "STRONG",
  );

  const best = unique[0]?.value ?? 0;
  const diversityBonus = Math.min(
    0.18,
    Math.max(0, unique.length - 1) *
      0.045,
  );

  const score = strongMatch
    ? Math.min(1, best + diversityBonus)
    : Math.min(
        0.24,
        best + diversityBonus,
      );

  return Object.freeze({
    score:
      Math.round(score * 1000) / 1000,
    matchedTerms: Object.freeze(
      unique.map((item) => item.term),
    ),
    strongMatch,
    evidence: Object.freeze(
      unique
        .slice(0, 5)
        .map(
          (item) =>
            `${item.term} en ${item.field}`,
        ),
    ),
    canonicalInterests:
      expansion.canonicalIds,
  });
}
