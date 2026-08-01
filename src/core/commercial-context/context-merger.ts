import { DEFAULT_COMMERCIAL_CONTEXT, type CommercialContext } from "./commercial-context.js";
import type { ContextPatch } from "./context-patch.js";
import { normalizePatchValue } from "./context-validator.js";

export interface ContextMergeResult {
  readonly context: CommercialContext;
  readonly applied: readonly ContextPatch[];
  readonly rejected: readonly ContextPatch[];
}

export function mergeCommercialContext(
  current: CommercialContext = {},
  patches: readonly ContextPatch[],
): ContextMergeResult {
  const next: Record<string, unknown> = {
    ...DEFAULT_COMMERCIAL_CONTEXT,
    ...current,
    confidence: { ...(current.confidence ?? {}) },
  };
  const confidence = next.confidence as Record<string, number>;
  const applied: ContextPatch[] = [];
  const rejected: ContextPatch[] = [];

  for (const patch of patches) {
    if (patch.operation === "UNSET") {
      delete next[patch.field];
      delete confidence[patch.field];
      applied.push(patch);
      continue;
    }

    if (patch.operation === "APPEND" || patch.operation === "REMOVE") {
      rejected.push(patch);
      continue;
    }

    const normalized = normalizePatchValue(patch);
    if (normalized === undefined) {
      rejected.push(patch);
      continue;
    }

    next[patch.field] = normalized;
    if (patch.confidence !== undefined && Number.isFinite(patch.confidence)) {
      confidence[patch.field] = Math.max(0, Math.min(1, patch.confidence));
    }
    applied.push(patch);
  }

  return { context: next as CommercialContext, applied, rejected };
}
