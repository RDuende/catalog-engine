import {
  createHash,
} from "node:crypto";

import type {
  ConversationEngineInput,
  ConversationFact,
  ConversationFactKey,
  ConversationGraph,
  ConversationNode,
} from "./conversation-engine.types.js";

function idFor(
  prefix: string,
  seed: string,
): string {
  return `${prefix}-${createHash("sha1").update(seed).digest("hex").slice(0, 12)}`;
}

export function createConversationGraph(
  conversationId = `conversation-${Date.now().toString(36)}`,
): ConversationGraph {
  const rootNodeId =
    idFor(
      "node",
      `${conversationId}:root`,
    );

  return Object.freeze({
    conversationId,
    rootNodeId,
    activeNodeId: rootNodeId,
    nodes:
      Object.freeze([
        Object.freeze({
          id: rootNodeId,
          kind: "SYSTEM",
          createdAt:
            new Date().toISOString(),
          text:
            "Conversation Engine V2 initialized.",
        }),
      ]),
    facts:
      Object.freeze([]),
    contradictions:
      Object.freeze([]),
    pendingQuestions:
      Object.freeze([]),
    version: 1,
  });
}

function factEntries(
  facts:
    Partial<
      Record<
        ConversationFactKey,
        unknown
      >
    >,
): readonly [
  ConversationFactKey,
  unknown,
][] {
  return Object.entries(facts) as [
    ConversationFactKey,
    unknown,
  ][];
}

export function ingestConversationInput(
  input: ConversationEngineInput,
): {
  readonly graph: ConversationGraph;
  readonly newNode?: ConversationNode;
} {
  const base =
    input.graph ??
    createConversationGraph(
      input.conversationId,
    );

  let nodes =
    [...base.nodes];
  let activeNodeId =
    base.activeNodeId;
  let newNode:
    ConversationNode | undefined;

  if (
    input.message &&
    input.message.trim()
  ) {
    const parentId =
      input.parentNodeId ??
      base.activeNodeId;

    const id =
      idFor(
        "node",
        `${base.conversationId}:${parentId}:${Date.now()}:${input.message}`,
      );

    newNode =
      Object.freeze({
        id,
        parentId,
        kind: "USER",
        createdAt:
          new Date().toISOString(),
        text:
          input.message.trim(),
      });

    nodes.push(newNode);
    activeNodeId = id;
  }

  const factsByKey =
    new Map<
      ConversationFactKey,
      ConversationFact
    >(
      base.facts.map(
        (fact) => [
          fact.key,
          fact,
        ],
      ),
    );

  for (
    const [key, value] of
    factEntries(
      input.facts ?? {},
    )
  ) {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      continue;
    }

    factsByKey.set(
      key,
      Object.freeze({
        key,
        value,
        confidence: 1,
        ...(newNode
          ? {
              sourceNodeId:
                newNode.id,
            }
          : {}),
        updatedAt:
          new Date().toISOString(),
      }),
    );
  }

  return Object.freeze({
    graph:
      Object.freeze({
        ...base,
        activeNodeId,
        nodes:
          Object.freeze(nodes),
        facts:
          Object.freeze(
            [...factsByKey.values()],
          ),
        version:
          base.version + 1,
      }),
    ...(newNode
      ? { newNode }
      : {}),
  });
}
