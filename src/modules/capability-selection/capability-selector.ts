import type { CapabilitySelection, Decision } from "../../platform/runtime/contracts/index.js";
import { RuntimeCapabilityRegistry } from "./capability-registry.js";
import { defaultRuntimeCapabilities } from "./default-capabilities.js";

export class CapabilitySelectionError extends Error {
  readonly code = "CAPABILITY_SELECTION_FAILED";
  constructor(readonly action: Decision["nextAction"]) {
    super(`No existe una capability habilitada para ${action}.`);
    this.name = "CapabilitySelectionError";
  }
}

export class CapabilitySelector {
  constructor(private readonly registry = createDefaultCapabilityRegistry()) {}

  select(decision: Decision): CapabilitySelection {
    const [selected] = this.registry.candidates(decision.nextAction);
    if (!selected) throw new CapabilitySelectionError(decision.nextAction);
    return Object.freeze({
      action: decision.nextAction,
      capabilityId: selected.capabilityId,
      providerId: selected.providerId,
      executionPath: selected.executionPath,
      confidence: decision.confidence,
      reasons: Object.freeze([
        `La acción ${decision.nextAction} requiere ${selected.capabilityId}.`,
        `Proveedor seleccionado por prioridad: ${selected.providerId}.`,
        `Ruta de ejecución: ${selected.executionPath}.`,
      ]),
      metadata: Object.freeze({
        providerVersion: selected.version,
        priority: selected.priority,
        expectedLatencyMs: selected.expectedLatencyMs,
        executionBudgetMs: selected.executionBudgetMs,
        acknowledgementBudgetMs: selected.acknowledgementBudgetMs,
      }),
    });
  }

  providers() { return this.registry.list(); }
}

export function createDefaultCapabilityRegistry(): RuntimeCapabilityRegistry {
  const registry = new RuntimeCapabilityRegistry();
  for (const definition of defaultRuntimeCapabilities) registry.register(definition);
  return registry;
}
