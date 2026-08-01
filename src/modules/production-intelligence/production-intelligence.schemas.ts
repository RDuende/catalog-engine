export const ProductionPlanSchema = {
  type: "object",
  additionalProperties: false,
  required: ["quantity", "technique"],
  properties: {
    quantity: { type: "integer", minimum: 1 },
    technique: { type: "string", enum: ["laser", "screen_printing", "pad_printing", "digital", "unpriced"] },
    categories: { type: "array", items: { type: "string" } },
    knowledge: { type: "array", items: { type: "string" } },
    requestedLeadDays: { type: "integer", minimum: 1 },
    preferredMachineId: { type: "string", minLength: 1 },
  },
} as const;
