import {
  defaultInterestBrain,
  normalizeInterestText,
} from "../interest-brain/index.js";
import type {
  InterestDefinition,
} from "../interest-brain/index.js";
import {
  defaultKnowledgeBrain,
} from "../knowledge-brain/index.js";
import type {
  KnowledgeEvidence,
  KnowledgeProfile,
} from "../knowledge-brain/index.js";
import type {
  CanonicalInterestEvidence,
  CatalogInterestCoverage,
  CatalogInterestEnrichmentChange,
  CatalogInterestEnrichmentOptions,
  CatalogInterestEnrichmentReport,
  EnrichableCatalogProduct,
  EnrichedCatalogProduct,
} from "./catalog-interest-enrichment.types.js";

const TAXONOMY_VERSION =
  "interest-brain-v1" as const;

function unique(
  values: readonly string[],
): readonly string[] {
  return Object.freeze(
    [...new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean),
    )],
  );
}

function stringsFromUnknown(
  value: unknown,
): readonly string[] {
  if (typeof value === "string") {
    return Object.freeze([value]);
  }

  if (Array.isArray(value)) {
    return Object.freeze(
      value.flatMap(stringsFromUnknown),
    );
  }

  if (!value || typeof value !== "object") {
    return Object.freeze([]);
  }

  return Object.freeze(
    Object.values(value)
      .flatMap(stringsFromUnknown),
  );
}

function productText(
  product: EnrichableCatalogProduct,
): string {
  return [
    product.name,
    product.description ?? "",
    product.category ?? "",
    ...(product.tags ?? []),
  ].join(" ");
}

function productBrainText(
  product: EnrichableCatalogProduct,
): string {
  return stringsFromUnknown(
    product.productBrain,
  ).join(" ");
}

function definitionFor(
  interestId: string,
): InterestDefinition | undefined {
  return defaultInterestBrain.get(interestId);
}

function evidenceForExisting(
  interest: string,
): readonly CanonicalInterestEvidence[] {
  const definitions =
    defaultInterestBrain.resolve(interest);

  if (definitions.length === 0) {
    return Object.freeze([]);
  }

  return Object.freeze(
    definitions.map((definition) =>
      Object.freeze({
        interestId: definition.id,
        confidence: 1,
        source: "EXISTING_INTEREST" as const,
        matchedTerms: Object.freeze([
          normalizeInterestText(interest),
        ]),
        evidence: Object.freeze([
          `${interest}:EXISTING_INTEREST`,
        ]),
        taxonomyVersion: TAXONOMY_VERSION,
      }),
    ),
  );
}

function evidenceForManual(
  interestId: string,
): CanonicalInterestEvidence {
  return Object.freeze({
    interestId,
    confidence: 1,
    source: "MANUAL",
    matchedTerms: Object.freeze([]),
    evidence: Object.freeze([
      `${interestId}:MANUAL`,
    ]),
    taxonomyVersion: TAXONOMY_VERSION,
  });
}

function knowledgeEvidenceToCanonical(
  evidence: KnowledgeEvidence,
  origin: "PRODUCT_TEXT" | "PRODUCT_BRAIN",
): CanonicalInterestEvidence {
  return Object.freeze({
    interestId: evidence.entityId,
    confidence: evidence.confidence,
    source:
      origin === "PRODUCT_BRAIN"
        ? "PRODUCT_BRAIN"
        : "KNOWLEDGE_BRAIN",
    matchedTerms: evidence.matchedTerms,
    evidence: Object.freeze([
      `${evidence.entityId}:${evidence.kind}:${evidence.source}`,
      `origin:${origin}`,
      ...(evidence.rule
        ? [`rule:${evidence.rule}`]
        : []),
    ]),
    taxonomyVersion: TAXONOMY_VERSION,
  });
}

function canonicalEvidenceFromProfile(
  profile: KnowledgeProfile,
  origin: "PRODUCT_TEXT" | "PRODUCT_BRAIN",
): readonly CanonicalInterestEvidence[] {
  const allowed = new Set<string>([
    ...profile.interests,
    ...profile.themes,
  ]);

  return Object.freeze(
    profile.evidence
      .filter((item) =>
        allowed.has(item.entityId),
      )
      .map((item) =>
        knowledgeEvidenceToCanonical(
          item,
          origin,
        ),
      ),
  );
}

function analyzeKnowledge(
  text: string,
  origin: "PRODUCT_TEXT" | "PRODUCT_BRAIN",
): readonly CanonicalInterestEvidence[] {
  if (!text.trim()) {
    return Object.freeze([]);
  }

  return canonicalEvidenceFromProfile(
    defaultKnowledgeBrain.analyze({
      text,
    }),
    origin,
  );
}

function strongestEvidence(
  evidence:
    readonly CanonicalInterestEvidence[],
): readonly CanonicalInterestEvidence[] {
  const strongest =
    new Map<string, CanonicalInterestEvidence>();

  for (const item of evidence) {
    const current =
      strongest.get(item.interestId);

    if (
      !current ||
      item.confidence >
        current.confidence ||
      (
        item.confidence ===
          current.confidence &&
        current.source !== "MANUAL" &&
        item.source === "MANUAL"
      )
    ) {
      strongest.set(
        item.interestId,
        item,
      );
    }
  }

  return Object.freeze(
    [...strongest.values()].sort(
      (left, right) =>
        right.confidence -
          left.confidence ||
        left.interestId.localeCompare(
          right.interestId,
        ),
    ),
  );
}

export class CatalogInterestEnrichmentService {
  enrichProduct(
    product: EnrichableCatalogProduct,
    options:
      CatalogInterestEnrichmentOptions = {},
  ): EnrichedCatalogProduct {
    const minimumConfidence =
      options.minimumConfidence ?? 0.72;
    const maxInterests =
      Math.max(
        1,
        options.maxInterestsPerProduct ?? 8,
      );
    const preserveManual =
      options.preserveManual !== false;
    const now =
      options.now ??
      new Date().toISOString();

    const manual =
      preserveManual
        ? unique(
            product.canonicalInterests ?? [],
          )
        : Object.freeze([]);

    const evidence:
      CanonicalInterestEvidence[] = [];

    for (const interestId of manual) {
      evidence.push(
        evidenceForManual(interestId),
      );
    }

    for (const interest of
      product.interests ?? []) {
      evidence.push(
        ...evidenceForExisting(interest),
      );
    }

    for (const item of analyzeKnowledge(
      productText(product),
      "PRODUCT_TEXT",
    )) {
      if (
        item.confidence >=
          minimumConfidence
      ) {
        evidence.push(item);
      }
    }

    const brainText =
      productBrainText(product);

    for (const item of analyzeKnowledge(
      brainText,
      "PRODUCT_BRAIN",
    )) {
      if (
        item.confidence >=
          minimumConfidence
      ) {
        evidence.push(item);
      }
    }

    const selected =
      strongestEvidence(evidence)
        .slice(0, maxInterests);

    return Object.freeze({
      ...product,
      canonicalInterests:
        Object.freeze(
          selected.map(
            (item) => item.interestId,
          ),
        ),
      canonicalInterestEvidence:
        selected,
      canonicalInterestEnrichment:
        Object.freeze({
          version: "1.0",
          taxonomyVersion:
            TAXONOMY_VERSION,
          enrichedAt: now,
          automaticCount:
            selected.filter(
              (item) =>
                item.source !== "MANUAL",
            ).length,
          manualCount:
            selected.filter(
              (item) =>
                item.source === "MANUAL",
            ).length,
        }),
    });
  }

  enrichCatalog(
    products:
      readonly EnrichableCatalogProduct[],
    options:
      CatalogInterestEnrichmentOptions = {},
  ): {
    readonly products:
      readonly EnrichedCatalogProduct[];
    readonly report:
      CatalogInterestEnrichmentReport;
  } {
    const now =
      options.now ??
      new Date().toISOString();

    const enriched =
      products.map((product) =>
        this.enrichProduct(product, {
          ...options,
          now,
        }),
      );

    const changes:
      CatalogInterestEnrichmentChange[] =
        [];

    let addedAssignments = 0;

    for (
      let index = 0;
      index < products.length;
      index += 1
    ) {
      const product = products[index];
      const next = enriched[index];

      if (!product || !next) continue;

      const before = unique(
        product.canonicalInterests ?? [],
      );
      const after =
        next.canonicalInterests;
      const added = after.filter(
        (interestId) =>
          !before.includes(interestId),
      );

      if (
        JSON.stringify(before) !==
        JSON.stringify(after)
      ) {
        addedAssignments += added.length;

        changes.push(
          Object.freeze({
            productId: product.id,
            ...(product.sku
              ? { sku: product.sku }
              : {}),
            name: product.name,
            before,
            after,
            added: Object.freeze(added),
            evidence:
              next.canonicalInterestEvidence,
          }),
        );
      }
    }

    const before =
      this.coverage(products);
    const after =
      this.coverage(enriched);

    return Object.freeze({
      products:
        Object.freeze(enriched),
      report: Object.freeze({
        version: "1.0",
        taxonomyVersion:
          TAXONOMY_VERSION,
        generatedAt: now,
        totalProducts: products.length,
        changedProducts:
          changes.length,
        unchangedProducts:
          products.length -
          changes.length,
        addedAssignments,
        before,
        after,
        changes:
          Object.freeze(changes),
      }),
    });
  }

  coverage(
    products:
      readonly EnrichableCatalogProduct[],
  ): CatalogInterestCoverage {
    const interestCounts:
      Record<string, number> = {};
    const domainCounts:
      Record<string, number> = {};

    let withInterests = 0;

    for (const product of products) {
      const interests = unique(
        product.canonicalInterests ?? [],
      );

      if (interests.length > 0) {
        withInterests += 1;
      }

      for (const interestId of interests) {
        interestCounts[interestId] =
          (interestCounts[interestId] ?? 0) +
          1;

        const definition =
          definitionFor(interestId);
        const domain =
          definition?.domain ??
          "unknown";

        domainCounts[domain] =
          (domainCounts[domain] ?? 0) +
          1;
      }
    }

    const total = products.length;

    return Object.freeze({
      totalProducts: total,
      productsWithCanonicalInterests:
        withInterests,
      productsWithoutCanonicalInterests:
        total - withInterests,
      coveragePercent:
        total === 0
          ? 0
          : Math.round(
              (withInterests / total) *
                10000,
            ) / 100,
      interestCounts:
        Object.freeze(interestCounts),
      domainCounts:
        Object.freeze(domainCounts),
    });
  }
}

export const
  defaultCatalogInterestEnrichment =
    new CatalogInterestEnrichmentService();
