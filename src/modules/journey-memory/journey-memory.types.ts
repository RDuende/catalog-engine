import type {
  JourneyMemory,
  MemoryDecision,
  MemoryQuestion,
  MemorySnapshot,
} from "../memory-brain/index.js";

export interface JourneyMemoryMessageCommand {
  readonly journeyId: string;
  readonly ownerId: string;
  readonly messageId: string;
  readonly text: string;
  readonly createdAt?: string;
}

export interface JourneyMemoryQuestionCommand {
  readonly journeyId: string;
  readonly ownerId: string;
  readonly question: MemoryQuestion;
}

export interface JourneyMemoryDecisionCommand {
  readonly journeyId: string;
  readonly ownerId: string;
  readonly decision: Omit<
    MemoryDecision,
    "id" | "createdAt"
  >;
}

export interface JourneyMemoryState {
  readonly memory: JourneyMemory;
  readonly snapshot: MemorySnapshot;
}

export interface JourneyGiftProfilePatch {
  readonly recipients?: readonly string[];
  readonly recipientCount?: number;
  readonly relationships?: readonly string[];
  readonly ages?: readonly number[];
  readonly interests?: readonly string[];
  readonly budget?: number;
  readonly occasions?: readonly string[];
  readonly preferredMaterials?: readonly string[];
  readonly preferredProducts?: readonly string[];
  readonly rejectedProducts?: readonly string[];
  readonly styles?: readonly string[];
}

export interface JourneyMemoryApi {
  ingestMessage(
    command: JourneyMemoryMessageCommand,
  ): Promise<JourneyMemoryState>;

  getState(
    journeyId: string,
    ownerId: string,
  ): Promise<JourneyMemoryState>;

  askQuestion(
    command: JourneyMemoryQuestionCommand,
  ): Promise<JourneyMemoryState>;

  recordDecision(
    command: JourneyMemoryDecisionCommand,
  ): Promise<JourneyMemoryState>;
}
