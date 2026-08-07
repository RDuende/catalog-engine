import type {
  ConversationFactKey,
  ConversationGraph,
} from "./conversation-engine.types.js";

export interface ExtractedConversationFact {
  readonly key: ConversationFactKey;
  readonly value: unknown;
  readonly confidence: number;
  readonly evidence: string;
}

export interface UtteranceExtractionResult {
  readonly normalizedText: string;
  readonly facts: readonly ExtractedConversationFact[];
  readonly proposalRequested: boolean;
  readonly resetRequested: boolean;
  readonly diagnostics: readonly string[];
}

function normalize(
  value: string,
): string {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/gu,
      "",
    )
    .toLowerCase()
    .replace(
      /\s+/gu,
      " ",
    )
    .trim();
}

function activeQuestionKey(
  graph:
    ConversationGraph |
    undefined,
): ConversationFactKey | undefined {
  return graph
    ?.pendingQuestions[0]
    ?.key;
}

function numericValue(
  text: string,
): number | undefined {
  const match =
    text.match(
      /(?:^|\s)(\d{1,4}(?:[.,]\d{1,2})?)(?:\s|€|euros?|eur|$)/iu,
    );

  if (!match?.[1]) {
    return undefined;
  }

  const value =
    Number(
      match[1].replace(
        ",",
        ".",
      ),
    );

  return Number.isFinite(value)
    ? value
    : undefined;
}

function recipient(
  text: string,
): {
  readonly label: string;
  readonly count?: number;
} | undefined {
  const patterns:
    readonly [
      RegExp,
      string,
      number?,
    ][] = [
      [/\bmis padres\b/iu, "mis padres", 2],
      [/\bmis tios\b/iu, "mis tíos", 2],
      [/\bmis amigos\b/iu, "mis amigos"],
      [/\bmi padre\b/iu, "mi padre", 1],
      [/\bmi madre\b/iu, "mi madre", 1],
      [/\bmi hermana\b/iu, "mi hermana", 1],
      [/\bmi hermano\b/iu, "mi hermano", 1],
      [/\bmi novio\b/iu, "mi novio", 1],
      [/\bmi novia\b/iu, "mi novia", 1],
      [/\bmi marido\b/iu, "mi marido", 1],
      [/\bmi mujer\b/iu, "mi mujer", 1],
      [/\bmi pareja\b/iu, "mi pareja", 1],
      [/\bmi abuelo\b/iu, "mi abuelo", 1],
      [/\bmi abuela\b/iu, "mi abuela", 1],
      [/\bmis abuelos\b/iu, "mis abuelos", 2],
    ];

  for (const [
    pattern,
    label,
    count,
  ] of patterns) {
    if (pattern.test(text)) {
      return {
        label,
        ...(count !== undefined
          ? { count }
          : {}),
      };
    }
  }

  return undefined;
}

function occasion(
  text: string,
): string | undefined {
  const entries:
    readonly [
      RegExp,
      string,
    ][] = [
      [/\bcumple(?:anos|años)?\b|\bcumpleanos\b/iu, "cumpleaños"],
      [/\bboda\b/iu, "boda"],
      [/\baniversario\b/iu, "aniversario"],
      [/\bjubilacion\b/iu, "jubilación"],
      [/\bnavidad\b/iu, "Navidad"],
      [/\bdia del padre\b/iu, "Día del Padre"],
      [/\bdia de la madre\b/iu, "Día de la Madre"],
      [/\bcomunion\b/iu, "comunión"],
      [/\bbautizo\b/iu, "bautizo"],
    ];

  for (const [
    pattern,
    value,
  ] of entries) {
    if (pattern.test(text)) {
      return value;
    }
  }

  return undefined;
}

function age(
  text: string,
): number | undefined {
  const match =
    text.match(
      /\b(?:tiene|tienen|de)\s+(\d{1,3})\s+anos\b/iu,
    );

  if (!match?.[1]) {
    return undefined;
  }

  const value =
    Number(match[1]);

  return value > 0 &&
    value < 120
    ? value
    : undefined;
}

function interests(
  text: string,
): readonly string[] {
  const output:
    string[] = [];

  const patterns:
    readonly [
      RegExp,
      string,
    ][] = [
      [/\bfutbol\b/iu, "football"],
      [/\bmotocross\b/iu, "motocross"],
      [/\bmotos?\b/iu, "motorcycles"],
      [/\bbarcos?\b/iu, "boats"],
      [/\bmadera\b/iu, "wood"],
      [/\bviaj(?:e|es|ar)\b/iu, "travel"],
      [/\bcocina(?:r)?\b/iu, "cooking"],
      [/\bcafe\b/iu, "coffee"],
      [/\bvino\b/iu, "wine"],
      [/\bgatos?\b/iu, "cats"],
      [/\bperros?\b/iu, "dogs"],
      [/\bgolf\b/iu, "golf"],
      [/\bciclismo\b/iu, "cycling"],
      [/\btenis\b/iu, "tennis"],
      [/\bbaloncesto\b/iu, "basketball"],
      [/\bgaming\b|\bvideojuegos?\b/iu, "gaming"],
      [/\bmanga japonesa\b|\banime\b/iu, "manga"],
      [/\bheavy metal\b/iu, "heavy-metal"],
      [/\bleer\b|\blectura\b|\blibros?\b/iu, "reading"],
      [/\bjardineria\b/iu, "gardening"],
      [/\bceramica\b/iu, "ceramics"],
      [/\bcoser\b|\bcostura\b/iu, "sewing"],
      [/\btejer\b|\bpunto\b/iu, "knitting"],
    ];

  for (const [
    pattern,
    value,
  ] of patterns) {
    if (
      pattern.test(text)
    ) {
      output.push(value);
    }
  }

  return Object.freeze([
    ...new Set(output),
  ]);
}

function personality(
  text: string,
): readonly string[] {
  const output:
    string[] = [];

  const entries:
    readonly [
      RegExp,
      string,
    ][] = [
      [/\bpractic[oa]\b/iu, "práctico"],
      [/\baventurer[oa]\b/iu, "aventurero"],
      [/\belegante\b/iu, "elegante"],
      [/\bdivertid[oa]\b/iu, "divertido"],
      [/\bsentimental\b/iu, "sentimental"],
      [/\bromantic[oa]\b/iu, "romántico"],
    ];

  for (const [
    pattern,
    value,
  ] of entries) {
    if (pattern.test(text)) {
      output.push(value);
    }
  }

  return Object.freeze(output);
}

export function extractConversationUtterance(
  message: string,
  graph?: ConversationGraph,
): UtteranceExtractionResult {
  const normalized =
    normalize(message);

  const facts:
    ExtractedConversationFact[] =
    [];

  const diagnostics:
    string[] = [];

  const proposalRequested =
    /\bhacer propuestas\b|\bmostrar propuestas\b|\bquiero ver propuestas\b|\bpropon(?:me|me)\b/iu
      .test(normalized);

  const resetRequested =
    /\bempezar de nuevo\b|\breiniciar\b|\bnuevo regalo\b/iu
      .test(normalized);

  const recipientResult =
    recipient(normalized);

  if (recipientResult) {
    facts.push({
      key:
        "recipientLabel",
      value:
        recipientResult.label,
      confidence: 0.98,
      evidence:
        recipientResult.label,
    });

    if (
      recipientResult.count !==
      undefined
    ) {
      facts.push({
        key:
          "recipientCount",
        value:
          recipientResult.count,
        confidence: 0.96,
        evidence:
          recipientResult.label,
      });
    }
  }

  const detectedOccasion =
    occasion(normalized);

  if (detectedOccasion) {
    facts.push({
      key:
        "occasion",
      value:
        detectedOccasion,
      confidence: 0.96,
      evidence:
        detectedOccasion,
    });
  }

  const detectedAge =
    age(normalized);

  if (detectedAge !== undefined) {
    facts.push({
      key: "age",
      value:
        detectedAge,
      confidence: 0.96,
      evidence:
        `${detectedAge} años`,
    });
  }

  const detectedInterests =
    interests(normalized);

  if (detectedInterests.length) {
    facts.push({
      key:
        "interests",
      value:
        detectedInterests,
      confidence: 0.9,
      evidence:
        detectedInterests.join(", "),
    });
  }

  const detectedPersonality =
    personality(normalized);

  if (
    detectedPersonality.length
  ) {
    facts.push({
      key:
        "personality",
      value:
        detectedPersonality,
      confidence: 0.88,
      evidence:
        detectedPersonality.join(", "),
    });
  }

  const activeKey =
    activeQuestionKey(graph);

  const numeric =
    numericValue(normalized);

  if (
    numeric !== undefined
  ) {
    if (
      activeKey === "budget" ||
      /€|euros?|presupuesto/iu.test(
        normalized,
      )
    ) {
      facts.push({
        key:
          "budget",
        value:
          numeric,
        confidence:
          activeKey ===
          "budget"
            ? 0.99
            : 0.94,
        evidence:
          String(numeric),
      });
    } else if (
      activeKey ===
      "recipientCount"
    ) {
      facts.push({
        key:
          "recipientCount",
        value:
          Math.max(
            1,
            Math.round(numeric),
          ),
        confidence: 0.97,
        evidence:
          String(numeric),
      });
    } else if (
      activeKey ===
      "giftCount"
    ) {
      facts.push({
        key:
          "giftCount",
        value:
          Math.max(
            1,
            Math.round(numeric),
          ),
        confidence: 0.97,
        evidence:
          String(numeric),
      });
    } else if (
      activeKey === "age"
    ) {
      facts.push({
        key: "age",
        value:
          Math.round(numeric),
        confidence: 0.97,
        evidence:
          String(numeric),
      });
    } else {
      diagnostics.push(
        `Número ${numeric} detectado sin contexto suficiente.`,
      );
    }
  }

  if (
    !facts.length &&
    activeKey === "interests" &&
    normalized.length > 1 &&
    !proposalRequested
  ) {
    facts.push({
      key:
        "interests",
      value:
        Object.freeze([
          normalized,
        ]),
      confidence: 0.68,
      evidence:
        message.trim(),
    });

    diagnostics.push(
      "Interés libre capturado por contexto de pregunta.",
    );
  }

  return Object.freeze({
    normalizedText:
      normalized,
    facts:
      Object.freeze(facts),
    proposalRequested,
    resetRequested,
    diagnostics:
      Object.freeze(
        diagnostics,
      ),
  });
}
