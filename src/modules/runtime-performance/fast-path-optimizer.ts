import type {
  CapabilitySelection,
  RuntimePerformanceAssessment,
  RuntimePerformanceReport,
} from "../../platform/runtime/contracts/index.js";

function numberMetadata(selection: CapabilitySelection, key: string, fallback: number): number {
  const value = selection.metadata[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export class FastPathOptimizer {
  assess(selection: CapabilitySelection): RuntimePerformanceAssessment {
    const expectedLatencyMs = numberMetadata(selection, "expectedLatencyMs", selection.executionPath === "FAST_PATH" ? 100 : 2000);
    const executionBudgetMs = numberMetadata(selection, "executionBudgetMs", selection.executionPath === "FAST_PATH" ? 300 : 30000);
    const acknowledgementBudgetMs = numberMetadata(selection, "acknowledgementBudgetMs", selection.executionPath === "FAST_PATH" ? 100 : 300);
    const requiresAsyncExecution = selection.executionPath === "ADVANCED_PATH";
    const latencyClass = requiresAsyncExecution ? "ADVANCED" : expectedLatencyMs <= 100 ? "FAST" : "NORMAL";
    const activityMode = requiresAsyncExecution ? "PROGRESS" : expectedLatencyMs > 100 ? "SUBTLE" : "NONE";

    return Object.freeze({
      selection,
      latencyClass,
      expectedLatencyMs,
      executionBudgetMs,
      acknowledgementBudgetMs,
      requiresAsyncExecution,
      activityMode,
      reasons: Object.freeze([
        `Capability ${selection.capabilityId} clasificada como ${latencyClass}.`,
        `Presupuesto de acknowledgement: ${acknowledgementBudgetMs} ms.`,
        `Presupuesto de ejecución: ${executionBudgetMs} ms.`,
        requiresAsyncExecution
          ? "La capacidad debe ejecutarse fuera del camino bloqueante y publicar progreso."
          : "La capacidad puede permanecer en el camino síncrono.",
      ]),
    });
  }

  complete(assessment: RuntimePerformanceAssessment, actualRuntimeMs: number): RuntimePerformanceReport {
    const runtimeWithinAcknowledgementBudget = actualRuntimeMs <= assessment.acknowledgementBudgetMs;
    const runtimeWithinExecutionBudget = actualRuntimeMs <= assessment.executionBudgetMs;
    const slaStatus = !runtimeWithinExecutionBudget
      ? "EXECUTION_BREACH"
      : !runtimeWithinAcknowledgementBudget
        ? "ACKNOWLEDGEMENT_BREACH"
        : "WITHIN_BUDGET";

    return Object.freeze({
      assessment,
      actualRuntimeMs,
      runtimeWithinAcknowledgementBudget,
      runtimeWithinExecutionBudget,
      slaStatus,
      measuredAt: new Date().toISOString(),
    });
  }
}
