import type { RuntimeFlowDefinition, RuntimeHandler, RuntimeStepKind } from "./runtime.types.js";

export type RuntimeEnforcementMode = "REPORT" | "STRICT";

export interface RuntimeHandlerDescriptor {
  readonly id: string;
  readonly kind: RuntimeStepKind;
  readonly contextMode: "RAI_CONTEXT" | "LEGACY";
  readonly canonical: boolean;
}

export interface RuntimeConvergenceReport {
  readonly totalHandlers: number;
  readonly canonicalHandlers: number;
  readonly legacyHandlers: number;
  readonly convergencePercent: number;
  readonly handlers: readonly RuntimeHandlerDescriptor[];
  readonly legacyHandlerIds: readonly string[];
}

export class RuntimeContextEnforcementError extends Error {
  readonly code = "RUNTIME_CONTEXT_ENFORCEMENT_FAILED";

  constructor(readonly handlerId: string, readonly flowId: string) {
    super(`El handler ${handlerId} del flujo ${flowId} no declara contextMode=RAI_CONTEXT.`);
    this.name = "RuntimeContextEnforcementError";
  }
}

export function handlerContextMode(handler: RuntimeHandler): "RAI_CONTEXT" | "LEGACY" {
  return handler.contextMode === "RAI_CONTEXT" ? "RAI_CONTEXT" : "LEGACY";
}

export function assertCanonicalHandler(handler: RuntimeHandler, flow: RuntimeFlowDefinition): void {
  if (handlerContextMode(handler) !== "RAI_CONTEXT") {
    throw new RuntimeContextEnforcementError(handler.id, flow.id);
  }
}

export function buildRuntimeConvergenceReport(
  handlers: ReadonlyArray<{ readonly handler: RuntimeHandler; readonly kind: RuntimeStepKind }>,
): RuntimeConvergenceReport {
  const descriptors = handlers
    .map(({ handler, kind }): RuntimeHandlerDescriptor => {
      const contextMode = handlerContextMode(handler);
      return {
        id: handler.id,
        kind,
        contextMode,
        canonical: contextMode === "RAI_CONTEXT",
      };
    })
    .sort((left, right) => left.id.localeCompare(right.id));
  const canonicalHandlers = descriptors.filter((item) => item.canonical).length;
  const totalHandlers = descriptors.length;
  const legacyHandlerIds = descriptors.filter((item) => !item.canonical).map((item) => item.id);
  return {
    totalHandlers,
    canonicalHandlers,
    legacyHandlers: totalHandlers - canonicalHandlers,
    convergencePercent: totalHandlers === 0 ? 100 : Number(((canonicalHandlers / totalHandlers) * 100).toFixed(2)),
    handlers: descriptors,
    legacyHandlerIds,
  };
}
