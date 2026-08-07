import type {
  ConversationFact,
  ConversationFactKey,
  ConversationGraph,
} from "./conversation-engine.types.js";
import type {
  ExtractedConversationFact,
} from "./utterance-extractor.js";

function mergeArrayValues(
  previous: unknown,
  next: unknown,
): unknown {
  if (
    Array.isArray(previous) &&
    Array.isArray(next)
  ) {
    return Object.freeze([
      ...new Set([
        ...previous,
        ...next,
      ]),
    ]);
  }

  return next;
}

export function mergeExtractedFacts(
  graph: ConversationGraph,
  extracted:
    readonly ExtractedConversationFact[],
  sourceNodeId?: string,
): ConversationGraph {
  const byKey =
    new Map<
      ConversationFactKey,
      ConversationFact
    >(
      graph.facts.map(
        (fact) => [
          fact.key,
          fact,
        ],
      ),
    );

  for (const item of extracted) {
    const previous =
      byKey.get(item.key);

    const value =
      mergeArrayValues(
        previous?.value,
        item.value,
      );

    byKey.set(
      item.key,
      Object.freeze({
        key: item.key,
        value,
        confidence:
          Math.max(
            item.confidence,
            previous?.confidence ??
              0,
          ),
        ...(sourceNodeId
          ? {
              sourceNodeId,
            }
          : previous?.sourceNodeId
            ? {
                sourceNodeId:
                  previous.sourceNodeId,
              }
            : {}),
        updatedAt:
          new Date().toISOString(),
      }),
    );
  }

  return Object.freeze({
    ...graph,
    facts:
      Object.freeze([
        ...byKey.values(),
      ]),
    version:
      graph.version + 1,
  });
}
