import { randomBytes, randomUUID } from "node:crypto";
import type { CreateProviderPaymentIntentInput, PaymentProvider, ProviderPaymentIntent } from "./purchase-experience.types.js";

export class MockPaymentProvider implements PaymentProvider {
  readonly id = "mock";
  private readonly intents = new Map<string, ProviderPaymentIntent>();

  createIntent(_input: CreateProviderPaymentIntentInput): ProviderPaymentIntent {
    const providerIntentId = `mock_pi_${randomUUID()}`;
    const intent: ProviderPaymentIntent = Object.freeze({
      providerIntentId,
      status: "REQUIRES_ACTION",
      clientSecret: `mock_secret_${randomBytes(24).toString("base64url")}`,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    });
    this.intents.set(providerIntentId, intent);
    return intent;
  }

  confirmIntent(providerIntentId: string): ProviderPaymentIntent {
    const current = this.require(providerIntentId);
    if (current.status === "SUCCEEDED") return current;
    const updated: ProviderPaymentIntent = Object.freeze({ ...current, status: "SUCCEEDED" });
    this.intents.set(providerIntentId, updated);
    return updated;
  }

  cancelIntent(providerIntentId: string): ProviderPaymentIntent {
    const current = this.require(providerIntentId);
    if (current.status === "CANCELLED") return current;
    const updated: ProviderPaymentIntent = Object.freeze({ ...current, status: "CANCELLED" });
    this.intents.set(providerIntentId, updated);
    return updated;
  }

  private require(id: string): ProviderPaymentIntent {
    const intent = this.intents.get(id);
    if (intent) return intent;
    // El proveedor mock es deliberadamente recuperable tras reinicios: el estado
    // canónico vive en PaymentIntentRepository, no en esta memoria temporal.
    const recovered: ProviderPaymentIntent = Object.freeze({ providerIntentId: id, status: "REQUIRES_ACTION" });
    this.intents.set(id, recovered);
    return recovered;
  }
}

export function createPaymentProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER?.trim().toLowerCase() ?? "mock";
  if (provider === "mock") return new MockPaymentProvider();
  throw new Error(`PAYMENT_PROVIDER=${provider} todavía no está implementado.`);
}
