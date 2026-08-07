import type { CommercialContext, CommercialContextField } from "./commercial-context.js";
import type { ContextPatch } from "./context-patch.js";

const numericFields = new Set<CommercialContextField>(["quantity", "budget"]);
const booleanFields = new Set<CommercialContextField>(["sustainability", "customizable", "personalizationRequested"]);

export function normalizePatchValue(patch: ContextPatch): string | number | boolean | null | undefined {
  if (patch.operation === "UNSET") return null;
  if (patch.value === null) return undefined;

  if (numericFields.has(patch.field)) {
    const value = typeof patch.value === "number" ? patch.value : Number(String(patch.value).replace(",", "."));
    if (!Number.isFinite(value) || value < 0) return undefined;
    if (patch.field === "quantity" && !Number.isInteger(value)) return undefined;
    return value;
  }

  if (booleanFields.has(patch.field)) return typeof patch.value === "boolean" ? patch.value : undefined;

  const value = String(patch.value).trim();
  return value.length ? value : undefined;
}

export function isCommercialContext(value: unknown): value is CommercialContext {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const context = value as Record<string, unknown>;
  if (context.quantity !== undefined && (!Number.isInteger(context.quantity) || Number(context.quantity) < 0)) return false;
  if (context.budget !== undefined && (typeof context.budget !== "number" || !Number.isFinite(context.budget) || context.budget < 0)) return false;
  if (context.sustainability !== undefined && typeof context.sustainability !== "boolean") return false;
  if (context.customizable !== undefined && typeof context.customizable !== "boolean") return false;
  if (context.personalizationRequested !== undefined && typeof context.personalizationRequested !== "boolean") return false;
  return true;
}
