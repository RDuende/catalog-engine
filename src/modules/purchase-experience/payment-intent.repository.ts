import { mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import type { PaymentIntent, PaymentIntentRepository } from "./purchase-experience.types.js";

function safeId(value: string, label: string): string {
  if (!/^[A-Za-z0-9._:-]{1,200}$/.test(value)) throw new Error(`${label} contiene caracteres no permitidos.`);
  return value;
}
function freezeIntent(intent: PaymentIntent): PaymentIntent { return Object.freeze({ ...intent }); }

export class InMemoryPaymentIntentRepository implements PaymentIntentRepository {
  private readonly intents = new Map<string, PaymentIntent>();
  save(intent: PaymentIntent): PaymentIntent { const frozen=freezeIntent(intent); this.intents.set(intent.id,frozen); return frozen; }
  getById(id: string): PaymentIntent | undefined { return this.intents.get(id); }
  getByIdempotencyKey(key: string): PaymentIntent | undefined { return [...this.intents.values()].find((intent) => intent.idempotencyKey === key); }
  listByOrder(orderId: string): readonly PaymentIntent[] { return [...this.intents.values()].filter((intent) => intent.orderId === orderId).sort((a,b) => b.createdAt.localeCompare(a.createdAt)); }
}

export class FilePaymentIntentRepository implements PaymentIntentRepository {
  readonly directory: string;
  constructor(directory = ".data/purchase/payment-intents") { this.directory=resolve(directory); mkdirSync(this.directory,{recursive:true}); }
  save(intent: PaymentIntent): PaymentIntent {
    const frozen=freezeIntent(intent); const target=this.pathFor(intent.id); const temporary=`${target}.${process.pid}.${randomUUID()}.tmp`;
    writeFileSync(temporary,`${JSON.stringify(frozen,null,2)}\n`,"utf8"); renameSync(temporary,target); return frozen;
  }
  getById(id: string): PaymentIntent | undefined { try { return this.parse(JSON.parse(readFileSync(this.pathFor(id),"utf8")),id); } catch(error){ if((error as NodeJS.ErrnoException).code==="ENOENT") return undefined; throw error; } }
  getByIdempotencyKey(key: string): PaymentIntent | undefined { safeId(key,"idempotencyKey"); return this.all().find((intent)=>intent.idempotencyKey===key); }
  listByOrder(orderId: string): readonly PaymentIntent[] { safeId(orderId,"orderId"); return this.all().filter((intent)=>intent.orderId===orderId).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)); }
  private all(): PaymentIntent[] { return readdirSync(this.directory,{withFileTypes:true}).filter((entry)=>entry.isFile()&&entry.name.endsWith(".json")).map((entry)=>this.getById(entry.name.slice(0,-5))).filter((value): value is PaymentIntent=>Boolean(value)); }
  private pathFor(id:string):string { return join(this.directory,`${safeId(id,"paymentIntentId")}.json`); }
  private parse(value:unknown,expectedId:string):PaymentIntent { if(!value||typeof value!=="object") throw new Error(`El intento ${expectedId} no contiene un objeto válido.`); const intent=value as Partial<PaymentIntent>; if(intent.id!==expectedId||typeof intent.orderId!=="string"||typeof intent.provider!=="string"||typeof intent.providerIntentId!=="string"||typeof intent.status!=="string"||typeof intent.amount!=="number"||typeof intent.currency!=="string"||typeof intent.idempotencyKey!=="string"||typeof intent.createdAt!=="string"||typeof intent.updatedAt!=="string") throw new Error(`El intento ${expectedId} no cumple el contrato V3.1.`); return freezeIntent(intent as PaymentIntent); }
}

export function createDefaultPaymentIntentRepository(): PaymentIntentRepository {
  return process.env.PURCHASE_STORAGE?.trim().toLowerCase() === "memory"
    ? new InMemoryPaymentIntentRepository()
    : new FilePaymentIntentRepository(process.env.PAYMENT_INTENT_STORAGE_DIR ?? ".data/purchase/payment-intents");
}
