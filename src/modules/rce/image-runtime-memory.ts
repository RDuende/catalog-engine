import type {
  RceImageRuntimeResult,
} from "./image-runtime.contracts.js";

export interface RceImageRuntimeMemoryRecord {
  readonly conversationId: string;
  readonly version: number;
  readonly result: RceImageRuntimeResult;
  readonly updatedAt: string;
}

export class InMemoryRceImageRuntimeMemory {
  readonly #records = new Map<
    string,
    RceImageRuntimeMemoryRecord
  >();

  get(
    conversationId: string,
  ): RceImageRuntimeMemoryRecord | undefined {
    return this.#records.get(conversationId);
  }

  set(
    conversationId: string,
    result: RceImageRuntimeResult,
  ): RceImageRuntimeMemoryRecord {
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
