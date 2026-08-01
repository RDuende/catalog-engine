import type { CommercialContextField } from "./commercial-context.js";

export type ContextPatchOperation = "SET" | "UNSET" | "APPEND" | "REMOVE";

export interface ContextPatch {
  readonly field: CommercialContextField;
  readonly operation: ContextPatchOperation;
  readonly value: string | number | boolean | null;
  readonly confidence?: number;
  readonly evidence?: string;
}
