import { mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import type { PurchaseOrder, PurchaseOrderRepository } from "./purchase-experience.types.js";
import { InMemoryPurchaseOrderRepository } from "./in-memory-purchase-order.repository.js";

function safeId(value: string, label: string): string {
  if (!/^[A-Za-z0-9._-]{1,160}$/.test(value)) throw new Error(`${label} contiene caracteres no permitidos.`);
  return value;
}

function freezeOrder(order: PurchaseOrder): PurchaseOrder {
  return Object.freeze({
    ...order,
    lines: Object.freeze(order.lines.map((line) => Object.freeze({ ...line }))),
    totals: Object.freeze({ ...order.totals }),
  });
}

export class FilePurchaseOrderRepository implements PurchaseOrderRepository {
  readonly directory: string;
  constructor(directory = ".data/purchase/orders") {
    this.directory = resolve(directory);
    mkdirSync(this.directory, { recursive: true });
  }

  save(order: PurchaseOrder): PurchaseOrder {
    const frozen = freezeOrder(order);
    const target = this.pathFor(order.id);
    const temporary = `${target}.${process.pid}.${randomUUID()}.tmp`;
    writeFileSync(temporary, `${JSON.stringify(frozen, null, 2)}\n`, "utf8");
    renameSync(temporary, target);
    return frozen;
  }

  getById(id: string): PurchaseOrder | undefined {
    try {
      return this.parse(JSON.parse(readFileSync(this.pathFor(id), "utf8")), id);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
      throw error;
    }
  }

  listByJourney(journeyId: string): readonly PurchaseOrder[] {
    safeId(journeyId, "journeyId");
    return readdirSync(this.directory, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => this.getById(entry.name.slice(0, -5)))
      .filter((order): order is PurchaseOrder => order?.journeyId === journeyId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  private pathFor(id: string): string { return join(this.directory, `${safeId(id, "orderId")}.json`); }
  private parse(value: unknown, expectedId: string): PurchaseOrder {
    if (!value || typeof value !== "object") throw new Error(`El pedido ${expectedId} no contiene un objeto válido.`);
    const order = value as Partial<PurchaseOrder>;
    if (order.id !== expectedId || typeof order.journeyId !== "string" || !Array.isArray(order.lines) || !order.totals || typeof order.status !== "string" || typeof order.createdAt !== "string" || typeof order.updatedAt !== "string") {
      throw new Error(`El pedido ${expectedId} no cumple el contrato V3.1.`);
    }
    return freezeOrder(order as PurchaseOrder);
  }
}

export function createDefaultPurchaseOrderRepository(): PurchaseOrderRepository {
  return process.env.PURCHASE_STORAGE?.trim().toLowerCase() === "memory"
    ? new InMemoryPurchaseOrderRepository()
    : new FilePurchaseOrderRepository(process.env.PURCHASE_ORDER_STORAGE_DIR ?? ".data/purchase/orders");
}
