import assert from "node:assert/strict";
import test from "node:test";

import {
  extractMakitoImageReferences,
} from "./makito-image-reference-extractor.js";
import {
  MakitoImageManagerService,
} from "./makito-image-manager.service.js";

test("extrae imagen principal, detalles y variantes", () => {
  const references =
    extractMakitoImageReferences(
      {
        externalId: "15246",
        sku: "5246",
        media: [
          {
            url:
              "https://example.com/main.jpg",
            isPrimary: true,
          },
        ],
        metadata: {
          providerRaw: {
            detail_images: [
              "https://example.com/detail.jpg",
            ],
          },
        },
        variants: [
          {
            metadata: {
              variant_image:
                "https://example.com/variant.jpg",
            },
          },
        ],
      },
      0,
    );

  assert.equal(
    references.length,
    3,
  );
  assert.equal(
    references.some(
      (item) =>
        item.kind === "PRIMARY",
    ),
    true,
  );
  assert.equal(
    references.some(
      (item) =>
        item.kind === "DETAIL",
    ),
    true,
  );
  assert.equal(
    references.some(
      (item) =>
        item.kind === "VARIANT",
    ),
    true,
  );
});

test("expone el servicio de sincronización", () => {
  const service =
    new MakitoImageManagerService();

  assert.equal(
    typeof service.sync,
    "function",
  );
});
