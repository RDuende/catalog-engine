import type { NormalizedProduct } from "../import-engine/import.types.js";
import { MakitoProviderAdapter } from "./makito-provider.js";
import { asArray, asNumber, asString, firstValue } from "./provider-utils.js";
import { makitoFetchJson, resolveMakitoConfig, type MakitoApiConfig } from "./makito-client.js";

interface MakitoStock { material?: unknown; quantity?: unknown; availableDate?: unknown; storageId?: unknown }
interface MakitoPriceScale { quantity?: unknown; amount?: unknown }
interface MakitoPrice { material?: unknown; currency?: unknown; baseQuantity?: unknown; scales?: unknown }

export interface MakitoSyncOptions {
  includeStock?: boolean;
  includePrices?: boolean;
  includePrintConfig?: boolean;
  includePrintPrices?: boolean;
  limit?: number;
}

export interface MakitoSnapshot {
  provider: "makito";
  generatedAt: string;
  sourceGeneratedAt: Record<string, unknown>;
  stats: { products: number; variants: number; stockRows: number; priceRows: number; printConfigProducts: number; printPriceRows: number };
  products: NormalizedProduct[];
}

function records(source: unknown, paths: string[]): Record<string, unknown>[] {
  const candidate = firstValue(source, paths);
  return asArray(candidate).filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item));
}

function metadata(product: NormalizedProduct): Record<string, unknown> {
  if (!product.metadata || typeof product.metadata !== "object") product.metadata = {};
  return product.metadata as Record<string, unknown>;
}

export async function syncMakitoSnapshot(input: Partial<MakitoApiConfig> = {}, options: MakitoSyncOptions = {}): Promise<MakitoSnapshot> {
  const config = resolveMakitoConfig(input);
  const adapter = new MakitoProviderAdapter();
  const catalogRaw = await makitoFetchJson<Record<string, unknown>>(config, "/catalog/files", { format: "JSON", lang: config.lang ?? "es" });
  const rawProducts = records(catalogRaw, ["products", "data.products", "data", "items"]);
  const products = rawProducts.slice(0, options.limit).map(item => adapter.normalize(item, config)).filter((item): item is NormalizedProduct => Boolean(item));
  const productByRef = new Map(products.map(product => [product.externalId, product]));
  const variantIndex = new Map<string, { product: NormalizedProduct; variant: NonNullable<NormalizedProduct["variants"]>[number] }>();
  for (const product of products) for (const variant of product.variants ?? []) variantIndex.set(variant.sku, { product, variant });

  let stockRows: Record<string, unknown>[] = [];
  let priceRows: Record<string, unknown>[] = [];
  let printConfigRows: Record<string, unknown>[] = [];
  let printPriceRows: Record<string, unknown>[] = [];
  const sourceGeneratedAt: Record<string, unknown> = { catalog: catalogRaw.generatedAt };

  if (options.includeStock !== false) {
    const raw = await makitoFetchJson<Record<string, unknown>>(config, "/stock/files", { format: "JSON", plant: config.plant, storageLocation: config.storageLocation });
    stockRows = records(raw, ["stocks", "data.stocks", "data", "items"]);
    sourceGeneratedAt.stock = raw.generatedAt;
    for (const row of stockRows as MakitoStock[]) {
      const material = asString(row.material);
      if (!material) continue;
      const target = variantIndex.get(material);
      const stock = { quantity: asNumber(row.quantity) ?? 0, availableDate: asString(row.availableDate), storageId: asString(row.storageId) };
      if (target) target.variant.metadata = { ...(target.variant.metadata ?? {}), stock };
      else {
        const product = productByRef.get(material);
        if (product) metadata(product).stock = stock;
      }
    }
  }

  if (options.includePrices !== false) {
    const raw = await makitoFetchJson<Record<string, unknown>>(config, "/price-list/files", { format: "JSON" });
    priceRows = records(raw, ["priceList", "prices", "data.priceList", "data", "items"]);
    sourceGeneratedAt.prices = raw.generatedAt;
    for (const row of priceRows as MakitoPrice[]) {
      const material = asString(row.material);
      if (!material) continue;
      const price = {
        currency: asString(row.currency) ?? "EUR",
        baseQuantity: asNumber(row.baseQuantity),
        scales: asArray(row.scales).map(scale => ({ quantity: asNumber((scale as MakitoPriceScale)?.quantity), amount: asNumber((scale as MakitoPriceScale)?.amount) }))
      };
      const target = variantIndex.get(material);
      if (target) target.variant.metadata = { ...(target.variant.metadata ?? {}), price };
      else {
        const product = productByRef.get(material);
        if (product) metadata(product).price = price;
      }
    }
  }

  if (options.includePrintConfig) {
    const raw = await makitoFetchJson<Record<string, unknown>>(config, "/print-config/files", { format: "JSON", lang: config.lang ?? "es" });
    printConfigRows = records(raw, ["products", "data.products", "data", "items"]);
    sourceGeneratedAt.printConfig = raw.generatedAt;
    for (const row of printConfigRows) {
      const ref = asString(firstValue(row, ["ref", "product", "productRef", "prodReference"]));
      const product = ref ? productByRef.get(ref) : undefined;
      if (product) metadata(product).printConfig = { areas: row.areas, positions: row.positions, techniques: row.techniques };
    }
  }

  if (options.includePrintPrices) {
    const raw = await makitoFetchJson<Record<string, unknown>>(config, "/print-price-list/files", { format: "JSON" });
    printPriceRows = records(raw, ["printPriceList", "data.printPriceList", "data", "items"]);
    sourceGeneratedAt.printPrices = raw.generatedAt;
  }

  return {
    provider: "makito",
    generatedAt: new Date().toISOString(),
    sourceGeneratedAt,
    stats: {
      products: products.length,
      variants: [...variantIndex].length,
      stockRows: stockRows.length,
      priceRows: priceRows.length,
      printConfigProducts: printConfigRows.length,
      printPriceRows: printPriceRows.length
    },
    products: products.map(product => {
      if (options.includePrintPrices) metadata(product).printPriceList = printPriceRows;
      return product;
    })
  };
}
