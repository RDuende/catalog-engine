import assert from "node:assert/strict";
import test from "node:test";
import { resolveCatalogImages } from "./image-resolver.js";

test("descarta miniaturas", () => {
  const result = resolveCatalogImages([
    {
      url: "/api/v1/catalog-media/makito/5246/main.jpg",
      providerUrl: "https://apis.makito.es/catalog/assets/15246/principal/5246-W.jpg",
      localPublicUrl: "/api/v1/catalog-media/makito/5246/main.jpg",
      metadata: { isPrimary: true },
    },
    {
      url: "/api/v1/catalog-media/makito/5246/thumb.jpg",
      providerUrl: "https://apis.makito.es/catalog/assets/15246/thumbnail/5246-W.jpg",
    },
  ]);

  assert.equal(result.selected.length, 1);
  assert.equal(result.diagnostics.thumbnailCount, 1);
});

test("conserva variantes reales", () => {
  const result = resolveCatalogImages([
    { url: "/media/pen-red.jpg", providerUrl: "https://example.test/principal/pen-red.jpg" },
    { url: "/media/pen-blue.jpg", providerUrl: "https://example.test/principal/pen-blue.jpg" },
  ]);

  assert.equal(result.selected.length, 2);
});
