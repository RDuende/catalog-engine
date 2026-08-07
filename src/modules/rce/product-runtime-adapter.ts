import type { RceTaskRuntime } from "./task-runtime.js";
import type { RceProductRuntime } from "./product-runtime.js";

export function registerProductRuntimeHandlers(
  taskRuntime: RceTaskRuntime,
  productRuntime: RceProductRuntime,
): void {
  taskRuntime.register(
    "SEARCH_PRODUCTS",
    productRuntime.createSearchHandler(),
  );

  taskRuntime.register(
    "RANK_PRODUCTS",
    productRuntime.createRankingHandler(),
  );
}
