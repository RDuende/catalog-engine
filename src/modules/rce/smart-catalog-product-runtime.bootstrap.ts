import type { RceTaskRuntime } from "./task-runtime.js";
import {
  RceProductRuntime,
} from "./product-runtime.js";
import {
  registerProductRuntimeHandlers,
} from "./product-runtime-adapter.js";
import {
  SmartCatalogProductRankingAdapter,
  SmartCatalogProductSearchAdapter,
  type SmartCatalogServiceLike,
} from "./smart-catalog-product-runtime.adapter.js";

export interface SmartCatalogProductRuntimeBootstrap {
  readonly productRuntime: RceProductRuntime;
}

export function registerSmartCatalogProductRuntime(input: {
  readonly taskRuntime: RceTaskRuntime;
  readonly smartCatalog: SmartCatalogServiceLike;
}): SmartCatalogProductRuntimeBootstrap {
  const productRuntime = new RceProductRuntime({
    searchPort: new SmartCatalogProductSearchAdapter(
      input.smartCatalog,
    ),
    rankingPort: new SmartCatalogProductRankingAdapter(),
  });

  registerProductRuntimeHandlers(
    input.taskRuntime,
    productRuntime,
  );

  return Object.freeze({
    productRuntime,
  });
}
