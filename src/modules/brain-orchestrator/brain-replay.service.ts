import type {
  BrainOrchestratorInput,
  BrainOrchestratorResult,
  BrainReplayRecord,
} from "./brain-orchestrator.types.js";
import {
  defaultBrainOrchestrator,
} from "./brain-orchestrator.service.js";

export class BrainReplayService {
  readonly #records =
    new Map<string, BrainReplayRecord>();

  remember(
    input: BrainOrchestratorInput,
    result: BrainOrchestratorResult,
  ): void {
    this.#records.set(
      result.runId,
      Object.freeze({
        runId: result.runId,
        createdAt:
          new Date().toISOString(),
        input,
        result,
      }),
    );
  }

  list():
    readonly BrainReplayRecord[] {
    return Object.freeze(
      [...this.#records.values()]
        .sort(
          (left, right) =>
            right.createdAt.localeCompare(
              left.createdAt,
            ),
        )
        .slice(0, 100),
    );
  }

  get(
    runId: string,
  ): BrainReplayRecord | undefined {
    return this.#records.get(
      runId,
    );
  }

  async replay(
    runId: string,
  ): Promise<BrainReplayRecord> {
    const record =
      this.#records.get(
        runId,
      );

    if (!record) {
      throw new Error(
        `Run ${runId} no encontrado.`,
      );
    }

    const result =
      await defaultBrainOrchestrator
        .run(record.input);

    const replayed =
      Object.freeze({
        runId:
          result.runId,
        createdAt:
          new Date().toISOString(),
        input:
          record.input,
        result,
      });

    this.#records.set(
      replayed.runId,
      replayed,
    );

    return replayed;
  }
}

export const
  defaultBrainReplay =
    new BrainReplayService();
