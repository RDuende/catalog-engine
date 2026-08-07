import {
  createHash,
} from "node:crypto";

import type {
  ConversationContradiction,
  ConversationFact,
  ConversationFactKey,
} from "./conversation-engine.types.js";

function fact(
  facts:
    readonly ConversationFact[],
  key:
    ConversationFact["key"],
): unknown {
  return facts.find(
    (item) =>
      item.key === key,
  )?.value;
}

function idFor(
  value: string,
): string {
  return `contradiction-${createHash("sha1").update(value).digest("hex").slice(0, 10)}`;
}

function contradiction(
  value: ConversationContradiction,
): ConversationContradiction {
  return Object.freeze(value);
}

export function detectConversationContradictions(
  facts:
    readonly ConversationFact[],
): readonly ConversationContradiction[] {
  const contradictions:
    ConversationContradiction[] = [];

  const budget =
    fact(facts, "budget");

  const giftCount =
    fact(facts, "giftCount");

  const style =
    fact(facts, "style");

  if (
    typeof budget === "number" &&
    typeof giftCount === "number" &&
    giftCount >= 5 &&
    budget < 50
  ) {
    const keys:
      readonly ConversationFactKey[] =
      Object.freeze([
        "budget",
        "giftCount",
      ]);

    contradictions.push(
      contradiction({
        id:
          idFor(
            `budget-giftCount:${budget}:${giftCount}`,
          ),
        keys,
        severity:
          "HIGH",
        summary:
          "El número de regalos solicitado tensiona mucho el presupuesto.",
        question:
          "¿Prefieres mantener el presupuesto o reducir la cantidad de artículos?",
      }),
    );
  }

  if (
    typeof budget === "number" &&
    budget < 35 &&
    typeof style === "string" &&
    /premium|lujo|luxury/iu.test(
      style,
    )
  ) {
    const keys:
      readonly ConversationFactKey[] =
      Object.freeze([
        "budget",
        "style",
      ]);

    contradictions.push(
      contradiction({
        id:
          idFor(
            `budget-style:${budget}:${style}`,
          ),
        keys,
        severity:
          "MEDIUM",
        summary:
          "El estilo premium solicitado puede superar el presupuesto.",
        question:
          "¿Quieres priorizar una presentación premium o mantener estrictamente el presupuesto?",
      }),
    );
  }

  return Object.freeze(
    contradictions,
  );
}
