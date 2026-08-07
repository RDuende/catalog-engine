import type { CapabilityProviderDefinition } from "./capability-selection.types.js";

export const defaultRuntimeCapabilities: readonly CapabilityProviderDefinition[] = [
  { capabilityId: "conversation.fast-reply", providerId: "deterministic-template", version: "1.0.0", actions: ["FAST_REPLY"], executionPath: "FAST_PATH", priority: 100, enabled: true, expectedLatencyMs: 10, executionBudgetMs: 100, acknowledgementBudgetMs: 100 },
  { capabilityId: "conversation.ask-question", providerId: "deterministic-question", version: "1.0.0", actions: ["ASK_QUESTION"], executionPath: "FAST_PATH", priority: 100, enabled: true, expectedLatencyMs: 15, executionBudgetMs: 100, acknowledgementBudgetMs: 100 },
  { capabilityId: "knowledge.search", providerId: "knowledge-engine", version: "1.0.0", actions: ["SEARCH_KNOWLEDGE"], executionPath: "FAST_PATH", priority: 100, enabled: true, expectedLatencyMs: 80, executionBudgetMs: 300, acknowledgementBudgetMs: 100 },
  { capabilityId: "story.build", providerId: "story-engine", version: "1.0.0", actions: ["BUILD_STORY"], executionPath: "ADVANCED_PATH", priority: 100, enabled: true, expectedLatencyMs: 2500, executionBudgetMs: 30000, acknowledgementBudgetMs: 300 },
  { capabilityId: "solution.build", providerId: "solution-engine", version: "1.0.0", actions: ["BUILD_SOLUTION"], executionPath: "ADVANCED_PATH", priority: 100, enabled: true, expectedLatencyMs: 1800, executionBudgetMs: 20000, acknowledgementBudgetMs: 300 },
  { capabilityId: "image.generate", providerId: "image-provider", version: "1.0.0", actions: ["GENERATE_IMAGE"], executionPath: "ADVANCED_PATH", priority: 100, enabled: true, expectedLatencyMs: 20000, executionBudgetMs: 120000, acknowledgementBudgetMs: 300 },
  { capabilityId: "project.create", providerId: "project-engine", version: "1.0.0", actions: ["CREATE_PROJECT"], executionPath: "FAST_PATH", priority: 100, enabled: true, expectedLatencyMs: 60, executionBudgetMs: 300, acknowledgementBudgetMs: 100 },
  { capabilityId: "proposal.create", providerId: "proposal-engine", version: "1.0.0", actions: ["CREATE_PROPOSAL"], executionPath: "ADVANCED_PATH", priority: 100, enabled: true, expectedLatencyMs: 1200, executionBudgetMs: 15000, acknowledgementBudgetMs: 300 },
  { capabilityId: "conversation.complete", providerId: "deterministic-template", version: "1.0.0", actions: ["COMPLETE"], executionPath: "FAST_PATH", priority: 100, enabled: true, expectedLatencyMs: 10, executionBudgetMs: 100, acknowledgementBudgetMs: 100 },
  { capabilityId: "support.escalate", providerId: "support-router", version: "1.0.0", actions: ["ESCALATE"], executionPath: "FAST_PATH", priority: 100, enabled: true, expectedLatencyMs: 40, executionBudgetMs: 300, acknowledgementBudgetMs: 100 },
];
