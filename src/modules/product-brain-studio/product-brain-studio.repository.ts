import {
  readdir,
  readFile,
  stat,
} from "node:fs/promises";
import { join } from "node:path";

import type {
  ProductBrainStudioProduct,
  ProductBrainStudioSearchInput,
} from "./product-brain-studio.types.js";

function record(
  value: unknown,
): Readonly<Record<string, unknown>> {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? value as Readonly<Record<string, unknown>>
    : {};
}

function strings(
  value: unknown,
): readonly string[] {
  if (typeof value === "string") {
    return Object.freeze([value]);
  }

  if (Array.isArray(value)) {
    return Object.freeze(
      value.filter(
        (item): item is string =>
          typeof item === "string",
      ),
    );
  }

  return Object.freeze([]);
}

function numberValue(
  value: unknown,
): number | undefined {
  return typeof value === "number" &&
    Number.isFinite(value)
    ? value
    : undefined;
}

function textValue(
  value: unknown,
): string | undefined {
  return typeof value === "string" &&
    value.trim()
    ? value.trim()
    : undefined;
}

function hasImageExtension(
  value: string,
): boolean {
  return /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/iu.test(
    value.trim(),
  );
}

function looksLikeImageReference(
  value: string,
  keyHint = "",
): boolean {
  const source = value.trim();

  if (!source) {
    return false;
  }

  const normalized =
    source.toLowerCase();

  const visualKey =
    /image|images|photo|photos|picture|pictures|thumbnail|thumb|gallery|media|localpath|local_path|downloaded|filepath|file_path|publicpath|public_path|original|large|zoom|src|url/iu.test(
      keyHint,
    );

  const remote =
    /^https?:\/\//iu.test(source);
  const data =
    /^data:image\//iu.test(source);
  const windowsAbsolute =
    /^[a-z]:[\/]/iu.test(source);
  const unixAbsolute =
    source.startsWith("/");
  const fileUrl =
    /^file:\/+/iu.test(source);
  const relativeStorage =
    /^(?:\.{0,2}[\/])?(?:storage|public|uploads|images|media|assets)[\/]/iu.test(
      source,
    );
  const providerStorage =
    /[\/]storage[\/]providers[\/]/iu.test(
      source,
    );
  const visualUrlPath =
    normalized.includes("/images/") ||
    normalized.includes("/image/") ||
    normalized.includes("/media/") ||
    normalized.includes("/uploads/");

  return (
    data ||
    (
      hasImageExtension(source) &&
      (
        remote ||
        windowsAbsolute ||
        unixAbsolute ||
        fileUrl ||
        relativeStorage ||
        providerStorage ||
        visualKey
      )
    ) ||
    (
      remote &&
      (
        visualKey ||
        visualUrlPath
      )
    )
  );
}

function collectImageReferences(
  value: unknown,
  keyHint = "",
  depth = 0,
  seen = new Set<unknown>(),
): readonly string[] {
  if (
    value === null ||
    value === undefined ||
    depth > 8
  ) {
    return Object.freeze([]);
  }

  if (typeof value === "string") {
    return looksLikeImageReference(
      value,
      keyHint,
    )
      ? Object.freeze([
          value.trim(),
        ])
      : Object.freeze([]);
  }

  if (typeof value === "object") {
    if (seen.has(value)) {
      return Object.freeze([]);
    }

    seen.add(value);
  }

  if (Array.isArray(value)) {
    return Object.freeze(
      value.flatMap((item) =>
        collectImageReferences(
          item,
          keyHint,
          depth + 1,
          seen,
        ),
      ),
    );
  }

  if (typeof value === "object") {
    return Object.freeze(
      Object.entries(
        value as
          Record<string, unknown>,
      ).flatMap(([key, item]) =>
        collectImageReferences(
          item,
          key,
          depth + 1,
          seen,
        ),
      ),
    );
  }

  return Object.freeze([]);
}

function imageReferencePriority(
  value: string,
): number {
  if (
    /^[a-z]:[\/]/iu.test(value) ||
    /^file:\/+/iu.test(value)
  ) {
    return 100;
  }

  if (
    /^(?:\.{0,2}[\/])?(?:storage|public|uploads|images|media|assets)[\/]/iu.test(
      value,
    ) ||
    /[\/]storage[\/]providers[\/]/iu.test(
      value,
    )
  ) {
    return 90;
  }

  if (value.startsWith("/")) {
    return 80;
  }

  if (
    value.startsWith("data:image/")
  ) {
    return 70;
  }

  if (
    /^https?:\/\//iu.test(value)
  ) {
    return 50;
  }

  return 10;
}

function uniqueImages(
  values: readonly string[],
): readonly string[] {
  const unique =
    [...new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean),
    )];

  unique.sort(
    (left, right) =>
      imageReferencePriority(right) -
      imageReferencePriority(left),
  );

  return Object.freeze(unique);
}

function normalizeProduct(
  rawValue: unknown,
  index: number,
): ProductBrainStudioProduct {
  const raw = record(rawValue);
  const productBrain =
    record(
      raw.productBrain ??
      raw.product_brain,
    );

  const id =
    textValue(raw.id) ??
    textValue(raw.productId) ??
    textValue(raw.sku) ??
    `product-${index}`;

  const canonicalInterests =
    strings(
      raw.canonicalInterests ??
      productBrain.canonicalInterests ??
      productBrain.interests,
    );

  const materials =
    strings(
      raw.materials ??
      productBrain.materials,
    );

  const techniques =
    strings(
      raw.techniques ??
      productBrain.techniques,
    );

  const themes =
    strings(
      raw.themes ??
      productBrain.themes,
    );

  const roles =
    strings(
      raw.roles ??
      productBrain.roles ??
      productBrain.productRoles,
    );

  const images =
    uniqueImages([
      ...collectImageReferences(
        raw.images,
        "images",
      ),
      ...collectImageReferences(
        raw.image,
        "image",
      ),
      ...collectImageReferences(
        raw.gallery,
        "gallery",
      ),
      ...collectImageReferences(
        raw.media,
        "media",
      ),
      ...collectImageReferences(
        raw.thumbnail,
        "thumbnail",
      ),
      ...collectImageReferences(
        raw,
        "product",
      ),
    ]);

  const primaryImage =
    textValue(
      raw.primaryImage ??
      raw.mainImage ??
      raw.imageUrl ??
      raw.thumbnailUrl,
    ) ??
    images[0];

  return Object.freeze({
    id,
    ...(textValue(raw.sku)
      ? { sku: textValue(raw.sku) }
      : {}),
    name:
      textValue(raw.name) ??
      textValue(raw.title) ??
      `Producto ${index + 1}`,
    ...(textValue(raw.description)
      ? {
          description:
            textValue(raw.description),
        }
      : {}),
    ...(textValue(raw.category)
      ? {
          category:
            textValue(raw.category),
        }
      : {}),
    ...(textValue(
      raw.provider ??
      raw.providerId ??
      raw.source,
    )
      ? {
          provider:
            textValue(
              raw.provider ??
              raw.providerId ??
              raw.source,
            ),
        }
      : {}),
    ...(numberValue(
      raw.price ??
      record(raw.pricing).price,
    ) !== undefined
      ? {
          price:
            numberValue(
              raw.price ??
              record(raw.pricing).price,
            ),
        }
      : {}),
    ...(numberValue(
      raw.stock ??
      record(raw.inventory).stock,
    ) !== undefined
      ? {
          stock:
            numberValue(
              raw.stock ??
              record(raw.inventory).stock,
            ),
        }
      : {}),
    tags: strings(raw.tags),
    canonicalInterests,
    materials,
    techniques,
    themes,
    roles,
    images,
    ...(primaryImage
      ? { primaryImage }
      : {}),
    ...(Object.keys(productBrain).length
      ? { productBrain }
      : {}),
    raw,
  });
}

async function walk(
  directory: string,
): Promise<readonly string[]> {
  const entries = await readdir(
    directory,
    {
      withFileTypes: true,
    },
  );

  const result: string[] = [];

  for (const entry of entries) {
    const full = join(
      directory,
      entry.name,
    );

    if (entry.isDirectory()) {
      result.push(
        ...await walk(full),
      );
    } else if (
      entry.isFile() &&
      entry.name ===
        "normalized-products.json"
    ) {
      result.push(full);
    }
  }

  return Object.freeze(result);
}

export class ProductBrainStudioRepository {
  readonly #root: string;
  #snapshotPath?: string;
  #products?: readonly ProductBrainStudioProduct[];

  constructor(
    root =
      join(
        process.cwd(),
        "storage",
        "providers",
        "makito",
        "snapshots",
      ),
  ) {
    this.#root = root;
  }

  async snapshotPath(): Promise<string> {
    if (this.#snapshotPath) {
      return this.#snapshotPath;
    }

    const files =
      await walk(this.#root);

    if (!files.length) {
      throw new Error(
        `No se encontró normalized-products.json en ${this.#root}.`,
      );
    }

    const dated =
      await Promise.all(
        files.map(async (file) => ({
          file,
          modified:
            (await stat(file)).mtimeMs,
        })),
      );

    dated.sort(
      (left, right) =>
        right.modified -
        left.modified,
    );

    this.#snapshotPath =
      dated[0]?.file;

    if (!this.#snapshotPath) {
      throw new Error(
        "No se pudo resolver el snapshot más reciente.",
      );
    }

    return this.#snapshotPath;
  }

  async products():
    Promise<
      readonly ProductBrainStudioProduct[]
    > {
    if (this.#products) {
      return this.#products;
    }

    const file =
      await this.snapshotPath();
    const parsed =
      JSON.parse(
        await readFile(file, "utf8"),
      ) as unknown;

    const rows =
      Array.isArray(parsed)
        ? parsed
        : Array.isArray(
            record(parsed).products,
          )
          ? record(parsed).products as unknown[]
          : [];

    this.#products =
      Object.freeze(
        rows.map(normalizeProduct),
      );

    return this.#products;
  }

  async findById(
    productId: string,
  ): Promise<
    ProductBrainStudioProduct |
    undefined
  > {
    return (
      await this.products()
    ).find(
      (product) =>
        product.id === productId ||
        product.sku === productId,
    );
  }

  async search(
    input: ProductBrainStudioSearchInput,
  ): Promise<{
    readonly total: number;
    readonly items:
      readonly ProductBrainStudioProduct[];
  }> {
    const products =
      await this.products();
    const query =
      input.query?.trim()
        .toLocaleLowerCase(
          "es-ES",
        );

    const filtered =
      products.filter(
        (product) => {
          const haystack = [
            product.id,
            product.sku ?? "",
            product.name,
            product.description ?? "",
            product.category ?? "",
            product.provider ?? "",
            ...product.tags,
            ...product.canonicalInterests,
            ...product.materials,
            ...product.techniques,
            ...product.roles,
          ]
            .join(" ")
            .toLocaleLowerCase(
              "es-ES",
            );

          if (
            query &&
            !haystack.includes(query)
          ) {
            return false;
          }

          if (
            input.interest &&
            !product
              .canonicalInterests
              .includes(
                input.interest,
              )
          ) {
            return false;
          }

          if (
            input.material &&
            !product.materials.includes(
              input.material,
            )
          ) {
            return false;
          }

          if (
            input.technique &&
            !product.techniques.includes(
              input.technique,
            )
          ) {
            return false;
          }

          if (
            input.role &&
            !product.roles.includes(
              input.role,
            )
          ) {
            return false;
          }

          if (
            input.provider &&
            product.provider !==
              input.provider
          ) {
            return false;
          }

          if (
            input.orphanOnly &&
            (
              product
                .canonicalInterests
                .length > 0 ||
              product.materials.length >
                0 ||
              product.techniques.length >
                0 ||
              product.roles.length > 0
            )
          ) {
            return false;
          }

          return true;
        },
      );

    const offset =
      Math.max(
        0,
        input.offset ?? 0,
      );
    const limit =
      Math.max(
        1,
        Math.min(
          200,
          input.limit ?? 50,
        ),
      );

    return Object.freeze({
      total: filtered.length,
      items: Object.freeze(
        filtered.slice(
          offset,
          offset + limit,
        ),
      ),
    });
  }

  invalidate(): void {
    this.#products = undefined;
    this.#snapshotPath = undefined;
  }
}

export const
  defaultProductBrainStudioRepository =
    new ProductBrainStudioRepository();
