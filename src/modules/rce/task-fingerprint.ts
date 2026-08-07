import { createHash } from "node:crypto";
import type { RcePlannedTask } from "./conversation-planner.contracts.js";

function stable(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stable);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, stable(nested)]),
    );
  }

  return value;
}

export function taskFingerprint(task: RcePlannedTask): string {
  const payload = JSON.stringify({
    type: task.type,
    input: stable(task.input),
  });

  return createHash("sha256").update(payload).digest("hex");
}
