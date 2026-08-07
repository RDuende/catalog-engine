import {
  resolveCatalogImages,
} from "../image-resolver/index.js";
import type {
  CatalogImageCandidate,
} from "../image-resolver/index.js";
import type {
  RuntimeImageCarrier,
  RuntimeProductImageInput,
  RuntimeProductImageResult,
} from "./image-runtime.types.js";

function record(
  value: unknown,
): Readonly<Record<string, unknown>> {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? value as
        Readonly<Record<string, unknown>>
    : {};
}

function stringValue(
  value: unknown,
): string | undefined {
  return typeof value === "string" &&
    value.trim()
    ? value.trim()
    : undefined;
}

function numberValue(
  value: unknown,
): number | undefined {
  return typeof value === "number" &&
    Number.isFinite(value)
    ? value
    : undefined;
}

function candidateFromMedia(
  value: unknown,
  index: number,
): CatalogImageCandidate | undefined {
  const media = record(value);
  const metadata =
    record(media.metadata);
  const url =
    stringValue(media.url) ??
    stringValue(media.imageUrl) ??
    stringValue(media.src) ??
    stringValue(
      metadata.localPublicUrl,
    ) ??
    stringValue(
      metadata.providerUrl,
    );

  if (!url) return undefined;

  return Object.freeze({
    ...(stringValue(media.id)
      ? { id: stringValue(media.id) }
      : {}),
    url,
    ...(stringValue(
      metadata.providerUrl,
    )
      ? {
          providerUrl:
            stringValue(
              metadata.providerUrl,
            ),
        }
      : {}),
    ...(stringValue(
      metadata.localPublicUrl,
    )
      ? {
          localPublicUrl:
            stringValue(
              metadata.localPublicUrl,
            ),
        }
      : {}),
    ...(stringValue(
      metadata.localFilename,
    )
      ? {
          localFilename:
            stringValue(
              metadata.localFilename,
            ),
        }
      : {}),
    ...(stringValue(
      metadata.sha256,
    )
      ? {
          sha256:
            stringValue(
              metadata.sha256,
            ),
        }
      : {}),
    ...(numberValue(
      metadata.width,
    ) !== undefined
      ? {
          width:
            numberValue(
              metadata.width,
            ),
        }
      : {}),
    ...(numberValue(
      metadata.height,
    ) !== undefined
      ? {
          height:
            numberValue(
              metadata.height,
            ),
        }
      : {}),
    position:
      numberValue(media.position) ??
      index,
    metadata,
  });
}

function candidatesFrom(
  input: RuntimeProductImageInput,
): readonly CatalogImageCandidate[] {
  const candidates:
    CatalogImageCandidate[] = [];

  if (input.imageUrl) {
    candidates.push({
      url: input.imageUrl,
      position: 0,
      metadata: {
        isPrimary: true,
      },
    });
  }

  for (
    let index = 0;
    index <
      (input.images?.length ?? 0);
    index += 1
  ) {
    const url =
      input.images?.[index];

    if (!url) continue;

    candidates.push({
      url,
      position: index + 1,
    });
  }

  for (
    let index = 0;
    index <
      (input.media?.length ?? 0);
    index += 1
  ) {
    const candidate =
      candidateFromMedia(
        input.media?.[index],
        index,
      );

    if (candidate) {
      candidates.push(candidate);
    }
  }

  const unique =
    new Map<
      string,
      CatalogImageCandidate
    >();

  for (const candidate of
    candidates) {
    const key = [
      candidate.sha256 ?? "",
      candidate.localPublicUrl ?? "",
      candidate.providerUrl ?? "",
      candidate.url,
    ].join("|");

    if (!unique.has(key)) {
      unique.set(key, candidate);
    }
  }

  return Object.freeze(
    [...unique.values()],
  );
}

export function resolveRuntimeProductImages(
  input: RuntimeProductImageInput,
): RuntimeProductImageResult {
  const resolution =
    resolveCatalogImages(
      candidatesFrom(input),
    );

  const primary =
    resolution.selected[0];

  return Object.freeze({
    productId: input.productId,
    ...(primary
      ? {
          imageUrl:
            primary.publicUrl,
          primary,
        }
      : {}),
    images:
      Object.freeze(
        resolution.selected.map(
          (image) =>
            image.publicUrl,
        ),
      ),
    resolution,
  });
}

export function withResolvedRuntimeImages<
  T extends RuntimeImageCarrier,
>(
  value: T,
): T & {
  readonly imageUrl?: string;
  readonly images:
    readonly string[];
  readonly imageResolution:
    RuntimeProductImageResult["resolution"];
} {
  const productId =
    value.productId ??
    value.id ??
    value.sku ??
    "unknown-product";

  const resolved =
    resolveRuntimeProductImages({
      productId,
      ...(value.providerKey
        ? {
            providerKey:
              value.providerKey,
          }
        : {}),
      ...(value.sku
        ? { sku: value.sku }
        : {}),
      ...(value.imageUrl
        ? {
            imageUrl:
              value.imageUrl,
          }
        : {}),
      ...(value.images
        ? { images: value.images }
        : {}),
      ...(value.media
        ? { media: value.media }
        : {}),
    });

  return Object.freeze({
    ...value,
    ...(resolved.imageUrl
      ? {
          imageUrl:
            resolved.imageUrl,
        }
      : {}),
    images:
      resolved.images,
    imageResolution:
      resolved.resolution,
  });
}

export function resolveRuntimeCollection<
  T extends RuntimeImageCarrier,
>(
  values: readonly T[],
): readonly (
  T & {
    readonly imageUrl?: string;
    readonly images:
      readonly string[];
    readonly imageResolution:
      RuntimeProductImageResult["resolution"];
  }
)[] {
  return Object.freeze(
    values.map(
      withResolvedRuntimeImages,
    ),
  );
}
