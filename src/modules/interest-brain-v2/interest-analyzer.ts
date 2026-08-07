import {
  INTEREST_TAXONOMY,
} from "./interest-taxonomy.js";
import type {
  InterestBrainInput,
  InterestSignal,
  InterestTrace,
} from "./interest-brain.types.js";

function normalize(
  value: string,
): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase()
    .replace(/\s+/gu, " ")
    .trim();
}

function containsAlias(
  text: string,
  alias: string,
): boolean {
  const normalizedAlias =
    normalize(alias);

  if (!normalizedAlias) {
    return false;
  }

  return text.includes(
    normalizedAlias,
  );
}

function explicitSignal(
  raw: string,
  canonical: string,
  related: readonly string[],
  parent?: string,
): InterestSignal {
  return Object.freeze({
    raw,
    canonical,
    source: "EXPLICIT",
    confidence: 0.96,
    weight: 1,
    ...(parent
      ? { parent }
      : {}),
    related,
    evidence: raw,
  });
}

function inferredSignal(
  raw: string,
  canonical: string,
  confidence: number,
  weight: number,
  evidence: string,
  parent?: string,
): InterestSignal {
  return Object.freeze({
    raw,
    canonical,
    source: "INFERRED",
    confidence,
    weight,
    evidence,
    ...(parent
      ? { parent }
      : {}),
  });
}

export function analyzeInterestSignals(
  input: InterestBrainInput,
): {
  readonly normalizedText: string;
  readonly signals: readonly InterestSignal[];
  readonly traces: readonly InterestTrace[];
} {
  const traces:
    InterestTrace[] = [];

  const rawText =
    [
      input.message ?? "",
      ...(input.messages ?? []),
      ...(input.interests ?? []),
    ].join(" ");

  const normalizedText =
    normalize(rawText);

  traces.push({
    phase: "NORMALIZE",
    message:
      "Entrada normalizada para análisis de intereses.",
    data:
      normalizedText,
  });

  const signals:
    InterestSignal[] = [];

  for (const entry of INTEREST_TAXONOMY) {
    const match =
      entry.aliases.find(
        (alias) =>
          containsAlias(
            normalizedText,
            alias,
          ),
      );

    if (match) {
      signals.push(
        explicitSignal(
          match,
          entry.canonical,
          entry.related,
          entry.parent,
        ),
      );
    }
  }

  traces.push({
    phase: "CANONICALIZE",
    message:
      `${signals.length} intereses explícitos canonizados.`,
    data:
      signals,
  });

  /*
   * Inferencias semánticas controladas.
   * No sustituyen al interés explícito; añaden contexto con menor peso.
   */
  if (
    /\bmonte\b|\bsenderismo\b|\btrekking\b|\brutas?\b/iu
      .test(normalizedText)
  ) {
    const inferred:
      readonly InterestSignal[] =
      Object.freeze([
        inferredSignal(
          "naturaleza",
          "nature",
          0.84,
          0.72,
          "El monte suele implicar afinidad con naturaleza.",
          "outdoors",
        ),
        inferredSignal(
          "camping",
          "camping",
          0.68,
          0.48,
          "Senderismo y monte pueden relacionarse con actividades de camping.",
          "outdoors",
        ),
        inferredSignal(
          "aventura",
          "adventure",
          0.75,
          0.55,
          "Las actividades de monte implican un componente de aventura.",
          "outdoors",
        ),
        inferredSignal(
          "fotografía de paisaje",
          "landscape-photography",
          0.58,
          0.36,
          "Puede existir afinidad secundaria con fotografía de paisaje.",
          "creative",
        ),
      ]);

    signals.push(
      ...inferred,
    );
  }

  if (
    /\bbarcos?\b|\bnavegacion\b/iu
      .test(normalizedText)
  ) {
    signals.push(
      inferredSignal(
        "mar",
        "sea",
        0.78,
        0.56,
        "La afición por los barcos suele implicar afinidad con el mar.",
        "outdoors",
      ),
      inferredSignal(
        "navegación",
        "sailing",
        0.76,
        0.54,
        "Los barcos se relacionan directamente con navegación.",
        "outdoors",
      ),
    );
  }

  if (
    /\bmadera\b|\bcarpinteria\b/iu
      .test(normalizedText)
  ) {
    signals.push(
      inferredSignal(
        "hecho a mano",
        "handmade",
        0.72,
        0.5,
        "La madera suele asociarse con artesanía y objetos hechos a mano.",
        "crafts",
      ),
      inferredSignal(
        "estilo rústico",
        "rustic-style",
        0.64,
        0.42,
        "La madera puede indicar afinidad con estética rústica.",
        "style",
      ),
    );
  }

  traces.push({
    phase: "INFER",
    message:
      `${signals.filter((signal) => signal.source === "INFERRED").length} intereses implícitos añadidos.`,
    data:
      signals.filter(
        (signal) =>
          signal.source ===
          "INFERRED",
      ),
  });

  return Object.freeze({
    normalizedText,
    signals:
      Object.freeze(signals),
    traces:
      Object.freeze(traces),
  });
}
