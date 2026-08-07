import type {
  MakitoImageReference,
} from "./makito-image-manager.types.js";

function record(
  value: unknown,
): Readonly<Record<string, unknown>> {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? value as Readonly<Record<string, unknown>>
    : {};
}

function stringValue(
  value: unknown,
): string | undefined {
  return typeof value === "string" &&
    /^https?:\/\//iu.test(value.trim())
    ? value.trim()
    : undefined;
}

function pushReference(
  output: MakitoImageReference[],
  productId: string,
  sku: string | undefined,
  kind: MakitoImageReference["kind"],
  url: unknown,
  position: number,
): void {
  const normalized = stringValue(url);

  if (!normalized) return;

  output.push(
    Object.freeze({
      productId,
      ...(sku ? { sku } : {}),
      kind,
      url: normalized,
      position,
    }),
  );
}

export function extractMakitoImageReferences(
  rawProduct: unknown,
  index: number,
): readonly MakitoImageReference[] {
  const product = record(rawProduct);
  const metadata = record(product.metadata);
  const providerRaw =
    record(metadata.providerRaw);

  const productId =
    String(
      product.externalId ??
      product.id ??
      product.supplierReference ??
      product.sku ??
      `product-${index}`,
    );

  const sku =
    typeof product.sku === "string"
      ? product.sku
      : undefined;

  const output:
    MakitoImageReference[] = [];

  const media =
    Array.isArray(product.media)
      ? product.media
      : [];

  for (
    let mediaIndex = 0;
    mediaIndex < media.length;
    mediaIndex += 1
  ) {
    const item = record(
      media[mediaIndex],
    );

    pushReference(
      output,
      productId,
      sku,
      item.isPrimary === true
        ? "PRIMARY"
        : "OTHER",
      item.url,
      Number(item.position) ||
        mediaIndex,
    );
  }

  pushReference(
    output,
    productId,
    sku,
    "PRIMARY",
    providerRaw.image,
    0,
  );

  pushReference(
    output,
    productId,
    sku,
    "THUMBNAIL",
    providerRaw.thumbnail_image,
    0,
  );

  const details =
    Array.isArray(
      providerRaw.detail_images,
    )
      ? providerRaw.detail_images
      : [];

  for (
    let detailIndex = 0;
    detailIndex < details.length;
    detailIndex += 1
  ) {
    pushReference(
      output,
      productId,
      sku,
      "DETAIL",
      details[detailIndex],
      detailIndex,
    );
  }

  const variants =
    Array.isArray(product.variants)
      ? product.variants
      : [];

  for (
    let variantIndex = 0;
    variantIndex < variants.length;
    variantIndex += 1
  ) {
    const variant = record(
      variants[variantIndex],
    );
    const variantMetadata =
      record(variant.metadata);

    pushReference(
      output,
      productId,
      sku,
      "VARIANT",
      variantMetadata.variant_image ??
      variantMetadata.variantImage,
      variantIndex,
    );

    pushReference(
      output,
      productId,
      sku,
      "THUMBNAIL",
      variantMetadata.variant_thumbnail,
      variantIndex,
    );
  }

  const providerVariants =
    Array.isArray(providerRaw.variants)
      ? providerRaw.variants
      : [];

  for (
    let variantIndex = 0;
    variantIndex <
      providerVariants.length;
    variantIndex += 1
  ) {
    const variant = record(
      providerVariants[variantIndex],
    );

    pushReference(
      output,
      productId,
      sku,
      "VARIANT",
      variant.variant_image,
      variantIndex,
    );

    pushReference(
      output,
      productId,
      sku,
      "THUMBNAIL",
      variant.variant_thumbnail,
      variantIndex,
    );
  }

  const unique =
    new Map<string, MakitoImageReference>();

  for (const reference of output) {
    const key =
      `${reference.kind}:${reference.url}`;

    if (!unique.has(key)) {
      unique.set(key, reference);
    }
  }

  return Object.freeze(
    [...unique.values()],
  );
}
