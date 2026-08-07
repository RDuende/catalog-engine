import type {
  ChannelAdapter,
  ChannelProductMappingPort,
  ChannelPublishResult,
  PurchaseContract,
} from "./channel-adapter.types.js";

export interface WooCommerceOrderPayload {
  readonly status: "pending";
  readonly billing?: Readonly<Record<string, string>>;
  readonly shipping?: Readonly<Record<string, string>>;
  readonly line_items: readonly {
    readonly product_id: number;
    readonly variation_id?: number;
    readonly quantity: number;
    readonly meta_data: readonly {
      readonly key: string;
      readonly value: string;
    }[];
  }[];
  readonly meta_data: readonly {
    readonly key: string;
    readonly value: string;
  }[];
}

export interface WooCommerceOrderResponse {
  readonly id: number;
  readonly number?: string;
  readonly status?: string;
  readonly permalink?: string;
}

export interface WooCommerceClient {
  createOrder(
    payload: WooCommerceOrderPayload,
    idempotencyKey: string,
  ): Promise<WooCommerceOrderResponse>;
}

function address(
  input:
    | PurchaseContract["billing"]
    | PurchaseContract["shipping"],
): Readonly<Record<string, string>> | undefined {
  if (!input) return undefined;

  return Object.freeze({
    ...(input.firstName ? { first_name: input.firstName } : {}),
    ...(input.lastName ? { last_name: input.lastName } : {}),
    ...(input.company ? { company: input.company } : {}),
    address_1: input.address1,
    ...(input.address2 ? { address_2: input.address2 } : {}),
    city: input.city,
    ...(input.state ? { state: input.state } : {}),
    postcode: input.postcode,
    country: input.country,
    ...(input.phone ? { phone: input.phone } : {}),
    ...(input.email ? { email: input.email } : {}),
  });
}

function metadata(
  contract: PurchaseContract,
): readonly { readonly key: string; readonly value: string }[] {
  return Object.freeze([
    Object.freeze({
      key: "_recuerdarte_journey_id",
      value: contract.order.journeyId,
    }),
    Object.freeze({
      key: "_recuerdarte_order_id",
      value: contract.order.id,
    }),
    ...Object.entries(contract.metadata).map(([key, value]) =>
      Object.freeze({
        key: `_recuerdarte_${key}`,
        value,
      }),
    ),
  ]);
}

export class WooCommerceChannelAdapter
  implements ChannelAdapter
{
  readonly id = "WOOCOMMERCE" as const;

  constructor(
    private readonly client: WooCommerceClient,
    private readonly mappings: ChannelProductMappingPort,
  ) {}

  async publish(
    contract: PurchaseContract,
    idempotencyKey: string,
  ): Promise<ChannelPublishResult> {
    const lineItems = contract.order.lines.map((line) => {
      const mapping = this.mappings.resolve(
        this.id,
        line.productId,
      );

      if (!mapping) {
        throw new Error(
          `No existe mapeo WooCommerce para el producto ${line.productId}.`,
        );
      }

      const lineMetadata = [
        Object.freeze({
          key: "_recuerdarte_internal_product_id",
          value: line.productId,
        }),
        ...(line.presentationArtifactId
          ? [
              Object.freeze({
                key: "_recuerdarte_presentation_artifact_id",
                value: line.presentationArtifactId,
              }),
            ]
          : []),
        ...("purchaseIntentArtifactId" in line &&
        typeof line.purchaseIntentArtifactId === "string"
          ? [
              Object.freeze({
                key: "_recuerdarte_purchase_intent_artifact_id",
                value: line.purchaseIntentArtifactId,
              }),
            ]
          : []),
        ...("proposalId" in line &&
        typeof line.proposalId === "string"
          ? [
              Object.freeze({
                key: "_recuerdarte_proposal_id",
                value: line.proposalId,
              }),
            ]
          : []),
        ...("workspaceArtifactIds" in line &&
        Array.isArray(line.workspaceArtifactIds)
          ? [
              Object.freeze({
                key: "_recuerdarte_workspace_artifact_ids",
                value: line.workspaceArtifactIds.join(","),
              }),
            ]
          : []),
      ];

      return Object.freeze({
        product_id: mapping.externalProductId,
        ...(mapping.externalVariationId
          ? { variation_id: mapping.externalVariationId }
          : {}),
        quantity: line.quantity,
        meta_data: Object.freeze(lineMetadata),
      });
    });

    const payload: WooCommerceOrderPayload = Object.freeze({
      status: "pending",
      ...(address(contract.billing)
        ? { billing: address(contract.billing) }
        : {}),
      ...(address(contract.shipping)
        ? { shipping: address(contract.shipping) }
        : {}),
      line_items: Object.freeze(lineItems),
      meta_data: metadata(contract),
    });

    const response = await this.client.createOrder(
      payload,
      idempotencyKey,
    );

    return Object.freeze({
      externalOrderId: String(response.id),
      ...(response.number
        ? { externalOrderNumber: response.number }
        : {}),
      ...(response.status
        ? { externalStatus: response.status }
        : {}),
      ...(response.permalink
        ? { externalUrl: response.permalink }
        : {}),
      raw: response,
    });
  }
}

export class HttpWooCommerceClient
  implements WooCommerceClient
{
  readonly #baseUrl: string;
  readonly #authorization: string;

  constructor(input: {
    readonly baseUrl: string;
    readonly consumerKey: string;
    readonly consumerSecret: string;
  }) {
    this.#baseUrl = input.baseUrl.replace(/\/+$/u, "");
    this.#authorization = `Basic ${Buffer.from(
      `${input.consumerKey}:${input.consumerSecret}`,
    ).toString("base64")}`;
  }

  async createOrder(
    payload: WooCommerceOrderPayload,
    idempotencyKey: string,
  ): Promise<WooCommerceOrderResponse> {
    const response = await fetch(
      `${this.#baseUrl}/wp-json/wc/v3/orders`,
      {
        method: "POST",
        headers: {
          authorization: this.#authorization,
          "content-type": "application/json",
          "x-idempotency-key": idempotencyKey,
        },
        body: JSON.stringify(payload),
      },
    );

    const body = (await response.json()) as unknown;

    if (!response.ok) {
      const message =
        body &&
        typeof body === "object" &&
        "message" in body &&
        typeof body.message === "string"
          ? body.message
          : `WooCommerce respondió ${response.status}.`;

      throw new Error(message);
    }

    if (
      !body ||
      typeof body !== "object" ||
      !("id" in body) ||
      typeof body.id !== "number"
    ) {
      throw new Error(
        "WooCommerce devolvió una respuesta de pedido no válida.",
      );
    }

    return body as WooCommerceOrderResponse;
  }
}
