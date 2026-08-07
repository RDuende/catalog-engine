import type { RceTaskRuntime } from "./task-runtime.js";
import type { RceImageRuntime } from "./image-runtime.js";

export function registerImageRuntimeHandler(
  taskRuntime: RceTaskRuntime,
  imageRuntime: RceImageRuntime,
): void {
  taskRuntime.register(
    "PREPARE_PROPOSALS",
    imageRuntime.createHandler(),
  );
}
