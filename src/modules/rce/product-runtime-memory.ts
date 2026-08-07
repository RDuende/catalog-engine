import type {
  RceProductRankingResult,
  RceProductSearchResult,
} from "./product-runtime.contracts.js";

export interface RceProductRuntimeMemoryRecord {
  readonly conversationId: string;
  readonly search?: RceProductSearchResult;
  readonly ranking?: RceProductRankingResult;
  readonly updatedAt: string;
}

export class InMemoryRceProductRuntimeMemory {
  readonly #records = new Map<
    string,
    RceProductRuntimeMemoryRecord
  >();

  get(
    conversationId: string,
  ): RceProductRuntimeMemoryRecord | undefined {
    return this.#records.get(conversationId);
  }

  setSearch(
    conversationId: string,
    search: RceProductSearchResult,
  ): RceProductRuntimeMemoryRecord {
    const previous = this.#records.get(conversationId);

    const record = Object.freeze({
      conversationId,
      search,
      ...(previous?.ranking ? { ranking: previous.ranking } : {}),
      updatedAt: new Date().toISOString(),
    });

    this.#records.set(conversationId, record);
    return record;
  }

  setRanking(
    conversationId: string,
    ranking: RceProductRankingResult,
  ): RceProductRuntimeMemoryRecord {
    const previous = this.#records.get(conversationId);

    const record = Object.freeze({
      conversationId,
      ...(previous?.search ? { search: previous.search } : {}),
      ranking,
      updatedAt: new Date().toISOString(),
    });

    this.#records.set(conversationId, record);
    return record;
  }
}
