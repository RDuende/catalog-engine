import type { Result } from "../../../core/shared/result.js";
import type { RaiContext } from "./rai-context.js";

export interface RuntimeCapabilityRequest<TInput = unknown> {
  readonly input: TInput;
  readonly idempotencyKey?: string;
}

export interface RuntimeCapability<TInput = unknown, TOutput = unknown> {
  readonly id: string;
  readonly version: string;
  execute(
    context: RaiContext,
    request: RuntimeCapabilityRequest<TInput>,
  ): Promise<Result<TOutput>>;
}
