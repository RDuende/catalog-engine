import {
  withResolvedRuntimeImages,
} from "./image-runtime.service.js";
import type {
  RuntimeImageCarrier,
} from "./image-runtime.types.js";

export interface PublicProductImageView {
  readonly productId: string;
  readonly imageUrl?: string;
  readonly images:
    readonly string[];
  readonly alt: string;
}

export function publicProductImageView(
  product:
    RuntimeImageCarrier & {
      readonly name?: string;
      readonly title?: string;
    },
): PublicProductImageView {
  const resolved =
    withResolvedRuntimeImages(
      product,
    );

  return Object.freeze({
    productId:
      resolved.productId ??
      resolved.id ??
      resolved.sku ??
      "unknown-product",
    ...(resolved.imageUrl
      ? {
          imageUrl:
            resolved.imageUrl,
        }
      : {}),
    images:
      resolved.images,
    alt:
      product.name ??
      product.title ??
      "Producto",
  });
}
