import type { RuntimeLegacyEntryPointPolicy } from "./runtime-legacy-policy.js";
import {
  buildRuntimeRetirementReadiness,
  DEFAULT_RUNTIME_RETIREMENT_READINESS_POLICY,
  type RuntimeRetirementReadinessPolicy,
  type RuntimeRetirementReadinessReport,
} from "./runtime-retirement-readiness.js";

export type RuntimeEntryPoint = "runContext" | "runContract" | "run";

export interface RuntimeEntryPointUsage {
  readonly entryPoint: RuntimeEntryPoint;
  readonly canonical: boolean;
  readonly deprecated: boolean;
  readonly calls: number;
  readonly lastUsedAt?: string;
}

export interface RuntimeEntryPointReport {
  readonly canonicalEntryPoint: "runContext";
  readonly legacyEntryPointPolicy: RuntimeLegacyEntryPointPolicy;
  readonly totalCalls: number;
  readonly canonicalCalls: number;
  readonly deprecatedCalls: number;
  readonly canonicalUsagePercent: number;
  readonly legacyUsagePercent: number;
  readonly entries: readonly RuntimeEntryPointUsage[];
  readonly retirementReady: boolean;
  readonly retirementReadiness: RuntimeRetirementReadinessReport;
}

interface MutableEntryPointUsage {
  calls: number;
  lastUsedAt?: string;
}

export class RuntimeEntryPointMetrics {
  private readonly monitoringStartedAt: string;

  constructor(
    private readonly legacyEntryPointPolicy: RuntimeLegacyEntryPointPolicy = "ENABLED_WITH_WARNING",
    private readonly retirementPolicy: RuntimeRetirementReadinessPolicy = DEFAULT_RUNTIME_RETIREMENT_READINESS_POLICY,
    monitoringStartedAt: string = new Date().toISOString(),
    private readonly now: () => Date = () => new Date(),
  ) {
    this.monitoringStartedAt = monitoringStartedAt;
  }
  private readonly usage: Record<RuntimeEntryPoint, MutableEntryPointUsage> = {
    runContext: { calls: 0 },
    runContract: { calls: 0 },
    run: { calls: 0 },
  };

  record(entryPoint: RuntimeEntryPoint): void {
    const current = this.usage[entryPoint];
    current.calls += 1;
    current.lastUsedAt = new Date().toISOString();
  }

  report(): RuntimeEntryPointReport {
    const canonicalCalls = this.usage.runContext.calls;
    const deprecatedCalls = this.usage.runContract.calls + this.usage.run.calls;
    const totalCalls = canonicalCalls + deprecatedCalls;

    const percent = (value: number): number =>
      totalCalls === 0 ? 0 : Number(((value / totalCalls) * 100).toFixed(2));

    const entries = [
      this.entry("runContext", true, false),
      this.entry("runContract", false, true),
      this.entry("run", false, true),
    ];
    const retirementReadiness = buildRuntimeRetirementReadiness({
      monitoringStartedAt: this.monitoringStartedAt,
      evaluatedAt: this.now().toISOString(),
      legacyEntryPointPolicy: this.legacyEntryPointPolicy,
      canonicalCalls,
      deprecatedCalls,
      entries,
      policy: this.retirementPolicy,
    });

    return {
      canonicalEntryPoint: "runContext",
      legacyEntryPointPolicy: this.legacyEntryPointPolicy,
      totalCalls,
      canonicalCalls,
      deprecatedCalls,
      canonicalUsagePercent: percent(canonicalCalls),
      legacyUsagePercent: percent(deprecatedCalls),
      entries,
      retirementReady: retirementReadiness.ready,
      retirementReadiness,
    };
  }

  private entry(
    entryPoint: RuntimeEntryPoint,
    canonical: boolean,
    deprecated: boolean,
  ): RuntimeEntryPointUsage {
    const value = this.usage[entryPoint];
    return {
      entryPoint,
      canonical,
      deprecated,
      calls: value.calls,
      ...(value.lastUsedAt ? { lastUsedAt: value.lastUsedAt } : {}),
    };
  }
}
