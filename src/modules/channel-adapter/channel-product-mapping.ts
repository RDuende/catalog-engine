import type {
  ChannelProductMapping,
  ChannelProductMappingPort,
  SalesChannelId,
} from "./channel-adapter.types.js";

export class StaticChannelProductMapping
  implements ChannelProductMappingPort
{
  readonly #records: readonly ChannelProductMapping[];

  constructor(records: readonly ChannelProductMapping[]) {
    this.#records = Object.freeze([...records]);
  }

  resolve(
    channel: SalesChannelId,
    internalProductId: string,
  ): ChannelProductMapping | undefined {
    if (channel !== "WOOCOMMERCE") {
      return undefined;
    }

    return this.#records.find(
      (item) => item.internalProductId === internalProductId,
    );
  }

  static fromJson(value: string | undefined): StaticChannelProductMapping {
    if (!value?.trim()) {
      return new StaticChannelProductMapping([]);
    }

    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error(
        "WOOCOMMERCE_PRODUCT_MAP debe ser un objeto JSON.",
      );
    }

    const records = Object.entries(
      parsed as Record<string, unknown>,
    ).map(([internalProductId, mapping]) => {
      if (typeof mapping === "number") {
        return Object.freeze({
          internalProductId,
          externalProductId: mapping,
        });
      }

      if (!mapping || typeof mapping !== "object") {
        throw new Error(
          `Mapeo WooCommerce no válido para ${internalProductId}.`,
        );
      }

      const value = mapping as {
        readonly productId?: unknown;
        readonly variationId?: unknown;
      };

      if (
        typeof value.productId !== "number" ||
        !Number.isInteger(value.productId) ||
        value.productId <= 0
      ) {
        throw new Error(
          `productId WooCommerce no válido para ${internalProductId}.`,
        );
      }

      return Object.freeze({
        internalProductId,
        externalProductId: value.productId,
        ...(typeof value.variationId === "number" &&
        Number.isInteger(value.variationId) &&
        value.variationId > 0
          ? { externalVariationId: value.variationId }
          : {}),
      });
    });

    return new StaticChannelProductMapping(records);
  }
}
