import assert from "node:assert/strict";
import test from "node:test";
import { InMemorySmartCatalogRepository } from "../smart-catalog/in-memory-smart-catalog.repository.js";
import { InMemoryPurchaseOrderRepository } from "./in-memory-purchase-order.repository.js";
import { PurchaseOrderStateError, PurchaseOrderValidationError } from "./purchase-experience.errors.js";
import { PurchaseExperienceService } from "./purchase-experience.service.js";

function service(): PurchaseExperienceService {
  return new PurchaseExperienceService(new InMemoryPurchaseOrderRepository(), new InMemorySmartCatalogRepository());
}

test("crea un pedido recalculando precios desde el catálogo", () => {
  const purchase = service();
  const order = purchase.create({ journeyId: "journey-gemelas", lines: [
    { productId: "tshirt-kids", quantity: 2, presentationArtifactId: "mockup-1" },
    { productId: "puzzle-120", quantity: 1 },
  ] });
  assert.equal(order.status, "DRAFT");
  assert.equal(order.totals.subtotal, 62);
  assert.equal(order.totals.shipping, 0);
  assert.equal(order.totals.total, 62);
  assert.equal(order.lines[0]?.unitPrice, 19);
});

test("añade gastos de envío por debajo de 50 euros", () => {
  const order = service().create({ journeyId: "journey-1", lines: [{ productId: "puzzle-120", quantity: 1 }] });
  assert.equal(order.totals.shipping, 4.95);
  assert.equal(order.totals.total, 28.95);
});

test("confirma de forma idempotente y bloquea cancelación posterior", () => {
  const purchase = service();
  const draft = purchase.create({ journeyId: "journey-1", lines: [{ productId: "story-book", quantity: 1 }] });
  const confirmed = purchase.confirm(draft.id);
  assert.equal(confirmed.status, "CONFIRMED");
  assert.equal(purchase.confirm(draft.id).id, confirmed.id);
  assert.throws(() => purchase.cancel(draft.id), PurchaseOrderStateError);
});

test("rechaza cantidades inválidas y falta de stock", () => {
  const purchase = service();
  assert.throws(() => purchase.create({ journeyId: "journey-1", lines: [{ productId: "tshirt-kids", quantity: 0 }] }), PurchaseOrderValidationError);
  assert.throws(() => purchase.create({ journeyId: "journey-1", lines: [{ productId: "tshirt-kids", quantity: 999 }] }), PurchaseOrderValidationError);
});

test("lista pedidos por Journey", () => {
  const purchase = service();
  purchase.create({ journeyId: "journey-a", lines: [{ productId: "puzzle-120", quantity: 1 }] });
  purchase.create({ journeyId: "journey-b", lines: [{ productId: "story-book", quantity: 1 }] });
  assert.equal(purchase.listByJourney("journey-a").length, 1);
});
