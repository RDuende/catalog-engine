import {
  DEFAULT_COMMERCIAL_CONTEXT,
  isCommercialContext,
  type CommercialContext,
} from "../../core/commercial-context/index.js";
import { withCommercialContext } from "../../platform/runtime/context/index.js";
import type { RaiContext } from "../../platform/runtime/contracts/index.js";
import type { RuntimeState } from "./runtime.types.js";

/**
 * Returns the commercial facts carried by the canonical RaiContext.
 * The legacy state.context is only used as a compatibility fallback during M2.
 */
export function commercialFactsFrom(state: RuntimeState): CommercialContext {
  const facts = state.raiContext.conversation.facts;
  if (isCommercialContext(facts)) {
    return { ...DEFAULT_COMMERCIAL_CONTEXT, ...facts };
  }
  return { ...DEFAULT_COMMERCIAL_CONTEXT, ...state.context };
}

/**
 * Applies commercial facts to both the canonical context and its temporary
 * legacy projection. New handlers should use this helper instead of mutating
 * state.context directly.
 */
export function withRuntimeCommercialFacts(
  state: RuntimeState,
  facts: CommercialContext,
): RuntimeState {
  return {
    ...state,
    raiContext: withCommercialContext(state.raiContext, facts),
    context: facts,
  };
}

/** Creates a new canonical context while preserving execution identity. */
export function withRaiContext(state: RuntimeState, context: RaiContext): RuntimeState {
  const facts = isCommercialContext(context.conversation.facts)
    ? { ...DEFAULT_COMMERCIAL_CONTEXT, ...context.conversation.facts }
    : state.context;
  return { ...state, raiContext: context, context: facts };
}
