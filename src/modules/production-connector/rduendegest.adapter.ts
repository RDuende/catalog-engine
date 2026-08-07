import type {
  ProductionAdapter,
  ProductionDispatchResult,
  ProductionPackage,
} from "./production-connector.types.js";

export interface RDuendeGestJobResponse {
  readonly id: string | number;
  readonly number?: string;
  readonly status?: string;
  readonly url?: string;
}

export interface RDuendeGestClient {
  createProductionJob(
    productionPackage: ProductionPackage,
    idempotencyKey: string,
  ): Promise<RDuendeGestJobResponse>;
}

export class RDuendeGestProductionAdapter
  implements ProductionAdapter
{
  readonly id = "RDUENDEGEST" as const;

  constructor(
    private readonly client: RDuendeGestClient,
  ) {}

  async dispatch(
    productionPackage: ProductionPackage,
    idempotencyKey: string,
  ): Promise<ProductionDispatchResult> {
    const response =
      await this.client.createProductionJob(
        productionPackage,
        idempotencyKey,
      );

    return Object.freeze({
      externalJobId: String(response.id),
      ...(response.number
        ? { externalJobNumber: response.number }
        : {}),
      ...(response.status
        ? { externalStatus: response.status }
        : {}),
      ...(response.url
        ? { externalUrl: response.url }
        : {}),
      raw: response,
    });
  }
}

export class HttpRDuendeGestClient
  implements RDuendeGestClient
{
  readonly #baseUrl: string;
  readonly #token: string;

  constructor(input: {
    readonly baseUrl: string;
    readonly token: string;
  }) {
    this.#baseUrl = input.baseUrl.replace(/\/+$/u, "");
    this.#token = input.token;
  }

  async createProductionJob(
    productionPackage: ProductionPackage,
    idempotencyKey: string,
  ): Promise<RDuendeGestJobResponse> {
    const response = await fetch(
      `${this.#baseUrl}/api/v1/production/jobs`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.#token}`,
          "content-type": "application/json",
          "x-idempotency-key": idempotencyKey,
        },
        body: JSON.stringify(productionPackage),
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
          : `RDuendeGest respondió ${response.status}.`;

      throw new Error(message);
    }

    if (
      !body ||
      typeof body !== "object" ||
      !("id" in body) ||
      (typeof body.id !== "string" &&
        typeof body.id !== "number")
    ) {
      throw new Error(
        "RDuendeGest devolvió una respuesta de trabajo no válida.",
      );
    }

    return body as RDuendeGestJobResponse;
  }
}
