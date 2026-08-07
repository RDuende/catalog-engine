import {
  createConversationState,
  RaiConversationEngine,
} from "./engine.js";
import { RceConversationPlanner } from "./conversation-planner.js";
import { RceTaskRuntime } from "./task-runtime.js";
import { taskProgressView } from "./task-runtime-view.js";
import type { RceConversationState } from "./contracts.js";
import type {
  RaiCoreHealth,
  RaiCoreMessageInput,
  RaiCoreMessageResult,
  RaiCoreRuntimeMetrics,
} from "./rai-core.contracts.js";
import {
  RAI_CORE_VERSION,
} from "./rai-core.contracts.js";
import type { RceProductRuntime } from "./product-runtime.js";
import type { RceStoryRuntime } from "./story-runtime.js";
import type { RceImageRuntime } from "./image-runtime.js";

export interface RaiCoreRuntimeOptions {
  readonly taskRuntime?: RceTaskRuntime;
  readonly productRuntime?: RceProductRuntime;
  readonly storyRuntime?: RceStoryRuntime;
  readonly imageRuntime?: RceImageRuntime;
}

export class RaiCoreRuntime {
  readonly #conversationEngine = new RaiConversationEngine();
  readonly #planner = new RceConversationPlanner();
  readonly #taskRuntime: RceTaskRuntime;
  readonly #states = new Map<string, RceConversationState>();
  readonly #productRuntime?: RceProductRuntime;
  readonly #storyRuntime?: RceStoryRuntime;
  readonly #imageRuntime?: RceImageRuntime;

  constructor(options: RaiCoreRuntimeOptions = {}) {
    this.#taskRuntime = options.taskRuntime ?? new RceTaskRuntime();
    this.#productRuntime = options.productRuntime;
    this.#storyRuntime = options.storyRuntime;
    this.#imageRuntime = options.imageRuntime;
  }

  get taskRuntime(): RceTaskRuntime {
    return this.#taskRuntime;
  }

  health(now = new Date().toISOString()): RaiCoreHealth {
    const capabilities = Object.freeze({
      CONVERSATION: true,
      TASKS: true,
      PRODUCTS: Boolean(this.#productRuntime),
      STORIES: Boolean(this.#storyRuntime),
      IMAGES: Boolean(this.#imageRuntime),
    });

    return Object.freeze({
      version: RAI_CORE_VERSION,
      status: "READY",
      capabilities,
      checkedAt: now,
    });
  }

  metrics(): RaiCoreRuntimeMetrics {
    return Object.freeze({
      ...(this.#productRuntime
        ? { product: this.#productRuntime.metrics() }
        : {}),
      ...(this.#storyRuntime
        ? { story: this.#storyRuntime.metrics() }
        : {}),
      ...(this.#imageRuntime
        ? { image: this.#imageRuntime.metrics() }
        : {}),
    });
  }

  process(input: RaiCoreMessageInput): RaiCoreMessageResult {
    const now = input.now ?? new Date().toISOString();
    const previous =
      this.#states.get(input.conversationId) ??
      createConversationState(input.conversationId, now);

    const process = this.#conversationEngine.process(
      previous,
      Object.freeze({
        id: input.messageId,
        role: "USER",
        text: input.text,
        createdAt: now,
      }),
    );

    this.#states.set(input.conversationId, process.state);

    const plan = this.#planner.plan({
      state: process.state,
      text: input.text,
      understanding: process.understanding,
      now,
    });

    const tasks = this.#taskRuntime.plan({
      conversationId: input.conversationId,
      tasks: plan.tasks,
      now,
    });

    return Object.freeze({
      version: RAI_CORE_VERSION,
      process,
      plan,
      tasks,
    });
  }

  getState(
    conversationId: string,
  ): RceConversationState | undefined {
    return this.#states.get(conversationId);
  }

  getProgress(conversationId: string) {
    return taskProgressView(
      this.#taskRuntime.get(conversationId),
    );
  }

  async runNextTask(conversationId: string) {
    return this.#taskRuntime.runNext(conversationId);
  }
}
