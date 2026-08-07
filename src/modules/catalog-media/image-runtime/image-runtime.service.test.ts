import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveRuntimeProductImages,
  withResolvedRuntimeImages,
} from "./image-runtime.service.js";
import {
  resolveComposerProposalImages,
} from "./composer-image.adapter.js";

test("el runtime elimina la miniatura de una ficha pública", () => {
  const result =
    resolveRuntimeProductImages({
      productId: "5246",
      media: [
        {
          url:
            "/api/v1/catalog-media/makito/5246/main.jpg",
          metadata: {
            providerUrl:
              "https://apis.makito.es/catalog/assets/15246/principal/5246-W.jpg",
            localPublicUrl:
              "/api/v1/catalog-media/makito/5246/main.jpg",
            isPrimary: true,
          },
        },
        {
          url:
            "/api/v1/catalog-media/makito/5246/thumb.jpg",
          metadata: {
            providerUrl:
              "https://apis.makito.es/catalog/assets/15246/thumbnail/5246-W.jpg",
          },
        },
      ],
    });

  assert.equal(
    result.images.length,
    1,
  );
  assert.equal(
    result.imageUrl,
    "/api/v1/catalog-media/makito/5246/main.jpg",
  );
});

test("Smart Catalog conserva el contrato y añade resolución", () => {
  const product =
    withResolvedRuntimeImages({
      id: "p1",
      name: "Producto",
      imageUrl:
        "/media/product-main.jpg",
      images: [
        "/media/product-main.jpg",
        "/media/product-thumbnail.jpg",
      ],
    });

  assert.equal(
    product.name,
    "Producto",
  );
  assert.equal(
    product.images.length,
    1,
  );
  assert.equal(
    product.imageResolution
      .diagnostics
      .thumbnailCount,
    1,
  );
});

test("Composer usa como hero la primera imagen válida", () => {
  const proposal =
    resolveComposerProposalImages({
      id: "proposal-1",
      items: [
        {
          productId: "p1",
          imageUrl:
            "/media/hero-main.jpg",
        },
        {
          productId: "p2",
          images: [
            "/media/complement-main.jpg",
            "/media/complement-thumbnail.jpg",
          ],
        },
      ],
    });

  assert.equal(
    proposal.imageUrl,
    "/media/hero-main.jpg",
  );
  assert.equal(
    proposal.images.length,
    2,
  );
});
