import assert from "node:assert/strict";
import test from "node:test";
import { MakitoProviderAdapter } from "./makito-provider.js";
import { clearMakitoTokenCache, getMakitoToken } from "./makito-client.js";

test("Makito normaliza el esquema oficial del catálogo", () => {
  const adapter = new MakitoProviderAdapter();
  const product = adapter.normalize({
    ref: "15246",
    web_reference: "5246",
    name: "Komir",
    description: "<p>Cámara deportiva</p>",
    material: "ABS",
    printcode: "K(4)",
    length: 120,
    height: 230,
    width: 68,
    image: "https://apis.makito.es/catalog/assets/15246/principal/5246-W.jpg",
    categories: [{ name: "Tecnología" }],
    variants: [{ ref: "15246003000", color: "Negro", variant_image: "https://apis.makito.es/catalog/assets/15246/15246003000/principal/5246-003-P.jpg" }]
  }, { baseUrl: "https://apis.makito.es" });

  assert.equal(product?.externalId, "15246");
  assert.equal(product?.sku, "5246");
  assert.equal(product?.depthMm, 120);
  assert.equal(product?.customizable, true);
  assert.deepEqual(product?.categories, ["Tecnología"]);
  assert.equal(product?.variants?.[0]?.sku, "15246003000");
  assert.equal(product?.media?.[0]?.isPrimary, true);
});

test("Makito login envía clientId/clientSecret y conserva el JWT", async () => {
  clearMakitoTokenCache();
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (_input, init) => {
    calls += 1;
    assert.equal(init?.method, "POST");
    assert.deepEqual(JSON.parse(String(init?.body)), { clientId: "client", clientSecret: "secret" });
    return new Response(JSON.stringify({ token: "header.eyJleHAiOjk5OTk5OTk5OTl9.signature" }), { status: 200, headers: { "content-type": "application/json" } });
  };
  try {
    const config = { baseUrl: "https://apis.makito.es", clientId: "client", clientSecret: "secret" };
    assert.equal(await getMakitoToken(config), "header.eyJleHAiOjk5OTk5OTk5OTl9.signature");
    assert.equal(await getMakitoToken(config), "header.eyJleHAiOjk5OTk5OTk5OTl9.signature");
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
    clearMakitoTokenCache();
  }
});
