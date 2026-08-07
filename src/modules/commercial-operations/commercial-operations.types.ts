export type MarginMode = "PERCENT_ON_COST" | "PERCENT_ON_PRICE" | "FIXED";
export type ShippingCalculationMode = "FLAT" | "BY_WEIGHT" | "BY_ORDER_VALUE" | "PROVIDER";

export interface MarginRule {
  readonly id: string;
  readonly name: string;
  readonly scope: "GLOBAL" | "PROVIDER" | "CATEGORY" | "PRODUCT";
  readonly scopeValue?: string;
  readonly mode: MarginMode;
  readonly value: number;
  readonly minimumMarginPercent: number;
  readonly minimumMarginAmount: number;
  readonly active: boolean;
  readonly priority: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ProductionRule {
  readonly id: string;
  readonly name: string;
  readonly scope: "GLOBAL" | "PROVIDER" | "CATEGORY" | "TECHNIQUE" | "PRODUCT";
  readonly scopeValue?: string;
  readonly preparationDays: number;
  readonly productionDays: number;
  readonly qualityControlDays: number;
  readonly extraDays: number;
  readonly businessDaysOnly: boolean;
  readonly active: boolean;
  readonly priority: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ShippingZone {
  readonly id: string;
  readonly name: string;
  readonly countries: readonly string[];
  readonly postalCodePrefixes: readonly string[];
  readonly active: boolean;
}

export interface ShippingMethod {
  readonly id: string;
  readonly name: string;
  readonly carrier: string;
  readonly serviceCode?: string;
  readonly zoneId: string;
  readonly mode: ShippingCalculationMode;
  readonly basePrice: number;
  readonly pricePerKg: number;
  readonly freeFromOrderValue?: number;
  readonly minDeliveryDays: number;
  readonly maxDeliveryDays: number;
  readonly trackingAvailable: boolean;
  readonly active: boolean;
  readonly priority: number;
}

export interface CommercialOperationsSettings {
  readonly currency: string;
  readonly taxPercent: number;
  readonly pricesIncludeTax: boolean;
  readonly defaultWeightKg: number;
  readonly packagingCost: number;
  readonly paymentFeePercent: number;
  readonly minimumOrderAmount: number;
  readonly safetyProductionDays: number;
  readonly cutOffHour: number;
  readonly updatedAt: string;
}

export interface CommercialOperationsData {
  readonly version: number;
  readonly settings: CommercialOperationsSettings;
  readonly margins: readonly MarginRule[];
  readonly production: readonly ProductionRule[];
  readonly shippingZones: readonly ShippingZone[];
  readonly shippingMethods: readonly ShippingMethod[];
}

export interface QuoteSimulationInput {
  readonly productCost: number;
  readonly productPrice?: number;
  readonly quantity?: number;
  readonly provider?: string;
  readonly category?: string;
  readonly productId?: string;
  readonly technique?: string;
  readonly weightKg?: number;
  readonly country?: string;
  readonly postalCode?: string;
  readonly shippingMethodId?: string;
  readonly startDate?: string;
}

export interface QuoteSimulationResult {
  readonly currency: string;
  readonly quantity: number;
  readonly unitCost: number;
  readonly unitPrice: number;
  readonly subtotal: number;
  readonly packagingCost: number;
  readonly paymentFee: number;
  readonly shippingCost: number;
  readonly taxAmount: number;
  readonly total: number;
  readonly marginAmount: number;
  readonly marginPercentOnPrice: number;
  readonly productionDays: number;
  readonly shippingDays: { readonly min: number; readonly max: number };
  readonly estimatedDelivery: { readonly from: string; readonly to: string };
  readonly appliedRules: readonly string[];
  readonly warnings: readonly string[];
}
