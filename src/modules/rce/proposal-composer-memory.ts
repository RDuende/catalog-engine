import type {
  RceProposalSet,
} from "./proposal-composer.contracts.js";

export interface RceProposalMemoryRecord {
  readonly conversationId: string;
  readonly version: number;
  readonly current: RceProposalSet;
  readonly history: readonly RceProposalSet[];
  readonly selectedProposalId?: string;
  readonly updatedAt: string;
}

export class InMemoryRceProposalMemory {
  readonly #records = new Map<
    string,
    RceProposalMemoryRecord
  >();

  get(
    conversationId: string,
  ): RceProposalMemoryRecord | undefined {
    return this.#records.get(conversationId);
  }

  set(
    conversationId: string,
    proposalSet: RceProposalSet,
    selectedProposalId?: string,
  ): RceProposalMemoryRecord {
    const previous = this.#records.get(conversationId);

    const record = Object.freeze({
      conversationId,
      version: (previous?.version ?? 0) + 1,
      current: proposalSet,
      history: Object.freeze([
        ...(previous?.history ?? []),
        proposalSet,
      ]),
      ...(selectedProposalId
        ? { selectedProposalId }
        : previous?.selectedProposalId
          ? { selectedProposalId: previous.selectedProposalId }
          : {}),
      updatedAt: new Date().toISOString(),
    });

    this.#records.set(conversationId, record);
    return record;
  }
}
