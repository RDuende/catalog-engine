import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type {
  CommercialOperationsData,
  CommercialOperationsSettings,
  MarginRule,
  ProductionRule,
  QuoteSimulationInput,
  QuoteSimulationResult,
  ShippingMethod,
  ShippingZone,
} from "./commercial-operations.types.js";

const DEFAULT_PATH = process.env.COMMERCIAL_OPERATIONS_FILE ?? ".data/commercial-operations.json";

function now(): string { return new Date().toISOString(); }
function round(value: number): number { return Math.round(value * 100) / 100; }

function createDefaults(): CommercialOperationsData {
  const timestamp = now();
  return {
    version: 1,
    settings: {
      currency: "EUR",
      taxPercent: 21,
      pricesIncludeTax: false,
      defaultWeightKg: 0.5,
      packagingCost: 1.5,
      paymentFeePercent: 0,
      minimumOrderAmount: 0,
      safetyProductionDays: 1,
      cutOffHour: 14,
      updatedAt: timestamp,
    },
    margins: [{
      id: randomUUID(), name: "Margen general", scope: "GLOBAL", mode: "PERCENT_ON_COST",
      value: 35, minimumMarginPercent: 20, minimumMarginAmount: 3, active: true, priority: 100,
      createdAt: timestamp, updatedAt: timestamp,
    }],
    production: [{
      id: randomUUID(), name: "Producción general", scope: "GLOBAL", preparationDays: 1,
      productionDays: 3, qualityControlDays: 1, extraDays: 0, businessDaysOnly: true,
      active: true, priority: 100, createdAt: timestamp, updatedAt: timestamp,
    }],
    shippingZones: [{ id: "spain-peninsula", name: "España peninsular", countries: ["ES"], postalCodePrefixes: [], active: true }],
    shippingMethods: [{
      id: randomUUID(), name: "Envío estándar", carrier: "Pendiente de configurar", zoneId: "spain-peninsula",
      mode: "FLAT", basePrice: 5.95, pricePerKg: 0, freeFromOrderValue: 60,
      minDeliveryDays: 1, maxDeliveryDays: 3, trackingAvailable: true, active: true, priority: 100,
    }],
  };
}

function scopeScore(scope: string, value: string | undefined, input: QuoteSimulationInput): number {
  if (scope === "PRODUCT" && value && value === input.productId) return 500;
  if (scope === "TECHNIQUE" && value && value === input.technique) return 400;
  if (scope === "CATEGORY" && value && value === input.category) return 300;
  if (scope === "PROVIDER" && value && value === input.provider) return 200;
  if (scope === "GLOBAL") return 100;
  return -1;
}

function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let remaining = Math.max(0, Math.ceil(days));
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return result;
}

export class CommercialOperationsService {
  constructor(private readonly filePath = DEFAULT_PATH) {}

  private async load(): Promise<CommercialOperationsData> {
    try { return JSON.parse(await readFile(this.filePath, "utf8")) as CommercialOperationsData; }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      const defaults = createDefaults(); await this.save(defaults); return defaults;
    }
  }

  private async save(data: CommercialOperationsData): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    const temp = `${this.filePath}.tmp`;
    await writeFile(temp, JSON.stringify(data, null, 2), "utf8");
    await rename(temp, this.filePath);
  }

  async getAll(): Promise<CommercialOperationsData> { return this.load(); }

  async updateSettings(patch: Partial<CommercialOperationsSettings>): Promise<CommercialOperationsData> {
    const current = await this.load();
    const next = { ...current, version: current.version + 1, settings: { ...current.settings, ...patch, updatedAt: now() } };
    await this.save(next); return next;
  }

  async upsertMargin(input: Partial<MarginRule> & Pick<MarginRule, "name" | "scope" | "mode" | "value">): Promise<CommercialOperationsData> {
    const current = await this.load(); const timestamp = now();
    const existing = input.id ? current.margins.find((item) => item.id === input.id) : undefined;
    const record: MarginRule = {
      id: existing?.id ?? randomUUID(), name: input.name, scope: input.scope, scopeValue: input.scopeValue,
      mode: input.mode, value: input.value, minimumMarginPercent: input.minimumMarginPercent ?? existing?.minimumMarginPercent ?? 0,
      minimumMarginAmount: input.minimumMarginAmount ?? existing?.minimumMarginAmount ?? 0,
      active: input.active ?? existing?.active ?? true, priority: input.priority ?? existing?.priority ?? 100,
      createdAt: existing?.createdAt ?? timestamp, updatedAt: timestamp,
    };
    const margins = existing ? current.margins.map((item) => item.id === record.id ? record : item) : [...current.margins, record];
    const next = { ...current, version: current.version + 1, margins }; await this.save(next); return next;
  }

  async removeMargin(id: string): Promise<CommercialOperationsData> { const current = await this.load(); const next = { ...current, version: current.version + 1, margins: current.margins.filter((item) => item.id !== id) }; await this.save(next); return next; }

  async upsertProduction(input: Partial<ProductionRule> & Pick<ProductionRule, "name" | "scope" | "productionDays">): Promise<CommercialOperationsData> {
    const current = await this.load(); const timestamp = now(); const existing = input.id ? current.production.find((item) => item.id === input.id) : undefined;
    const record: ProductionRule = {
      id: existing?.id ?? randomUUID(), name: input.name, scope: input.scope, scopeValue: input.scopeValue,
      preparationDays: input.preparationDays ?? existing?.preparationDays ?? 0, productionDays: input.productionDays,
      qualityControlDays: input.qualityControlDays ?? existing?.qualityControlDays ?? 0, extraDays: input.extraDays ?? existing?.extraDays ?? 0,
      businessDaysOnly: input.businessDaysOnly ?? existing?.businessDaysOnly ?? true, active: input.active ?? existing?.active ?? true,
      priority: input.priority ?? existing?.priority ?? 100, createdAt: existing?.createdAt ?? timestamp, updatedAt: timestamp,
    };
    const production = existing ? current.production.map((item) => item.id === record.id ? record : item) : [...current.production, record];
    const next = { ...current, version: current.version + 1, production }; await this.save(next); return next;
  }

  async removeProduction(id: string): Promise<CommercialOperationsData> { const current = await this.load(); const next = { ...current, version: current.version + 1, production: current.production.filter((item) => item.id !== id) }; await this.save(next); return next; }

  async upsertZone(input: ShippingZone): Promise<CommercialOperationsData> { const current = await this.load(); const exists = current.shippingZones.some((item) => item.id === input.id); const shippingZones = exists ? current.shippingZones.map((item) => item.id === input.id ? input : item) : [...current.shippingZones, input]; const next = { ...current, version: current.version + 1, shippingZones }; await this.save(next); return next; }
  async removeZone(id: string): Promise<CommercialOperationsData> { const current = await this.load(); const next = { ...current, version: current.version + 1, shippingZones: current.shippingZones.filter((item) => item.id !== id), shippingMethods: current.shippingMethods.filter((item) => item.zoneId !== id) }; await this.save(next); return next; }

  async upsertShipping(input: Partial<ShippingMethod> & Pick<ShippingMethod, "name" | "carrier" | "zoneId" | "mode" | "basePrice" | "minDeliveryDays" | "maxDeliveryDays">): Promise<CommercialOperationsData> {
    const current = await this.load(); const existing = input.id ? current.shippingMethods.find((item) => item.id === input.id) : undefined;
    const record: ShippingMethod = { id: existing?.id ?? randomUUID(), name: input.name, carrier: input.carrier, serviceCode: input.serviceCode, zoneId: input.zoneId, mode: input.mode, basePrice: input.basePrice, pricePerKg: input.pricePerKg ?? existing?.pricePerKg ?? 0, freeFromOrderValue: input.freeFromOrderValue, minDeliveryDays: input.minDeliveryDays, maxDeliveryDays: input.maxDeliveryDays, trackingAvailable: input.trackingAvailable ?? existing?.trackingAvailable ?? true, active: input.active ?? existing?.active ?? true, priority: input.priority ?? existing?.priority ?? 100 };
    const shippingMethods = existing ? current.shippingMethods.map((item) => item.id === record.id ? record : item) : [...current.shippingMethods, record];
    const next = { ...current, version: current.version + 1, shippingMethods }; await this.save(next); return next;
  }
  async removeShipping(id: string): Promise<CommercialOperationsData> { const current = await this.load(); const next = { ...current, version: current.version + 1, shippingMethods: current.shippingMethods.filter((item) => item.id !== id) }; await this.save(next); return next; }

  async simulate(input: QuoteSimulationInput): Promise<QuoteSimulationResult> {
    const data = await this.load(); const quantity = Math.max(1, input.quantity ?? 1); const unitCost = Math.max(0, input.productCost);
    const marginRule = [...data.margins].filter((item) => item.active).map((item) => ({ item, score: scopeScore(item.scope, item.scopeValue, input) })).filter((entry) => entry.score >= 0).sort((a,b) => b.score - a.score || a.item.priority - b.item.priority)[0]?.item;
    let unitPrice = input.productPrice ?? unitCost;
    if (input.productPrice === undefined && marginRule) {
      if (marginRule.mode === "PERCENT_ON_COST") unitPrice = unitCost * (1 + marginRule.value / 100);
      else if (marginRule.mode === "PERCENT_ON_PRICE") unitPrice = marginRule.value >= 100 ? unitCost : unitCost / (1 - marginRule.value / 100);
      else unitPrice = unitCost + marginRule.value;
      unitPrice = Math.max(unitPrice, unitCost + marginRule.minimumMarginAmount);
      if (unitPrice > 0 && ((unitPrice-unitCost)/unitPrice)*100 < marginRule.minimumMarginPercent) unitPrice = unitCost / (1 - marginRule.minimumMarginPercent / 100);
    }
    unitPrice = round(unitPrice);
    const subtotal = round(unitPrice * quantity);
    const productionRule = [...data.production].filter((item) => item.active).map((item) => ({ item, score: scopeScore(item.scope, item.scopeValue, input) })).filter((entry) => entry.score >= 0).sort((a,b) => b.score - a.score || a.item.priority - b.item.priority)[0]?.item;
    const productionDays = (productionRule?.preparationDays ?? 0) + (productionRule?.productionDays ?? 0) + (productionRule?.qualityControlDays ?? 0) + (productionRule?.extraDays ?? 0) + data.settings.safetyProductionDays;
    const method = input.shippingMethodId ? data.shippingMethods.find((item) => item.id === input.shippingMethodId && item.active) : data.shippingMethods.filter((item) => item.active).sort((a,b)=>a.priority-b.priority)[0];
    const weight = input.weightKg ?? data.settings.defaultWeightKg;
    let shippingCost = method?.basePrice ?? 0;
    if (method?.mode === "BY_WEIGHT") shippingCost += weight * quantity * method.pricePerKg;
    if (method?.freeFromOrderValue !== undefined && subtotal >= method.freeFromOrderValue) shippingCost = 0;
    const packagingCost = data.settings.packagingCost;
    const paymentFee = round(subtotal * data.settings.paymentFeePercent / 100);
    const net = subtotal + packagingCost + paymentFee + shippingCost;
    const taxAmount = data.settings.pricesIncludeTax ? round(net - net / (1 + data.settings.taxPercent / 100)) : round(net * data.settings.taxPercent / 100);
    const total = round(data.settings.pricesIncludeTax ? net : net + taxAmount);
    const totalCost = unitCost * quantity + packagingCost + paymentFee;
    const marginAmount = round(subtotal - totalCost);
    const start = input.startDate ? new Date(input.startDate) : new Date();
    const ready = addBusinessDays(start, productionDays);
    const from = addBusinessDays(ready, method?.minDeliveryDays ?? 0);
    const to = addBusinessDays(ready, method?.maxDeliveryDays ?? 0);
    const warnings: string[] = [];
    if (!marginRule) warnings.push("No existe una regla de margen aplicable.");
    if (!productionRule) warnings.push("No existe una regla de producción aplicable.");
    if (!method) warnings.push("No existe un método de envío activo.");
    if (subtotal < data.settings.minimumOrderAmount) warnings.push(`El pedido no alcanza el mínimo de ${data.settings.minimumOrderAmount} ${data.settings.currency}.`);
    return {
      currency: data.settings.currency, quantity, unitCost: round(unitCost), unitPrice, subtotal, packagingCost: round(packagingCost), paymentFee, shippingCost: round(shippingCost), taxAmount, total,
      marginAmount, marginPercentOnPrice: subtotal > 0 ? round(marginAmount / subtotal * 100) : 0, productionDays,
      shippingDays: { min: method?.minDeliveryDays ?? 0, max: method?.maxDeliveryDays ?? 0 }, estimatedDelivery: { from: from.toISOString(), to: to.toISOString() },
      appliedRules: [marginRule?.name, productionRule?.name, method?.name].filter((item): item is string => Boolean(item)), warnings,
    };
  }
}
