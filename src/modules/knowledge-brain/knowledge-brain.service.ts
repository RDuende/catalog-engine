import {
  defaultInterestBrain,
} from "../interest-brain/index.js";
import {
  KNOWLEDGE_TAXONOMY_V1,
} from "./knowledge-taxonomy.js";
import {
  resolveKnowledgeEntity,
} from "./knowledge-resolver.js";
import type {
  KnowledgeAnalyzeInput,
  KnowledgeEntityDefinition,
  KnowledgeEntityKind,
  KnowledgeEvidence,
  KnowledgeProfile,
} from "./knowledge-entity.types.js";

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

function idsForKind(
  evidence: readonly KnowledgeEvidence[],
  kind: KnowledgeEntityKind,
): readonly string[] {
  return unique(
    evidence
      .filter((item) => item.kind === kind)
      .map((item) => item.entityId),
  );
}

function hasContextRules(
  definition: KnowledgeEntityDefinition,
): boolean {
  return (
    (definition.requiresAny?.length ?? 0) > 0 ||
    (definition.requiresAll?.length ?? 0) > 0 ||
    (definition.excludesAny?.length ?? 0) > 0
  );
}

function shouldBlockFallback(
  definition: KnowledgeEntityDefinition,
): boolean {
  return (
    definition.kind === "INTEREST" &&
    hasContextRules(definition)
  );
}

export class KnowledgeBrainService {
  constructor(
    private readonly taxonomy:
      readonly KnowledgeEntityDefinition[] =
      KNOWLEDGE_TAXONOMY_V1,
  ) {}

  analyze(
    input: KnowledgeAnalyzeInput,
  ): KnowledgeProfile {
    const evidence: KnowledgeEvidence[] = [];
    const blockedFallbackInterests =
      new Set<string>();

    for (const definition of this.taxonomy) {
      const match = resolveKnowledgeEntity(
        input.text,
        definition,
      );

      if (match) {
        evidence.push(match);
        continue;
      }

      if (
        shouldBlockFallback(
          definition,
        )
      ) {
        blockedFallbackInterests.add(
          definition.id,
        );
      }
    }

    for (const match of
      defaultInterestBrain.match(
        input.text,
        16,
      )) {
      if (
        blockedFallbackInterests.has(
          match.interestId,
        )
      ) {
        continue;
      }

      if (
        evidence.some(
          (item) =>
            item.entityId ===
              match.interestId &&
            (
              item.kind === "MATERIAL" ||
              item.kind === "FEATURE"
            ),
        )
      ) {
        continue;
      }

      evidence.push(
        Object.freeze({
          entityId: match.interestId,
          kind: "INTEREST",
          confidence: match.confidence,
          source: "INTEREST_BRAIN",
          matchedTerms:
            match.matchedTerms,
        }),
      );
    }

    const existing = input.existing ?? {};

    return Object.freeze({
      interests: unique([
        ...(existing.interests ?? []),
        ...idsForKind(
          evidence,
          "INTEREST",
        ),
      ]),
      materials: unique([
        ...(existing.materials ?? []),
        ...idsForKind(
          evidence,
          "MATERIAL",
        ),
      ]),
      features: unique([
        ...(existing.features ?? []),
        ...idsForKind(
          evidence,
          "FEATURE",
        ),
      ]),
      professions: unique([
        ...(existing.professions ?? []),
        ...idsForKind(
          evidence,
          "PROFESSION",
        ),
      ]),
      themes: unique([
        ...(existing.themes ?? []),
        ...idsForKind(
          evidence,
          "THEME",
        ),
      ]),
      techniques: unique([
        ...(existing.techniques ?? []),
        ...idsForKind(
          evidence,
          "TECHNIQUE",
        ),
      ]),
      occasions: unique([
        ...(existing.occasions ?? []),
        ...idsForKind(
          evidence,
          "OCCASION",
        ),
      ]),
      recipients: unique([
        ...(existing.recipients ?? []),
        ...idsForKind(
          evidence,
          "RECIPIENT",
        ),
      ]),
      objects: unique([
        ...(existing.objects ?? []),
        ...idsForKind(
          evidence,
          "OBJECT",
        ),
      ]),
      brands: unique([
        ...(existing.brands ?? []),
        ...idsForKind(
          evidence,
          "BRAND",
        ),
      ]),
      licenses: unique([
        ...(existing.licenses ?? []),
        ...idsForKind(
          evidence,
          "LICENSE",
        ),
      ]),
      evidence: Object.freeze(
        [...evidence].sort(
          (left, right) =>
            right.confidence -
              left.confidence ||
            left.entityId.localeCompare(
              right.entityId,
            ),
        ),
      ),
      version: "1.0",
    });
  }

  listTaxonomy():
    readonly KnowledgeEntityDefinition[] {
    return this.taxonomy;
  }
}

export const defaultKnowledgeBrain =
  new KnowledgeBrainService();
