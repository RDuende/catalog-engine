import assert from "node:assert/strict";
import test from "node:test";

import {
  ProductBrainStudioImageService,
} from "./product-brain-studio-image.service.js";

test("expone el gateway de imágenes", () => {
  const service =
    new ProductBrainStudioImageService();

  assert.equal(
    typeof service.get,
    "function",
  );
});
