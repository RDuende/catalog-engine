import {
  randomUUID,
} from "node:crypto";

import {
  discoverNextQuestion,
} from "./memory-discovery.js";
import {
  extractMemoryFacts,
} from "./memory-extractor.js";
import {
  normalizeMemoryValue,
} from "./memory-normalizer.js";
import {
  resolveFactConflict,
} from "./memory-conflict-resolver.js";
import {
  InMemoryMemoryStore,
} from "./memory-store.js";
import type {
  JourneyMemory,
  MemoryDecision,
  MemoryFact,
  MemoryFactInput,
  MemoryMessageInput,
  MemoryQuestion,
  MemorySnapshot,
  MemoryStore,
} from "./memory-brain.types.js";

function initialMemory(
  journeyId: string,
  ownerId: string,
  now: string,
): JourneyMemory {
  return Object.freeze({
    journeyId,
    ownerId,
    version: 1,
    facts: Object.freeze([]),
    questions: Object.freeze([]),
    decisions: Object.freeze([]),
    seenProposalIds: Object.freeze([]),
    rejectedProductIds:
      Object.freeze([]),
    selectedProductIds:
      Object.freeze([]),
    createdAt: now,
    updatedAt: now,
  });
}

function factFromInput(
  input: MemoryFactInput,
  message: MemoryMessageInput,
  now: string,
  supersedesFactId?: string,
): MemoryFact {
  return Object.freeze({
    id: randomUUID(),
    kind: input.kind,
    key: input.key,
    value: input.value,
    normalizedValue:
      normalizeMemoryValue(input.value),
    confidence:
      Math.max(
        0,
        Math.min(
          1,
          input.confidence ?? 0.8,
        ),
      ),
    status:
      input.confirmed === false
        ? "INFERRED"
        : "CONFIRMED",
    sourceMessageId: message.id,
    sourceText: message.text,
    createdAt: now,
    updatedAt: now,
    ...(supersedesFactId
      ? { supersedesFactId }
      : {}),
    ...(input.metadata
      ? { metadata: input.metadata }
      : {}),
  });
}

export class MemoryBrainService {
  constructor(
    private readonly store:
      MemoryStore =
      new InMemoryMemoryStore(),
  ) {}

  async getOrCreate(
    journeyId: string,
    ownerId: string,
  ): Promise<JourneyMemory> {
    const current =
      await this.store.get(
        journeyId,
        ownerId,
      );

    if (current) return current;

    const now = new Date().toISOString();
    const created =
      initialMemory(
        journeyId,
        ownerId,
        now,
      );

    await this.store.save(created);
    return created;
  }

  async ingestMessage(
    journeyId: string,
    ownerId: string,
    message: MemoryMessageInput,
  ): Promise<JourneyMemory> {
    const current =
      await this.getOrCreate(
        journeyId,
        ownerId,
      );

    const now =
      message.createdAt ??
      new Date().toISOString();

    const incoming = [
      ...extractMemoryFacts(
        message.text,
      ),
      ...(message.extractedFacts ?? []),
    ];

    let facts =
      [...current.facts];
    let questions =
      [...current.questions];

    for (const input of incoming) {
      const resolution =
        resolveFactConflict(
          facts,
          input,
        );

      if (resolution.duplicateFactId) {
        facts = facts.map((fact) =>
          fact.id ===
            resolution.duplicateFactId
            ? Object.freeze({
                ...fact,
                confidence:
                  Math.max(
                    fact.confidence,
                    input.confidence ??
                      fact.confidence,
                  ),
                status:
                  input.confirmed === false
                    ? fact.status
                    : "CONFIRMED",
                updatedAt: now,
              })
            : fact,
        );
        continue;
      }

      if (
        resolution
          .supersededFactIds
          .length > 0
      ) {
        facts = facts.map((fact) =>
          resolution
            .supersededFactIds
            .includes(fact.id)
            ? Object.freeze({
                ...fact,
                status:
                  "SUPERSEDED" as const,
                updatedAt: now,
              })
            : fact,
        );
      }

      facts.push(
        factFromInput(
          input,
          message,
          now,
          resolution
            .supersededFactIds[0],
        ),
      );

      questions = questions.map(
        (question) =>
          question.key === input.key &&
          question.askedAt &&
          !question.answeredAt
            ? Object.freeze({
                ...question,
                answeredAt: now,
              })
            : question,
      );
    }

    const updated: JourneyMemory =
      Object.freeze({
        ...current,
        version:
          current.version + 1,
        facts: Object.freeze(facts),
        questions:
          Object.freeze(questions),
        updatedAt: now,
      });

    await this.store.save(updated);
    return updated;
  }

  async askQuestion(
    journeyId: string,
    ownerId: string,
    question: MemoryQuestion,
  ): Promise<JourneyMemory> {
    const current =
      await this.getOrCreate(
        journeyId,
        ownerId,
      );
    const now =
      new Date().toISOString();

    const alreadyAsked =
      current.questions.some(
        (item) =>
          item.key === question.key &&
          item.askedAt,
      );

    if (alreadyAsked) {
      return current;
    }

    const updated =
      Object.freeze({
        ...current,
        version:
          current.version + 1,
        questions: Object.freeze([
          ...current.questions,
          Object.freeze({
            ...question,
            askedAt: now,
          }),
        ]),
        updatedAt: now,
      });

    await this.store.save(updated);
    return updated;
  }

  async recordDecision(
    journeyId: string,
    ownerId: string,
    decision: Omit<
      MemoryDecision,
      "id" | "createdAt"
    >,
  ): Promise<JourneyMemory> {
    const current =
      await this.getOrCreate(
        journeyId,
        ownerId,
      );
    const now =
      new Date().toISOString();

    const nextDecision:
      MemoryDecision =
      Object.freeze({
        ...decision,
        id: randomUUID(),
        createdAt: now,
      });

    const rejected =
      decision.type === "REJECTED" ||
      decision.type === "DISMISSED"
        ? [
            ...new Set([
              ...current
                .rejectedProductIds,
              decision.targetId,
            ]),
          ]
        : current.rejectedProductIds;

    const selected =
      decision.type === "SELECTED" ||
      decision.type === "ACCEPTED"
        ? [
            ...new Set([
              ...current
                .selectedProductIds,
              decision.targetId,
            ]),
          ]
        : current.selectedProductIds;

    const updated =
      Object.freeze({
        ...current,
        version:
          current.version + 1,
        decisions: Object.freeze([
          ...current.decisions,
          nextDecision,
        ]),
        rejectedProductIds:
          Object.freeze(rejected),
        selectedProductIds:
          Object.freeze(selected),
        updatedAt: now,
      });

    await this.store.save(updated);
    return updated;
  }

  snapshot(
    memory: JourneyMemory,
  ): MemorySnapshot {
    const active =
      memory.facts.filter(
        (fact) =>
          fact.status ===
            "CONFIRMED" ||
          fact.status ===
            "INFERRED",
      );

    const values = (
      key: string,
    ): readonly MemoryFact[] =>
      active.filter(
        (fact) => fact.key === key,
      );

    const lastNumber = (
      key: string,
    ): number | undefined => {
      const value =
        values(key).at(-1)?.value;
      return typeof value === "number"
        ? value
        : undefined;
    };

    const textValues = (
      key: string,
    ): readonly string[] =>
      Object.freeze(
        values(key)
          .map((fact) =>
            String(fact.value),
          ),
      );

    return Object.freeze({
      journeyId: memory.journeyId,
      profile: Object.freeze({
        recipients:
          textValues("recipient"),
        ...(lastNumber(
          "recipient-count",
        ) !== undefined
          ? {
              recipientCount:
                lastNumber(
                  "recipient-count",
                ),
            }
          : {}),
        relationships:
          textValues("relationship"),
        ages: Object.freeze(
          values("age")
            .map((fact) =>
              Number(fact.value),
            )
            .filter(Number.isFinite),
        ),
        interests:
          textValues("interest"),
        ...(lastNumber("budget") !==
        undefined
          ? {
              budget:
                lastNumber("budget"),
            }
          : {}),
        occasions:
          textValues("occasion"),
        preferredMaterials:
          textValues(
            "preferred-material",
          ),
        preferredProducts:
          textValues(
            "preferred-product",
          ),
        rejectedProducts:
          textValues(
            "rejected-product",
          ),
        styles:
          textValues("style"),
      }),
      discovery:
        discoverNextQuestion(memory),
      unansweredQuestions:
        Object.freeze(
          memory.questions.filter(
            (question) =>
              question.askedAt &&
              !question.answeredAt &&
              !question.skippedAt,
          ),
        ),
      decisions:
        memory.decisions,
    });
  }
}

export const defaultMemoryBrain =
  new MemoryBrainService();
