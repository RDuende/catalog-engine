import { createHash } from "node:crypto";
import type { CanonicalProductInput } from "./canonical-types.js";

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => [key, stable(child)]));
  }
  return value;
}

export function canonicalProductHash(product: CanonicalProductInput): string {
  return createHash("sha256").update(JSON.stringify(stable(product))).digest("hex");
}
