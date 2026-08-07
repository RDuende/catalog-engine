import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { CommercialOperationsService } from "./commercial-operations.service.js";

test("calcula margen, producción y envío", async () => {
  const dir = await mkdtemp(join(tmpdir(), "commercial-operations-"));
  try {
    const service = new CommercialOperationsService(join(dir, "rules.json"));
    const result = await service.simulate({ productCost: 10, quantity: 2, weightKg: 1 });
    assert.equal(result.unitPrice, 13.5);
    assert.equal(result.productionDays, 6);
    assert.ok(result.total > result.subtotal);
    assert.ok(result.estimatedDelivery.to >= result.estimatedDelivery.from);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
