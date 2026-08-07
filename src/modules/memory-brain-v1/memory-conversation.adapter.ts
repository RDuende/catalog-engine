import type {
  ConversationGraph,
} from "../conversation-engine-v2/conversation-engine.types.js";
import {
  defaultMemoryBrain,
} from "./memory-brain.service.js";
import type {
  ConversationMemoryInput,
  MemoryRecord,
} from "./memory-brain.types.js";

function fact(
  graph: ConversationGraph,
  key: string,
): unknown {
  return graph.facts.find(
    (item) =>
      item.key === key,
  )?.value;
}

export function memoryInputFromConversationGraph(
  graph: ConversationGraph,
): ConversationMemoryInput {
  const recipientLabel =
    fact(
      graph,
      "recipientLabel",
    );

  const relationship =
    fact(
      graph,
      "relationship",
    );

  const occasion =
    fact(
      graph,
      "occasion",
    );

  const age =
    fact(
      graph,
      "age",
    );

  const budget =
    fact(
      graph,
      "budget",
    );

  const recipientCount =
    fact(
      graph,
      "recipientCount",
    );

  const interests =
    fact(
      graph,
      "interests",
    );

  const personality =
    fact(
      graph,
      "personality",
    );

  const desiredImpact =
    fact(
      graph,
      "desiredImpact",
    );

  return Object.freeze({
    conversationId:
      graph.conversationId,
    ...(typeof recipientLabel === "string"
      ? { recipientLabel }
      : {}),
    ...(typeof relationship === "string"
      ? { relationship }
      : {}),
    ...(typeof occasion === "string"
      ? { occasion }
      : {}),
    ...(typeof age === "number"
      ? { age }
      : {}),
    ...(typeof budget === "number"
      ? { budget }
      : {}),
    ...(typeof recipientCount === "number"
      ? { recipientCount }
      : {}),
    ...(Array.isArray(interests)
      ? {
          interests:
            Object.freeze(
              interests.filter(
                (value): value is string =>
                  typeof value === "string",
              ),
            ),
        }
      : {}),
    ...(Array.isArray(personality)
      ? {
          personality:
            Object.freeze(
              personality.filter(
                (value): value is string =>
                  typeof value === "string",
              ),
            ),
        }
      : {}),
    ...(Array.isArray(desiredImpact)
      ? {
          desiredImpact:
            Object.freeze(
              desiredImpact.filter(
                (value): value is string =>
                  typeof value === "string",
              ),
            ),
        }
      : {}),
  });
}

export async function persistConversationMemory(
  graph: ConversationGraph,
): Promise<void> {
  await defaultMemoryBrain
    .learnConversation(
      memoryInputFromConversationGraph(
        graph,
      ),
    );
}

export function conversationFactsFromMemory(
  records:
    readonly MemoryRecord[],
): Readonly<Record<string, unknown>> {
  const output:
    Record<string, unknown> =
    {};

  for (const record of records) {
    if (
      record.kind ===
        "GIFT_HISTORY" ||
      record.confidence < 0.6
    ) {
      continue;
    }

    if (
      Array.isArray(
        record.value,
      ) &&
      Array.isArray(
        output[record.key],
      )
    ) {
      output[record.key] =
        Object.freeze([
          ...new Set([
            ...(
              output[
                record.key
              ] as
                readonly unknown[]
            ),
            ...record.value,
          ]),
        ]);
    } else {
      output[record.key] =
        record.value;
    }
  }

  return Object.freeze(
    output,
  );
}
