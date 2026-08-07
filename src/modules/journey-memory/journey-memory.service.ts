import {
  JsonFileMemoryStore,
  MemoryBrainService,
} from "../memory-brain/index.js";
import type {
  JourneyMemoryApi,
  JourneyMemoryDecisionCommand,
  JourneyMemoryMessageCommand,
  JourneyMemoryQuestionCommand,
  JourneyMemoryState,
} from "./journey-memory.types.js";

function defaultStorePath(): string {
  return (
    process.env
      .JOURNEY_MEMORY_STORE_FILE ??
    ".data/journey-memory.json"
  );
}

export class JourneyMemoryService
  implements JourneyMemoryApi {
  readonly #memory: MemoryBrainService;

  constructor(
    memoryBrain?: MemoryBrainService,
  ) {
    this.#memory =
      memoryBrain ??
      new MemoryBrainService(
        new JsonFileMemoryStore(
          defaultStorePath(),
        ),
      );
  }

  async ingestMessage(
    command: JourneyMemoryMessageCommand,
  ): Promise<JourneyMemoryState> {
    const memory =
      await this.#memory.ingestMessage(
        command.journeyId,
        command.ownerId,
        {
          id: command.messageId,
          text: command.text,
          ...(command.createdAt
            ? {
                createdAt:
                  command.createdAt,
              }
            : {}),
        },
      );

    return Object.freeze({
      memory,
      snapshot:
        this.#memory.snapshot(memory),
    });
  }

  async getState(
    journeyId: string,
    ownerId: string,
  ): Promise<JourneyMemoryState> {
    const memory =
      await this.#memory.getOrCreate(
        journeyId,
        ownerId,
      );

    return Object.freeze({
      memory,
      snapshot:
        this.#memory.snapshot(memory),
    });
  }

  async askQuestion(
    command:
      JourneyMemoryQuestionCommand,
  ): Promise<JourneyMemoryState> {
    const memory =
      await this.#memory.askQuestion(
        command.journeyId,
        command.ownerId,
        command.question,
      );

    return Object.freeze({
      memory,
      snapshot:
        this.#memory.snapshot(memory),
    });
  }

  async recordDecision(
    command:
      JourneyMemoryDecisionCommand,
  ): Promise<JourneyMemoryState> {
    const memory =
      await this.#memory.recordDecision(
        command.journeyId,
        command.ownerId,
        command.decision,
      );

    return Object.freeze({
      memory,
      snapshot:
        this.#memory.snapshot(memory),
    });
  }
}

export const defaultJourneyMemory =
  new JourneyMemoryService();
