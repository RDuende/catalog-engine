import {
  analyzeInterestSignals,
} from "./interest-analyzer.js";
import {
  clusterInterestSignals,
} from "./interest-cluster.js";
import type {
  InterestBrainInput,
  InterestBrainResult,
  InterestSignal,
  InterestTrace,
} from "./interest-brain.types.js";

function dedupeSignals(
  signals:
    readonly InterestSignal[],
): readonly InterestSignal[] {
  const best =
    new Map<
      string,
      InterestSignal
    >();

  for (const signal of signals) {
    const previous =
      best.get(
        signal.canonical,
      );

    if (
      !previous ||
      signal.weight *
        signal.confidence >
      previous.weight *
        previous.confidence
    ) {
      best.set(
        signal.canonical,
        signal,
      );
    }
  }

  return Object.freeze(
    [...best.values()]
      .sort(
        (left, right) =>
          (
            right.weight *
            right.confidence
          ) -
          (
            left.weight *
            left.confidence
          ),
      ),
  );
}

export class InterestBrainV2Service {
  analyze(
    input: InterestBrainInput,
  ): InterestBrainResult {
    const analyzed =
      analyzeInterestSignals(
        input,
      );

    const traces:
      InterestTrace[] =
      [...analyzed.traces];

    const signals =
      dedupeSignals(
        analyzed.signals,
      );

    traces.push({
      phase: "RELATE",
      message:
        `${signals.length} señales únicas tras deduplicación semántica.`,
      data:
        signals,
    });

    const clusters =
      clusterInterestSignals(
        signals,
      );

    traces.push({
      phase: "CLUSTER",
      message:
        `${clusters.length} clusters de afinidad construidos.`,
      data:
        clusters,
    });

    const primary =
      signals[0];

    const canonicalInterests =
      Object.freeze(
        signals
          .filter(
            (signal) =>
              signal.confidence >=
              0.55,
          )
          .map(
            (signal) =>
              signal.canonical,
          ),
      );

    const confidence =
      primary
        ? Math.max(
            0.35,
            Math.min(
              0.99,
              primary.confidence *
                0.7 +
              Math.min(
                0.25,
                signals.length *
                  0.03,
              ),
            ),
          )
        : 0.3;

    const explanation =
      primary
        ? `El interés principal es ${primary.canonical}; se han detectado ${canonicalInterests.length} afinidades canónicas con confianza suficiente.`
        : "No se ha detectado un interés suficientemente claro.";

    traces.push({
      phase: "DECISION",
      message:
        primary
          ? `Interés principal ${primary.canonical} con confianza ${(confidence * 100).toFixed(0)}%.`
          : "Sin interés principal.",
    });

    return Object.freeze({
      generatedAt:
        new Date().toISOString(),
      canonicalInterests,
      signals,
      clusters,
      ...(primary
        ? {
            primaryInterest:
              primary.canonical,
          }
        : {}),
      confidence,
      explanation,
      traces:
        Object.freeze(traces),
    });
  }
}

export const defaultInterestBrainV2 =
  new InterestBrainV2Service();
