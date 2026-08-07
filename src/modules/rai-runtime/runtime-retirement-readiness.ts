import type { RuntimeEntryPointUsage } from "./runtime-entrypoint-metrics.js";
import type { RuntimeLegacyEntryPointPolicy } from "./runtime-legacy-policy.js";

export interface RuntimeRetirementReadinessPolicy {
  readonly observationHours: number;
  readonly minimumCanonicalCalls: number;
}

export interface RuntimeRetirementReadinessInput {
  readonly monitoringStartedAt: string;
  readonly evaluatedAt: string;
  readonly legacyEntryPointPolicy: RuntimeLegacyEntryPointPolicy;
  readonly canonicalCalls: number;
  readonly deprecatedCalls: number;
  readonly entries: readonly RuntimeEntryPointUsage[];
  readonly policy: RuntimeRetirementReadinessPolicy;
}

export type RuntimeRetirementBlockerCode =
  | "LEGACY_POLICY_ENABLED"
  | "OBSERVATION_WINDOW_INCOMPLETE"
  | "CANONICAL_VOLUME_INSUFFICIENT"
  | "LEGACY_USAGE_DETECTED";

export interface RuntimeRetirementBlocker {
  readonly code: RuntimeRetirementBlockerCode;
  readonly message: string;
}

export interface RuntimeRetirementReadinessReport {
  readonly ready: boolean;
  readonly monitoringStartedAt: string;
  readonly evaluatedAt: string;
  readonly observationHoursRequired: number;
  readonly observationHoursElapsed: number;
  readonly observationComplete: boolean;
  readonly minimumCanonicalCalls: number;
  readonly canonicalCalls: number;
  readonly canonicalVolumeComplete: boolean;
  readonly deprecatedCalls: number;
  readonly zeroLegacyUsage: boolean;
  readonly legacyPolicyDisabled: boolean;
  readonly lastLegacyUseAt?: string;
  readonly blockers: readonly RuntimeRetirementBlocker[];
  readonly nextAction: string;
}

export const DEFAULT_RUNTIME_RETIREMENT_READINESS_POLICY: RuntimeRetirementReadinessPolicy = {
  observationHours: 168,
  minimumCanonicalCalls: 1_000,
};

function elapsedHours(from: string, to: string): number {
  const elapsedMs = Math.max(0, Date.parse(to) - Date.parse(from));
  return Number((elapsedMs / 3_600_000).toFixed(2));
}

export function buildRuntimeRetirementReadiness(
  input: RuntimeRetirementReadinessInput,
): RuntimeRetirementReadinessReport {
  const observationHoursElapsed = elapsedHours(input.monitoringStartedAt, input.evaluatedAt);
  const observationComplete = observationHoursElapsed >= input.policy.observationHours;
  const canonicalVolumeComplete = input.canonicalCalls >= input.policy.minimumCanonicalCalls;
  const zeroLegacyUsage = input.deprecatedCalls === 0;
  const legacyPolicyDisabled = input.legacyEntryPointPolicy === "DISABLED";
  const legacyUseDates = input.entries
    .filter((entry) => entry.deprecated && entry.lastUsedAt)
    .map((entry) => entry.lastUsedAt as string)
    .sort();
  const lastLegacyUseAt = legacyUseDates[legacyUseDates.length - 1];

  const blockers: RuntimeRetirementBlocker[] = [];
  if (!legacyPolicyDisabled) {
    blockers.push({
      code: "LEGACY_POLICY_ENABLED",
      message: "Deshabilita los puntos de entrada legacy antes de retirarlos del código.",
    });
  }
  if (!observationComplete) {
    blockers.push({
      code: "OBSERVATION_WINDOW_INCOMPLETE",
      message: `Completa una ventana de observación de ${input.policy.observationHours} horas.`,
    });
  }
  if (!canonicalVolumeComplete) {
    blockers.push({
      code: "CANONICAL_VOLUME_INSUFFICIENT",
      message: `Registra al menos ${input.policy.minimumCanonicalCalls} llamadas canónicas.`,
    });
  }
  if (!zeroLegacyUsage) {
    blockers.push({
      code: "LEGACY_USAGE_DETECTED",
      message: "Existe uso legacy durante la ventana de observación.",
    });
  }

  const ready = blockers.length === 0;
  return {
    ready,
    monitoringStartedAt: input.monitoringStartedAt,
    evaluatedAt: input.evaluatedAt,
    observationHoursRequired: input.policy.observationHours,
    observationHoursElapsed,
    observationComplete,
    minimumCanonicalCalls: input.policy.minimumCanonicalCalls,
    canonicalCalls: input.canonicalCalls,
    canonicalVolumeComplete,
    deprecatedCalls: input.deprecatedCalls,
    zeroLegacyUsage,
    legacyPolicyDisabled,
    ...(lastLegacyUseAt ? { lastLegacyUseAt } : {}),
    blockers,
    nextAction: ready
      ? "Retirar runContract, run y POST /rai-runtime/run en la siguiente versión mayor controlada."
      : blockers[0]?.message ?? "Continuar observando el Runtime.",
  };
}
