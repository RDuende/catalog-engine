import type {
  RceStoryRuntimeResult,
} from "./story-runtime.contracts.js";

export interface RceStoryRuntimeMemoryRecord {
  readonly conversationId: string;
  readonly version: number;
  readonly result: RceStoryRuntimeResult;
  readonly updatedAt: string;
}

export class InMemoryRceStoryRuntimeMemory {
  readonly #records = new Map<
    string,
    RceStoryRuntimeMemoryRecord
  >();

  get(
    conversationId: string,
  ): RceStoryRuntimeMemoryRecord | undefined {
    return this.#records.get(conversationId);
  }

  set(
    conversationId: string,
    result: RceStoryRuntimeResult,
  ): RceStoryRuntimeMemoryRecord {
    const previous = this.#records.get(conversationId);

    const record = Object.freeze({
      conversationId,
      version: (previous?.version ?? 0) + 1,
      result,
      updatedAt: new Date().toISOString(),
    });

    this.#records.set(conversationId, record);
    return record;
  }
}
