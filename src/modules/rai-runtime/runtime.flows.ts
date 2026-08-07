import type { RuntimeFlowDefinition } from "./runtime.types.js";

export const defaultRuntimeFlows: readonly RuntimeFlowDefinition[] = [
  {
    id: "commercial-conversation",
    goal: "UNDERSTAND_REQUEST",
    steps: [
      { id: "classify-intent", kind: "SKILL", handler: "intent-classification" },
      { id: "resolve-conversation-state", kind: "SKILL", handler: "conversation-state-resolution" },
      { id: "understand", kind: "SKILL", handler: "conversation-understanding" },
      { id: "reason", kind: "SKILL", handler: "explainable-reasoning" },
      { id: "select-capability", kind: "SKILL", handler: "capability-selection" },
      { id: "optimize-path", kind: "SKILL", handler: "fast-path-optimization" },
      { id: "requirements", kind: "TOOL", handler: "requirement-gate" },
      { id: "respond", kind: "SKILL", handler: "runtime-response", optional: true },
    ],
  },
  {
    id: "commercial-recommendation",
    goal: "RECOMMEND_PRODUCTS",
    steps: [
      { id: "classify-intent", kind: "SKILL", handler: "intent-classification" },
      { id: "resolve-conversation-state", kind: "SKILL", handler: "conversation-state-resolution" },
      { id: "understand", kind: "SKILL", handler: "conversation-understanding" },
      { id: "reason", kind: "SKILL", handler: "explainable-reasoning" },
      { id: "select-capability", kind: "SKILL", handler: "capability-selection" },
      { id: "optimize-path", kind: "SKILL", handler: "fast-path-optimization" },
      { id: "requirements", kind: "TOOL", handler: "requirement-gate" },
      { id: "decide", kind: "TOOL", handler: "sales-brain", when: "CONTEXT_COMPLETE" },
      { id: "respond", kind: "SKILL", handler: "runtime-response", optional: true },
    ],
  },
  {
    id: "commercial-proposal",
    goal: "PREPARE_PROPOSAL",
    steps: [
      { id: "classify-intent", kind: "SKILL", handler: "intent-classification" },
      { id: "resolve-conversation-state", kind: "SKILL", handler: "conversation-state-resolution" },
      { id: "understand", kind: "SKILL", handler: "conversation-understanding" },
      { id: "reason", kind: "SKILL", handler: "explainable-reasoning" },
      { id: "select-capability", kind: "SKILL", handler: "capability-selection" },
      { id: "optimize-path", kind: "SKILL", handler: "fast-path-optimization" },
      { id: "requirements", kind: "TOOL", handler: "requirement-gate" },
      { id: "decide", kind: "TOOL", handler: "sales-brain", when: "CONTEXT_COMPLETE" },
      { id: "respond", kind: "SKILL", handler: "runtime-response", optional: true },
    ],
  },
];
