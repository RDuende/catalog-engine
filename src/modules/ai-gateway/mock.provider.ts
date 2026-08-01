import { randomUUID } from "node:crypto";
import type { AIProvider, StructuredAIRequest, StructuredAIResult } from "./ai-gateway.types.js";

export class MockAIProvider implements AIProvider {
  readonly name = "mock" as const;
  constructor(private readonly resolver?: (request: StructuredAIRequest<unknown>) => unknown) {}

  async structured<T>(request: StructuredAIRequest<T>): Promise<StructuredAIResult<T>> {
    const data = this.resolver ? this.resolver(request as StructuredAIRequest<unknown>) as T : request.fallback;
    return {
      data,
      fallbackUsed: true,
      trace: {
        traceId: randomUUID(),
        provider: "mock",
        model: "mock-structured-v1",
        skill: request.skill,
        startedAt: new Date().toISOString(),
        durationMs: 0,
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      },
    };
  }
}
