export type CapabilityCategory = "personalization" | "production" | "material" | "delivery";
export type CapabilityValue = string | number | boolean;

export interface ProductCapability {
  id: string;
  productId: string;
  code: string;
  category: CapabilityCategory;
  value: CapabilityValue;
  confidence: number;
  source: "manual" | "import" | "builder" | "rule";
}

export interface CapabilityRequirement {
  code: string;
  value?: CapabilityValue;
  minimumConfidence?: number;
}
