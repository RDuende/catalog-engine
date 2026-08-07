import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { InMemorySmartCatalogRepository } from "../smart-catalog/in-memory-smart-catalog.repository.js";
import { FilePurchaseOrderRepository } from "./file-purchase-order.repository.js";
import { MockPaymentProvider } from "./mock-payment.provider.js";
import { FilePaymentIntentRepository, InMemoryPaymentIntentRepository } from "./payment-intent.repository.js";
import { PaymentIntentService } from "./payment-intent.service.js";
import { PurchaseExperienceService } from "./purchase-experience.service.js";
import { InMemoryPurchaseOrderRepository } from "./in-memory-purchase-order.repository.js";

function fixture() {
  const orders=new InMemoryPurchaseOrderRepository();
  const purchase=new PurchaseExperienceService(orders,new InMemorySmartCatalogRepository());
  const draft=purchase.create({journeyId:"journey-pay",lines:[{productId:"story-book",quantity:1}]});
  const order=purchase.confirm(draft.id);
  return {orders,purchase,order,payments:new PaymentIntentService(orders,new InMemoryPaymentIntentRepository(),new MockPaymentProvider())};
}

test("crea un intento idempotente con el importe recalculado del pedido",()=>{
  const {order,payments}=fixture();
  const first=payments.create(order.id,"checkout-1");
  const second=payments.create(order.id,"checkout-1");
  assert.equal(first.id,second.id);
  assert.equal(first.amount,order.totals.total);
  assert.equal(first.status,"REQUIRES_ACTION");
  assert.ok(first.clientSecret);
});

test("confirma el pago y marca el pedido como pagado",()=>{
  const {orders,order,payments}=fixture();
  const intent=payments.create(order.id);
  const paid=payments.confirm(intent.id);
  assert.equal(paid.status,"SUCCEEDED");
  assert.equal(orders.getById(order.id)?.status,"PAID");
  assert.equal(orders.getById(order.id)?.paymentIntentId,intent.id);
});

test("persiste pedidos e intentos y los recupera desde nuevas instancias",()=>{
  const directory=mkdtempSync(join(tmpdir(),"catalog-engine-v31-"));
  try {
    const orderRepo=new FilePurchaseOrderRepository(join(directory,"orders"));
    const intentRepo=new FilePaymentIntentRepository(join(directory,"intents"));
    const purchase=new PurchaseExperienceService(orderRepo,new InMemorySmartCatalogRepository());
    const draft=purchase.create({journeyId:"journey-persist",lines:[{productId:"puzzle-120",quantity:1}]});
    const order=purchase.confirm(draft.id);
    const payments=new PaymentIntentService(orderRepo,intentRepo,new MockPaymentProvider());
    const intent=payments.create(order.id,"persist-1");
    assert.equal(new FilePurchaseOrderRepository(join(directory,"orders")).getById(order.id)?.id,order.id);
    assert.equal(new FilePaymentIntentRepository(join(directory,"intents")).getById(intent.id)?.id,intent.id);
  } finally { rmSync(directory,{recursive:true,force:true}); }
});
