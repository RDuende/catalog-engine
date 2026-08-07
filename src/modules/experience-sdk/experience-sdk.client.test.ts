import assert from "node:assert/strict";
import test from "node:test";
import { ExperienceSdkClient } from "./experience-sdk.client.js";
import { ExperienceSdkError } from "./experience-sdk.errors.js";
import type { ExperienceSdkFetch } from "./experience-sdk.types.js";

function response(status: number, payload: unknown) {
  const body = JSON.stringify(payload);
  let consumed = false;
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    async text() {
      if (consumed) throw new TypeError("body stream already read");
      consumed = true;
      return body;
    },
  };
}

test("envía las credenciales del propietario al consultar la experiencia", async () => {
  let capturedHeaders: Readonly<Record<string, string>> | undefined;
  const fetcher: ExperienceSdkFetch = async (_url, init) => {
    capturedHeaders = init?.headers;
    return response(200, { journeyId: "journey-1" });
  };
  const client = new ExperienceSdkClient({
    baseUrl: "https://api.example.test/api/v1/",
    credentials: { ownerKind: "GUEST", ownerId: "guest-1", accessToken: "secret" },
    fetch: fetcher,
  });
  const result = await client.getExperience("journey-1");
  assert.equal(result.journeyId, "journey-1");
  assert.equal(capturedHeaders?.["x-mvp-owner-type"], "GUEST");
  assert.equal(capturedHeaders?.["x-mvp-owner-id"], "guest-1");
  assert.equal(capturedHeaders?.["x-mvp-access-token"], "secret");
});

test("adopta automáticamente las credenciales de una conversación invitada", async () => {
  const fetcher: ExperienceSdkFetch = async () => response(201, {
    sessionId: "session-1",
    access: { ownerKind: "GUEST", ownerId: "guest-1", accessToken: "token-1" },
  });
  const client = new ExperienceSdkClient({ fetch: fetcher });
  await client.createConversation("Quiero un regalo");
  assert.deepEqual(client.getCredentials(), { ownerKind: "GUEST", ownerId: "guest-1", accessToken: "token-1" });
});

test("normaliza los errores de API", async () => {
  const fetcher: ExperienceSdkFetch = async () => response(403, { error: "MVP_CONVERSATION_FORBIDDEN", message: "Acceso denegado" });
  const client = new ExperienceSdkClient({ fetch: fetcher });
  await assert.rejects(
    () => client.getExperience("journey-1"),
    (error: unknown) => error instanceof ExperienceSdkError && error.status === 403 && error.code === "MVP_CONVERSATION_FORBIDDEN",
  );
});

test("serializa pedidos e intentos de pago sin aceptar importes externos", async () => {
  const calls: Array<{ url: string; body?: string }> = [];
  const fetcher: ExperienceSdkFetch = async (url, init) => {
    calls.push({ url, ...(init?.body ? { body: init.body } : {}) });
    if (url.endsWith("/purchase/orders")) return response(201, { order: { id: "order-1", status: "DRAFT" } });
    return response(201, { paymentIntent: { id: "pay-1", status: "CREATED" } });
  };
  const client = new ExperienceSdkClient({ fetch: fetcher });
  await client.createOrder({ journeyId: "journey-1", lines: [{ productId: "product-1", quantity: 1 }] });
  await client.createPaymentIntent("order-1", { idempotencyKey: "checkout-1" });
  assert.match(calls[0]?.body ?? "", /product-1/);
  assert.equal(calls[1]?.body, JSON.stringify({ idempotencyKey: "checkout-1" }));
  assert.equal(calls[1]?.body?.includes("amount"), false);
});


test("lee el cuerpo HTTP una sola vez cuando la API devuelve texto no JSON", async () => {
  const fetcher: ExperienceSdkFetch = async () => ({
    ok: false,
    status: 502,
    statusText: "Bad Gateway",
    async text() { return "Proveedor temporalmente no disponible"; },
  });
  const client = new ExperienceSdkClient({ fetch: fetcher });
  await assert.rejects(
    () => client.getExperience("journey-1"),
    (error: unknown) => error instanceof ExperienceSdkError && error.message === "Proveedor temporalmente no disponible",
  );
});

test("solicita propuestas para la misma sesión mediante una acción explícita", async () => {
  const calls: Array<{ url: string; method?: string; body?: string }> = [];
  const fetcher: ExperienceSdkFetch = async (url, init) => {
    calls.push({ url, method: init?.method, body: init?.body });
    return response(200, { sessionId: "session-1", actions: [] });
  };
  const client = new ExperienceSdkClient({ baseUrl: "https://api.example.test/api/v1", fetch: fetcher });
  await client.showProposals("session-1");
  assert.equal(calls[0]?.url, "https://api.example.test/api/v1/mvp/conversations/session-1/proposals");
  assert.equal(calls[0]?.method, "POST");
  assert.equal(calls[0]?.body, JSON.stringify({}));
});
