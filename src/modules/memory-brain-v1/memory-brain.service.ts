import {
  createHash,
} from "node:crypto";

import {
  resolveMemoryConflict,
} from "./memory-conflict.js";
import {
  JsonFileMemoryStore,
  type MemoryStore,
} from "./memory-store.js";
import type {
  ConversationMemoryInput,
  GiftHistoryInput,
  MemoryLearnInput,
  MemoryLearnResult,
  MemoryQuery,
  MemoryRecord,
  MemorySnapshot,
} from "./memory-brain.types.js";

function clamp(
  value: number,
): number {
  return Math.max(
    0,
    Math.min(1, value),
  );
}

function nowIso(): string {
  return new Date().toISOString();
}

function memoryId(
  input: MemoryLearnInput,
): string {
  return `memory-${createHash("sha1")
    .update(
      `${input.subjectKey}:${input.kind}:${input.key}:${JSON.stringify(input.value)}:${Date.now()}`,
    )
    .digest("hex")
    .slice(0, 14)}`;
}

function expired(
  record: MemoryRecord,
): boolean {
  return Boolean(
    record.validUntil &&
    Date.parse(record.validUntil) <
      Date.now(),
  );
}

function mergeValues(
  left: unknown,
  right: unknown,
): unknown {
  if (
    Array.isArray(left) &&
    Array.isArray(right)
  ) {
    return Object.freeze([
      ...new Set([
        ...left,
        ...right,
      ]),
    ]);
  }

  return right;
}

export class MemoryBrainService {
  constructor(
    private readonly store:
      MemoryStore =
      new JsonFileMemoryStore(),
  ) {}

  async query(
    query: MemoryQuery = {},
  ): Promise<
    readonly MemoryRecord[]
  > {
    const records =
      await this.store.list();

    return Object.freeze(
      records
        .filter(
          (record) =>
            !query.subjectKey ||
            record.subjectKey ===
              query.subjectKey,
        )
        .filter(
          (record) =>
            !query.kinds?.length ||
            query.kinds.includes(
              record.kind,
            ),
        )
        .filter(
          (record) =>
            !query.keys?.length ||
            query.keys.includes(
              record.key,
            ),
        )
        .filter(
          (record) =>
            record.confidence >=
            (
              query.minConfidence ??
              0
            ),
        )
        .filter(
          (record) =>
            query.includeExpired ||
            !expired(record),
        )
        .sort(
          (left, right) =>
            right.updatedAt.localeCompare(
              left.updatedAt,
            ),
        ),
    );
  }

  async learn(
    input: MemoryLearnInput,
  ): Promise<MemoryLearnResult> {
    const records =
      [...await this.store.list()];

    const now =
      nowIso();

    const incoming:
      MemoryRecord =
      Object.freeze({
        id:
          memoryId(input),
        subjectKey:
          input.subjectKey,
        kind:
          input.kind,
        scope:
          input.scope ??
          "RECIPIENT",
        key:
          input.key,
        value:
          input.value,
        confidence:
          clamp(
            input.confidence ??
            0.8,
          ),
        source:
          input.source ??
          "CONVERSATION",
        ...(input.sourceRef
          ? {
              sourceRef:
                input.sourceRef,
            }
          : {}),
        learnedAt:
          now,
        updatedAt:
          now,
        ...(input.validUntil
          ? {
              validUntil:
                input.validUntil,
            }
          : {}),
        tags:
          Object.freeze(
            input.tags ?? [],
          ),
        ...(input.metadata
          ? {
              metadata:
                input.metadata,
            }
          : {}),
      });

    const previous =
      records
        .filter(
          (record) =>
            record.subjectKey ===
              incoming.subjectKey &&
            record.key ===
              incoming.key &&
            !expired(record),
        )
        .sort(
          (left, right) =>
            right.updatedAt.localeCompare(
              left.updatedAt,
            ),
        )[0];

    if (!previous) {
      records.push(incoming);
      await this.store.save(
        records,
      );

      return Object.freeze({
        record:
          incoming,
      });
    }

    const conflict =
      resolveMemoryConflict(
        previous,
        incoming,
      );

    if (!conflict) {
      const merged:
        MemoryRecord =
        Object.freeze({
          ...previous,
          value:
            mergeValues(
              previous.value,
              incoming.value,
            ),
          confidence:
            Math.max(
              previous.confidence,
              incoming.confidence,
            ),
          updatedAt:
            now,
          tags:
            Object.freeze([
              ...new Set([
                ...previous.tags,
                ...incoming.tags,
              ]),
            ]),
        });

      const index =
        records.findIndex(
          (record) =>
            record.id ===
            previous.id,
        );

      if (index >= 0) {
        records[index] =
          merged;
      }

      await this.store.save(
        records,
      );

      return Object.freeze({
        record:
          merged,
      });
    }

    if (
      conflict.resolution ===
      "KEEP_PREVIOUS"
    ) {
      return Object.freeze({
        record:
          previous,
        conflict,
      });
    }

    if (
      conflict.resolution ===
      "MERGE"
    ) {
      const merged:
        MemoryRecord =
        Object.freeze({
          ...previous,
          value:
            mergeValues(
              previous.value,
              incoming.value,
            ),
          confidence:
            Math.max(
              previous.confidence,
              incoming.confidence,
            ),
          updatedAt:
            now,
          tags:
            Object.freeze([
              ...new Set([
                ...previous.tags,
                ...incoming.tags,
              ]),
            ]),
        });

      const index =
        records.findIndex(
          (record) =>
            record.id ===
            previous.id,
        );

      if (index >= 0) {
        records[index] =
          merged;
      }

      await this.store.save(
        records,
      );

      return Object.freeze({
        record:
          merged,
        conflict,
        replaced:
          previous,
      });
    }

    if (
      conflict.resolution ===
      "USE_INCOMING"
    ) {
      const replacement:
        MemoryRecord =
        Object.freeze({
          ...incoming,
          supersedes:
            previous.id,
        });

      records.push(
        replacement,
      );

      await this.store.save(
        records,
      );

      return Object.freeze({
        record:
          replacement,
        conflict,
        replaced:
          previous,
      });
    }

    records.push(incoming);
    await this.store.save(
      records,
    );

    return Object.freeze({
      record:
        incoming,
      conflict,
    });
  }

  async learnConversation(
    input: ConversationMemoryInput,
  ): Promise<
    readonly MemoryLearnResult[]
  > {
    const subjectKey =
      input.recipientLabel
        ? `recipient:${input.recipientLabel.toLowerCase()}`
        : input.conversationId
          ? `conversation:${input.conversationId}`
          : "recipient:unknown";

    const items:
      MemoryLearnInput[] = [];

    if (input.recipientLabel) {
      items.push({
        subjectKey,
        kind: "RECIPIENT",
        key:
          "recipientLabel",
        value:
          input.recipientLabel,
        confidence: 0.98,
        source:
          "USER_EXPLICIT",
        sourceRef:
          input.conversationId,
      });
    }

    if (input.relationship) {
      items.push({
        subjectKey,
        kind:
          "RELATIONSHIP",
        key:
          "relationship",
        value:
          input.relationship,
        confidence: 0.92,
        source:
          "CONVERSATION",
        sourceRef:
          input.conversationId,
      });
    }

    if (
      input.interests?.length
    ) {
      items.push({
        subjectKey,
        kind:
          "INTEREST",
        key:
          "interests",
        value:
          Object.freeze(
            input.interests,
          ),
        confidence: 0.9,
        source:
          "CONVERSATION",
        sourceRef:
          input.conversationId,
        tags:
          ["profile"],
      });
    }

    if (
      input.personality?.length
    ) {
      items.push({
        subjectKey,
        kind:
          "PREFERENCE",
        key:
          "personality",
        value:
          Object.freeze(
            input.personality,
          ),
        confidence: 0.82,
        source:
          "INFERENCE",
        sourceRef:
          input.conversationId,
      });
    }

    if (
      input.desiredImpact?.length
    ) {
      items.push({
        subjectKey,
        kind:
          "PREFERENCE",
        key:
          "desiredImpact",
        value:
          Object.freeze(
            input.desiredImpact,
          ),
        confidence: 0.78,
        source:
          "CONVERSATION",
        sourceRef:
          input.conversationId,
      });
    }

    if (
      input.budget !==
      undefined
    ) {
      items.push({
        subjectKey,
        kind:
          "BUDGET_PATTERN",
        key:
          "budget",
        value:
          input.budget,
        confidence: 0.72,
        source:
          "CONVERSATION",
        sourceRef:
          input.conversationId,
        tags:
          ["historical-pattern"],
      });
    }

    if (input.occasion) {
      items.push({
        subjectKey,
        kind:
          "OCCASION",
        key:
          `occasion:${input.occasion}`,
        value:
          Object.freeze({
            occasion:
              input.occasion,
            learnedAt:
              nowIso(),
          }),
        confidence: 0.75,
        source:
          "CONVERSATION",
        sourceRef:
          input.conversationId,
      });
    }

    const results:
      MemoryLearnResult[] =
      [];

    for (const item of items) {
      results.push(
        await this.learn(item),
      );
    }

    return Object.freeze(
      results,
    );
  }

  async rememberGift(
    input: GiftHistoryInput,
  ): Promise<MemoryLearnResult> {
    return this.learn({
      subjectKey:
        input.subjectKey,
      kind:
        "GIFT_HISTORY",
      key:
        `gift:${input.orderId ?? input.proposalId ?? Date.now().toString(36)}`,
      value:
        Object.freeze({
          products:
            input.products,
          ...(input.occasion
            ? {
                occasion:
                  input.occasion,
              }
            : {}),
          giftedAt:
            input.giftedAt ??
            nowIso(),
          ...(input.total !==
          undefined
            ? {
                total:
                  input.total,
              }
            : {}),
        }),
      confidence: 1,
      source: "ORDER",
      sourceRef:
        input.orderId ??
        input.proposalId,
      tags:
        ["gift-history"],
      metadata:
        input.metadata,
    });
  }

  async snapshot(
    subjectKey: string,
  ): Promise<MemorySnapshot> {
    const records =
      await this.query({
        subjectKey,
        minConfidence: 0.35,
      });

    const interests =
      records
        .filter(
          (record) =>
            record.kind ===
            "INTEREST",
        )
        .flatMap(
          (record) =>
            Array.isArray(
              record.value,
            )
              ? record.value
                  .filter(
                    (
                      value,
                    ): value is string =>
                      typeof value ===
                      "string",
                  )
              : [],
        );

    const gifts =
      records.filter(
        (record) =>
          record.kind ===
          "GIFT_HISTORY",
      );

    const budgets =
      records
        .filter(
          (record) =>
            record.kind ===
              "BUDGET_PATTERN" &&
            typeof record.value ===
              "number",
        )
        .map(
          (record) =>
            record.value as number,
        );

    const averageBudget =
      budgets.length
        ? budgets.reduce<number>(
            (
              sum,
              value,
            ) =>
              sum + value,
            0,
          ) /
          budgets.length
        : undefined;

    return Object.freeze({
      generatedAt:
        nowIso(),
      subjectKey,
      records,
      summary:
        Object.freeze({
          interests:
            Object.freeze([
              ...new Set(
                interests,
              ),
            ]),
          giftCount:
            gifts.length,
          ...(averageBudget !==
          undefined
            ? {
                averageBudget,
              }
            : {}),
          recordCount:
            records.length,
        }),
    });
  }
}

export const defaultMemoryBrain =
  new MemoryBrainService();
