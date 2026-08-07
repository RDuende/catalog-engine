import {
  withResolvedRuntimeImages,
} from "./image-runtime.service.js";
import type {
  RuntimeImageCarrier,
} from "./image-runtime.types.js";

export function resolveSmartCatalogProductImage<
  T extends RuntimeImageCarrier,
>(product: T) {
  return withResolvedRuntimeImages(
    product,
  );
}

export function resolveSmartCatalogProductImages<
  T extends RuntimeImageCarrier,
>(products: readonly T[]) {
  return Object.freeze(
    products.map(
      resolveSmartCatalogProductImage,
    ),
  );
}
