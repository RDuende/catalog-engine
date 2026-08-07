import type {
  RceSolutionSet,
} from "./solution-composer.contracts.js";

export interface RceSolutionMemoryRecord {
  readonly conversationId: string;
  readonly version: number;
  readonly current: RceSolutionSet;
  readonly history: readonly RceSolutionSet[];
  readonly updatedAt: string;
}

export class InMemoryRceSolutionMemory {
  readonly #records = new Map<
    string,
    RceSolutionMemoryRecord
  >();

  get(
    conversationId: string,
  ): RceSolutionMemoryRecord | undefined {
    return this.#records.get(conversationId);
  }

  set(
    conversationId: string,
    solutionSet: RceSolutionSet,
  ): RceSolutionMemoryRecord {
    const previous = this.#records.get(conversationId);

    const record = Object.freeze({
      conversationId,
      version: (previous?.version ?? 0) + 1,
      current: solutionSet,
      history: Object.freeze([
        ...(previous?.history ?? []),
        solutionSet,
      ]),
      updatedAt: new Date().toISOString(),
    });

    this.#records.set(conversationId, record);
    return record;
  }
}
