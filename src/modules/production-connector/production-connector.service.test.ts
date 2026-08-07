import assert from "node:assert/strict";
import test from "node:test";

import {
  InMemoryPurchaseOrderRepository,
  PurchaseExperienceService,
} from "../purchase-experience/index.js";
import {
  InMemorySmartCatalogRepository,
} from "../smart-catalog/index.js";
import {
  InMemoryProductionDispatchRepository,
} from "./production-dispatch.repository.js";
import {
  ProductionConnectorService,
} from "./production-connector.service.js";

function fixture() {
  const catalog = new InMemorySmartCatalogRepository([
    {
      id: "mug",
      sku: "MUG-1",
      name: "Taza",
      category: "DRINKWARE",
      price: 15,
      cost: 5,
      currency: "EUR",
      stock: 10,
      productionDays: 2,
      tags: [],
      emotionalGoals: [],
      visualStyles: [],
      presentationTemplateIds: [],
      active: true,
    },
  ]);

  const purchases = new PurchaseExperienceService(
    new InMemoryPurchaseOrderRepository(),
    catalog,
  );

  let calls = 0;
  const service = new ProductionConnectorService(
    purchases,
    new InMemoryProductionDispatchRepository(),
    {
      id: "RDUENDEGEST",
      async dispatch(productionPackage) {
        calls += 1;
        return {
          externalJobId: "job-501",
          externalStatus: "READY",
          raw: productionPackage,
        };
      },
    },
  );

  return {
    purchases,
    service,
    calls: () => calls,
  };
}

test("envía un pedido pagado a RDuendeGest", async () => {
  const f = fixture();

  const draft = f.purchases.create({
    journeyId: "journey-1",
    lines: [{ productId: "mug", quantity: 1 }],
  });
  const confirmed = f.purchases.confirm(draft.id);

  // El repositorio de pruebas no expone un proveedor real;
  // simulamos el estado pagado conservando el contrato.
  const paid = Object.freeze({
    ...confirmed,
    status: "PAID" as const,
    updatedAt: "2026-08-04T21:00:00.000Z",
    paidAt: "2026-08-04T21:00:00.000Z",
  });

  (
    f.purchases as unknown as {
      orders?: {
        save(order: typeof paid): typeof paid;
      };
    }
  );

  const repository = (
    f.purchases as unknown as {
      orders?: {
        save(order: typeof paid): typeof paid;
      };
    }
  ).orders;

  if (!repository) {
    // La implementación mantiene el repositorio privado.
    // Creamos una fixture dedicada con pedido pagado.
    const paidRepository = new InMemoryPurchaseOrderRepository();
    paidRepository.save(paid);
    const service = new ProductionConnectorService(
      new PurchaseExperienceService(
        paidRepository,
        new InMemorySmartCatalogRepository([]),
      ),
      new InMemoryProductionDispatchRepository(),
      {
        id: "RDUENDEGEST",
        async dispatch() {
          return { externalJobId: "job-501" };
        },
      },
    );

    const dispatch = await service.dispatch(paid.id);
    assert.equal(dispatch.status, "DISPATCHED");
    assert.equal(dispatch.externalJobId, "job-501");
    return;
  }

  repository.save(paid);
  const dispatch = await f.service.dispatch(paid.id);
  assert.equal(dispatch.status, "DISPATCHED");
});

test("repetir el envío es idempotente", async () => {
  const catalog = new InMemorySmartCatalogRepository([]);
  const orders = new InMemoryPurchaseOrderRepository();
  const paid = {
    id: "paid-order",
    journeyId: "journey-2",
    status: "PAID" as const,
    lines: [],
    totals: {
      subtotal: 0,
      shipping: 0,
      tax: 0,
      total: 0,
      currency: "EUR",
    },
    createdAt: "2026-08-04T20:00:00.000Z",
    updatedAt: "2026-08-04T21:00:00.000Z",
    paidAt: "2026-08-04T21:00:00.000Z",
  };
  orders.save(paid);

  let calls = 0;
  const service = new ProductionConnectorService(
    new PurchaseExperienceService(orders, catalog),
    new InMemoryProductionDispatchRepository(),
    {
      id: "RDUENDEGEST",
      async dispatch() {
        calls += 1;
        return { externalJobId: "job-502" };
      },
    },
  );

  const first = await service.dispatch(
    paid.id,
    { idempotencyKey: "fixed" },
  );
  const second = await service.dispatch(
    paid.id,
    { idempotencyKey: "fixed" },
  );

  assert.equal(first.id, second.id);
  assert.equal(calls, 1);
});
