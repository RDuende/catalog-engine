import { RceTaskRuntime } from "./task-runtime.js";
import { RceProductRuntime } from "./product-runtime.js";
import { RceStoryRuntime } from "./story-runtime.js";
import { RceImageRuntime } from "./image-runtime.js";
import { registerProductRuntimeHandlers } from "./product-runtime-adapter.js";
import { registerStoryRuntimeHandler } from "./story-runtime-adapter.js";
import { registerImageRuntimeHandler } from "./image-runtime-adapter.js";
import type {
  RceProductSearchPort,
  RceProductRankingPort,
} from "./product-runtime.contracts.js";
import type {
  RceStoryGenerationPort,
} from "./story-runtime.contracts.js";
import type {
  RceImagePreparationPort,
} from "./image-runtime.contracts.js";
import { RaiCoreRuntime } from "./rai-core-runtime.js";

export interface RaiCoreBootstrapOptions {
  readonly productSearch?: RceProductSearchPort;
  readonly productRanking?: RceProductRankingPort;
  readonly storyGeneration?: RceStoryGenerationPort;
  readonly imagePreparation?: RceImagePreparationPort;
}

export interface RaiCoreBootstrapResult {
  readonly core: RaiCoreRuntime;
  readonly taskRuntime: RceTaskRuntime;
  readonly productRuntime?: RceProductRuntime;
  readonly storyRuntime?: RceStoryRuntime;
  readonly imageRuntime?: RceImageRuntime;
}

export function createRaiCore(
  options: RaiCoreBootstrapOptions = {},
): RaiCoreBootstrapResult {
  const taskRuntime = new RceTaskRuntime();

  const productRuntime =
    options.productSearch && options.productRanking
      ? new RceProductRuntime({
          searchPort: options.productSearch,
          rankingPort: options.productRanking,
        })
      : undefined;

  const storyRuntime = options.storyGeneration
    ? new RceStoryRuntime({
        port: options.storyGeneration,
      })
    : undefined;

  const imageRuntime = options.imagePreparation
    ? new RceImageRuntime({
        port: options.imagePreparation,
      })
    : undefined;

  if (productRuntime) {
    registerProductRuntimeHandlers(
      taskRuntime,
      productRuntime,
    );
  }

  if (storyRuntime) {
    registerStoryRuntimeHandler(
      taskRuntime,
      storyRuntime,
    );
  }

  if (imageRuntime) {
    registerImageRuntimeHandler(
      taskRuntime,
      imageRuntime,
    );
  }

  const core = new RaiCoreRuntime({
    taskRuntime,
    ...(productRuntime ? { productRuntime } : {}),
    ...(storyRuntime ? { storyRuntime } : {}),
    ...(imageRuntime ? { imageRuntime } : {}),
  });

  return Object.freeze({
    core,
    taskRuntime,
    ...(productRuntime ? { productRuntime } : {}),
    ...(storyRuntime ? { storyRuntime } : {}),
    ...(imageRuntime ? { imageRuntime } : {}),
  });
}
