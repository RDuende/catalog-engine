import assert from "node:assert/strict";
import test from "node:test";

import {
  ProductBrainStudioRepository,
} from "./product-brain-studio.repository.js";

test("el repositorio expone su contrato", () => {
  const repository =
    new ProductBrainStudioRepository(
      "missing-for-contract-test",
    );

  assert.equal(
    typeof repository.search,
    "function",
  );
  assert.equal(
    typeof repository.findById,
    "function",
  );
  assert.equal(
    typeof repository.invalidate,
    "function",
  );
});
