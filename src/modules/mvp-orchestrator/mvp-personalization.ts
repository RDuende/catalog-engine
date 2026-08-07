import { randomUUID } from "node:crypto";

export interface MvpPersonalizationDraftInput {
  readonly proposalId: string;
  readonly productId: string;
  readonly name?: string;
  readonly dedication?: string;
  readonly date?: string;
  readonly colors?: readonly string[];
  readonly photoUrl?: string;
  readonly notes?: string;
  readonly now?: string;
}

export interface MvpPersonalizationDraft {
  readonly id: string;
  readonly sessionId: string;
  readonly proposalId: string;
  readonly productId: string;
  readonly name?: string;
  readonly dedication?: string;
  readonly date?: string;
  readonly colors: readonly string[];
  readonly photoUrl?: string;
  readonly notes?: string;
  readonly status: "DRAFT" | "READY";
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

function clean(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function colors(values: readonly string[] | undefined): readonly string[] {
  return Object.freeze(
    [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))].slice(0, 8),
  );
}

function status(input: MvpPersonalizationDraftInput): "DRAFT" | "READY" {
  return clean(input.name) || clean(input.dedication) || clean(input.photoUrl)
    ? "READY"
    : "DRAFT";
}

export class InMemoryMvpPersonalizationRepository {
  readonly #drafts = new Map<string, MvpPersonalizationDraft>();

  private key(sessionId: string, proposalId: string): string {
    return `${sessionId}:${proposalId}`;
  }

  get(sessionId: string, proposalId: string): MvpPersonalizationDraft | undefined {
    return this.#drafts.get(this.key(sessionId, proposalId));
  }

  list(sessionId: string): readonly MvpPersonalizationDraft[] {
    return Object.freeze(
      [...this.#drafts.values()]
        .filter((draft) => draft.sessionId === sessionId)
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    );
  }

  save(sessionId: string, input: MvpPersonalizationDraftInput): MvpPersonalizationDraft {
    const now = input.now ?? new Date().toISOString();
    const previous = this.get(sessionId, input.proposalId);

    const draft = Object.freeze({
      id: previous?.id ?? randomUUID(),
      sessionId,
      proposalId: input.proposalId,
      productId: input.productId,
      ...(clean(input.name) ? { name: clean(input.name) } : {}),
      ...(clean(input.dedication) ? { dedication: clean(input.dedication) } : {}),
      ...(clean(input.date) ? { date: clean(input.date) } : {}),
      colors: colors(input.colors),
      ...(clean(input.photoUrl) ? { photoUrl: clean(input.photoUrl) } : {}),
      ...(clean(input.notes) ? { notes: clean(input.notes) } : {}),
      status: status(input),
      version: (previous?.version ?? 0) + 1,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
    } satisfies MvpPersonalizationDraft);

    this.#drafts.set(this.key(sessionId, input.proposalId), draft);
    return draft;
  }
}
