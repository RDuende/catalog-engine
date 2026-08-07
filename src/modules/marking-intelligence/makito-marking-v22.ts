import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

import {
  extractMakitoPrintConfigProducts,
  mapMakitoPrintConfigProduct,
} from "./makito-marking.mapper.js";
import { mergeProviderMarkingProfile } from "./marking-intelligence.service.js";

export interface MakitoTechniqueParseResult {
  readonly raw: string;
  readonly normalized: string;
  readonly tokens: readonly string[];
  readonly malformed: boolean;
  readonly residue?: string;
}

const TECHNIQUE_TOKEN = /\d{6}(?:\(\d+\))?/g;

export function parseMakitoTechniqueString(
  value: unknown,
): MakitoTechniqueParseResult {
  const raw =
    typeof value === "string"
      ? value.trim()
      : "";

  if (!raw) {
    return Object.freeze({
      raw,
      normalized: "",
      tokens: Object.freeze([]),
      malformed: false,
    });
  }

  const tokens =
    [...raw.matchAll(TECHNIQUE_TOKEN)]
      .map((match) => match[0]);

  const residue =
    raw
      .replace(TECHNIQUE_TOKEN, "")
      .replace(/[\s,;|/+]+/g, "")
      .trim();

  return Object.freeze({
    raw,
    normalized: tokens.join(","),
    tokens: Object.freeze(tokens),
    malformed: Boolean(residue),
    ...(residue
      ? { residue }
      : {}),
  });
}

function normalizeRow(
  row: Readonly<Record<string, unknown>>,
  malformed:
    Array<Readonly<Record<string, unknown>>>,
): Readonly<Record<string, unknown>> {
  const areas =
    Array.isArray(row.areas)
      ? row.areas
      : [];

  return Object.freeze({
    ...row,
    areas: Object.freeze(
      areas.map((value) => {
        if (
          !value ||
          typeof value !== "object" ||
          Array.isArray(value)
        ) {
          return value;
        }

        const area =
          value as Record<string, unknown>;

        const parsed =
          parseMakitoTechniqueString(
            area.techniques,
          );

        if (parsed.malformed) {
          malformed.push(
            Object.freeze({
              productId: row.id,
              areaId: area.id,
              raw: parsed.raw,
              normalized:
                parsed.normalized,
              residue: parsed.residue,
            }),
          );
        }

        return Object.freeze({
          ...area,
          techniques: parsed.normalized,
          providerTechniquesRaw:
            parsed.raw,
        });
      }),
    ),
  });
}

interface CatalogVariant {
  readonly sku?: string;
  readonly metadata?:
    Readonly<Record<string, unknown>>;
}

interface CatalogProduct {
  readonly externalId?: string;
  readonly supplierReference?: string;
  readonly sku?: string;
  readonly name?: string;
  readonly variants?:
    readonly CatalogVariant[];
}

async function walk(
  directory: string,
): Promise<string[]> {
  try {
    const entries =
      await readdir(directory);

    const files: string[] = [];

    for (const entry of entries) {
      const full =
        join(directory, entry);

      const info =
        await stat(full);

      if (info.isDirectory()) {
        files.push(
          ...await walk(full),
        );
      } else {
        files.push(full);
      }
    }

    return files;
  } catch {
    return [];
  }
}

async function loadLatestCatalog():
Promise<{
  readonly file?: string;
  readonly products:
    readonly CatalogProduct[];
}> {
  const base =
    join(
      process.cwd(),
      "storage",
      "providers",
      "makito",
      "snapshots",
    );

  const candidates =
    (await walk(base))
      .filter(
        (file) =>
          file.endsWith(
            "normalized-products.json",
          ),
      );

  if (!candidates.length) {
    return {
      products: Object.freeze([]),
    };
  }

  const dated =
    await Promise.all(
      candidates.map(
        async (file) => ({
          file,
          mtime:
            (await stat(file)).mtimeMs,
        }),
      ),
    );

  dated.sort(
    (a, b) =>
      b.mtime - a.mtime,
  );

  const selected =
    dated[0]?.file;

  if (!selected) {
    return {
      products: Object.freeze([]),
    };
  }

  const parsed =
    JSON.parse(
      await readFile(
        selected,
        "utf8",
      ),
    ) as unknown;

  return {
    file: selected,
    products:
      Object.freeze(
        Array.isArray(parsed)
          ? parsed.filter(
              (
                item,
              ): item is CatalogProduct =>
                Boolean(item) &&
                typeof item ===
                  "object",
            )
          : [],
      ),
  };
}

function stringValue(
  value: unknown,
): string | undefined {
  if (
    typeof value !== "string"
  ) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

function indexes(
  products:
    readonly CatalogProduct[],
) {
  const external =
    new Map<
      string,
      CatalogProduct
    >();

  const sku =
    new Map<
      string,
      CatalogProduct
    >();

  const variant =
    new Map<
      string,
      CatalogProduct
    >();

  for (const product of products) {
    for (
      const key of [
        product.externalId,
        product.supplierReference,
      ]
    ) {
      const value =
        stringValue(key);

      if (
        value &&
        !external.has(value)
      ) {
        external.set(
          value,
          product,
        );
      }
    }

    const productSku =
      stringValue(product.sku);

    if (
      productSku &&
      !sku.has(productSku)
    ) {
      sku.set(
        productSku,
        product,
      );
    }

    for (
      const item
      of product.variants ?? []
    ) {
      const variantSku =
        stringValue(item.sku);

      if (
        variantSku &&
        !variant.has(
          variantSku,
        )
      ) {
        variant.set(
          variantSku,
          product,
        );
      }

      const providerRef =
        stringValue(
          item.metadata
            ?.variant_reference,
        );

      if (
        providerRef &&
        !variant.has(
          providerRef,
        )
      ) {
        variant.set(
          providerRef,
          product,
        );
      }
    }
  }

  return {
    external,
    sku,
    variant,
  };
}

function productSummary(
  product:
    CatalogProduct | undefined,
) {
  if (!product) {
    return undefined;
  }

  return Object.freeze({
    externalId:
      product.externalId,
    supplierReference:
      product.supplierReference,
    sku: product.sku,
    name: product.name,
  });
}

export async function
syncMakitoMarkingV22(
  raw:
    Readonly<
      Record<string, unknown>
    >,
): Promise<
  Readonly<
    Record<string, unknown>
  >
> {
  const malformed:
    Array<
      Readonly<
        Record<string, unknown>
      >
    > = [];

  const rows =
    extractMakitoPrintConfigProducts(
      raw,
    )
      .filter(
        (
          row,
        ): row is Readonly<
          Record<string, unknown>
        > =>
          Boolean(row) &&
          typeof row === "object" &&
          !Array.isArray(row),
      )
      .map(
        (row) =>
          normalizeRow(
            row,
            malformed,
          ),
      );

  const catalog =
    await loadLatestCatalog();

  const catalogIndexes =
    indexes(catalog.products);

  let matchedProducts = 0;
  let matchedByExternalId = 0;
  let matchedBySku = 0;
  let matchedByVariant = 0;
  let unmatchedProducts = 0;
  let areas = 0;
  let techniques = 0;

  const unknownTechniqueCodes =
    new Set<string>();

  const unmatchedSample:
    Array<
      Readonly<
        Record<string, unknown>
      >
    > = [];

  for (const row of rows) {
    const id =
      stringValue(row.id);

    let matched:
      CatalogProduct | undefined;

    let matchType:
      | "EXTERNAL_ID"
      | "SKU"
      | "VARIANT"
      | undefined;

    if (id) {
      matched =
        catalogIndexes.external
          .get(id);

      if (matched) {
        matchType =
          "EXTERNAL_ID";
      }

      if (!matched) {
        matched =
          catalogIndexes.sku
            .get(id);

        if (matched) {
          matchType = "SKU";
        }
      }

      if (!matched) {
        matched =
          catalogIndexes.variant
            .get(id);

        if (matched) {
          matchType =
            "VARIANT";
        }
      }
    }

    if (matched) {
      matchedProducts += 1;

      if (
        matchType ===
        "EXTERNAL_ID"
      ) {
        matchedByExternalId += 1;
      } else if (
        matchType === "SKU"
      ) {
        matchedBySku += 1;
      } else if (
        matchType === "VARIANT"
      ) {
        matchedByVariant += 1;
      }
    } else {
      unmatchedProducts += 1;

      if (
        unmatchedSample.length < 20
      ) {
        unmatchedSample.push(
          Object.freeze({
            printConfigId: id,
          }),
        );
      }
    }

    const mapped =
      mapMakitoPrintConfigProduct(
        row,
      );

    if (!mapped) {
      continue;
    }

    const saved =
      await mergeProviderMarkingProfile(
        mapped,
      );

    areas += saved.areas.length;

    for (
      const area
      of saved.areas
    ) {
      techniques +=
        area.techniques.length;

      for (
        const technique
        of area.techniques
      ) {
        if (
          technique.code ===
            "OTHER" &&
          typeof
            technique.providerCode ===
            "string" &&
          technique.providerCode
            .length
        ) {
          unknownTechniqueCodes.add(
            technique.providerCode,
          );
        }
      }
    }
  }

  const kroper =
    catalog.products.find(
      (product) =>
        /kroper/i.test(
          product.name ?? "",
        ) ||
        product.sku === "4855",
    );

  const kroperProviderId =
    kroper?.externalId ??
    kroper?.supplierReference ??
    kroper?.sku;

  const kroperRow =
    kroperProviderId
      ? rows.find(
          (row) =>
            stringValue(row.id) ===
            kroperProviderId,
        )
      : undefined;

  const kroperMapped =
    kroperRow
      ? mapMakitoPrintConfigProduct(
          kroperRow,
        )
      : undefined;

  return Object.freeze({
    status: "imported",
    provider: "makito",
    printConfigProducts:
      rows.length,
    catalogProducts:
      catalog.products.length,
    catalogSnapshot:
      catalog.file,
    matchedProducts,
    matchedByExternalId,
    matchedBySku,
    matchedByVariant,
    unmatchedProducts,
    areas,
    techniques,
    malformedTechniqueStrings:
      malformed.length,
    malformedTechniqueSample:
      Object.freeze(
        malformed.slice(0, 20),
      ),
    unknownTechniqueCodes:
      Object.freeze(
        [
          ...unknownTechniqueCodes,
        ].sort(),
      ),
    unmatchedSample:
      Object.freeze(
        unmatchedSample,
      ),
    kroper: Object.freeze({
      catalogProduct:
        productSummary(kroper),
      providerIdUsed:
        kroperProviderId,
      printConfigFound:
        Boolean(kroperRow),
      areas:
        kroperMapped?.areas ??
        Object.freeze([]),
    }),
  });
}
