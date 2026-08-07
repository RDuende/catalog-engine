import { ExperienceSdkError, ExperienceSdkTimeoutError } from "./experience-sdk.errors.js";
import type {
  ConversationResponse,
  CreateImageGenerationTaskInput,
  CreatePaymentIntentInput,
  CreatePresentationInput,
  CreatePurchaseOrderInput,
  ExperienceSdkCredentials,
  ExperienceSdkErrorPayload,
  ExperienceSdkFetch,
  ExperienceSdkOptions,
  ImageGenerationAccepted,
  JourneyExperience,
  PaymentIntent,
  PresentationResult,
  PresentationTemplate,
  PurchaseOrder,
  SmartCatalogContext,
  SmartCatalogProduct,
  SmartCatalogRecommendation,
  TaskResponse,
} from "./experience-sdk.types.js";

const DEFAULT_BASE_URL = "http://localhost:3000/api/v1";
const DEFAULT_TIMEOUT_MS = 30_000;

function trimSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function globalFetch(): ExperienceSdkFetch {
  if (typeof fetch !== "function") throw new Error("No existe una implementación global de fetch.");
  return globalThis.fetch.bind(globalThis) as unknown as ExperienceSdkFetch;
}

export class ExperienceSdkClient {
  private credentials?: ExperienceSdkCredentials;
  private readonly baseUrl: string;
  private readonly fetcher: ExperienceSdkFetch;
  private readonly timeoutMs: number;

  constructor(options: ExperienceSdkOptions = {}) {
    this.baseUrl = trimSlash(options.baseUrl ?? DEFAULT_BASE_URL);
    this.fetcher = options.fetch ?? globalFetch();
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.credentials = options.credentials;
  }

  setCredentials(credentials: ExperienceSdkCredentials | undefined): void {
    this.credentials = credentials;
  }

  getCredentials(): ExperienceSdkCredentials | undefined {
    return this.credentials;
  }

  async getExperience(journeyId: string): Promise<JourneyExperience> {
    return this.request(`/experience/${encodeURIComponent(journeyId)}`);
  }

  async createConversation(message: string, correlationId?: string): Promise<ConversationResponse> {
    const response = await this.request<ConversationResponse>("/mvp/conversations", {
      method: "POST",
      body: { message, ...(correlationId ? { correlationId } : {}) },
    });
    if (response.access) {
      this.credentials = {
        ownerKind: response.access.ownerKind,
        ownerId: response.access.ownerId,
        ...(response.access.accessToken ? { accessToken: response.access.accessToken } : {}),
      };
    }
    return response;
  }

  async continueConversation(sessionId: string, message: string, correlationId?: string): Promise<ConversationResponse> {
    return this.request(`/mvp/conversations/${encodeURIComponent(sessionId)}/messages`, {
      method: "POST",
      body: { message, ...(correlationId ? { correlationId } : {}) },
    });
  }

  async getConversation(sessionId: string): Promise<ConversationResponse> {
    return this.request(`/mvp/conversations/${encodeURIComponent(sessionId)}`);
  }

  async showProposals(sessionId: string, correlationId?: string): Promise<ConversationResponse> {
    return this.request(`/mvp/conversations/${encodeURIComponent(sessionId)}/proposals`, {
      method: "POST",
      body: correlationId ? { correlationId } : {},
    });
  }

  async generateImage(input: CreateImageGenerationTaskInput): Promise<ImageGenerationAccepted> {
    return this.request("/images/generations", { method: "POST", body: input });
  }

  async getTask<T = unknown>(taskId: string): Promise<TaskResponse<T>> {
    return this.request(`/tasks/${encodeURIComponent(taskId)}`);
  }

  async listPresentationTemplates(): Promise<readonly PresentationTemplate[]> {
    const response = await this.request<{ templates: readonly PresentationTemplate[] }>("/presentations/templates");
    return response.templates;
  }

  async createPresentation(input: CreatePresentationInput): Promise<PresentationResult> {
    return this.request("/presentations", { method: "POST", body: input });
  }

  async listProducts(): Promise<readonly SmartCatalogProduct[]> {
    const response = await this.request<{ products: readonly SmartCatalogProduct[] }>("/smart-catalog/products");
    return response.products;
  }

  async recommendProducts(context: SmartCatalogContext & { readonly limit?: number }): Promise<readonly SmartCatalogRecommendation[]> {
    const response = await this.request<{ recommendations: readonly SmartCatalogRecommendation[] }>("/smart-catalog/recommendations", {
      method: "POST",
      body: context,
    });
    return response.recommendations;
  }

  async createOrder(input: CreatePurchaseOrderInput): Promise<PurchaseOrder> {
    const response = await this.request<{ order: PurchaseOrder }>("/purchase/orders", { method: "POST", body: input });
    return response.order;
  }

  async getOrder(orderId: string): Promise<PurchaseOrder> {
    const response = await this.request<{ order: PurchaseOrder }>(`/purchase/orders/${encodeURIComponent(orderId)}`);
    return response.order;
  }

  async confirmOrder(orderId: string): Promise<PurchaseOrder> {
    const response = await this.request<{ order: PurchaseOrder }>(`/purchase/orders/${encodeURIComponent(orderId)}/confirm`, { method: "POST" });
    return response.order;
  }

  async createPaymentIntent(orderId: string, input: CreatePaymentIntentInput = {}): Promise<PaymentIntent> {
    const response = await this.request<{ paymentIntent: PaymentIntent }>(`/purchase/orders/${encodeURIComponent(orderId)}/payment-intents`, {
      method: "POST",
      body: input,
    });
    return response.paymentIntent;
  }

  async confirmPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
    const response = await this.request<{ paymentIntent: PaymentIntent }>(`/purchase/payment-intents/${encodeURIComponent(paymentIntentId)}/confirm`, { method: "POST" });
    return response.paymentIntent;
  }

  private async request<T>(path: string, options: { readonly method?: string; readonly body?: unknown } = {}): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const headers: Record<string, string> = { accept: "application/json" };
      if (options.body !== undefined) headers["content-type"] = "application/json";
      if (this.credentials) {
        headers["x-mvp-owner-type"] = this.credentials.ownerKind;
        headers["x-mvp-owner-id"] = this.credentials.ownerId;
        if (this.credentials.accessToken) headers["x-mvp-access-token"] = this.credentials.accessToken;
      }
      const response = await this.fetcher(`${this.baseUrl}${path}`, {
        method: options.method ?? "GET",
        headers,
        ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
        signal: controller.signal,
      });
      const rawBody = await response.text();
      let payload: unknown = {};
      if (rawBody.trim()) {
        try {
          payload = JSON.parse(rawBody) as unknown;
        } catch {
          payload = { message: rawBody };
        }
      }
      if (!response.ok) {
        const errorPayload = payload && typeof payload === "object" ? payload as ExperienceSdkErrorPayload : undefined;
        throw new ExperienceSdkError(
          response.status,
          errorPayload?.error ?? `HTTP_${response.status}`,
          errorPayload?.message ?? (response.statusText || "Error de API"),
          errorPayload,
        );
      }
      return payload as T;
    } catch (error) {
      if (error instanceof ExperienceSdkError) throw error;
      if (controller.signal.aborted) throw new ExperienceSdkTimeoutError(this.timeoutMs);
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}
