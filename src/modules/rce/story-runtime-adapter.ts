import type { RceTaskRuntime } from "./task-runtime.js";
import type { RceStoryRuntime } from "./story-runtime.js";

export function registerStoryRuntimeHandler(
  taskRuntime: RceTaskRuntime,
  storyRuntime: RceStoryRuntime,
): void {
  taskRuntime.register(
    "PREPARE_STORY_SEEDS",
    storyRuntime.createHandler(),
  );
}
