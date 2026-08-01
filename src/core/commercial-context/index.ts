export type { CommercialContext, CommercialContextField, ConversationState } from "./commercial-context.js";
export { DEFAULT_COMMERCIAL_CONTEXT } from "./commercial-context.js";
export type { ContextPatch, ContextPatchOperation } from "./context-patch.js";
export { mergeCommercialContext, type ContextMergeResult } from "./context-merger.js";
export { isCommercialContext, normalizePatchValue } from "./context-validator.js";

export { CommercialContextSchema } from "./commercial-context.schema.js";
