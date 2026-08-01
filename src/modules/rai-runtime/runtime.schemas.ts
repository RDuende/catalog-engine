export const runtimeRequestSchema = {
  type: "object",
  additionalProperties: false,
  required: ["message"],
  properties: {
    goal: { type: "string", enum: ["UNDERSTAND_REQUEST", "RECOMMEND_PRODUCTS", "PREPARE_PROPOSAL"] },
    message: { type: "string", minLength: 1, maxLength: 10000 },
    context: { type: "object", additionalProperties: true },
    limit: { type: "integer", minimum: 1, maximum: 50 },
    recommendNow: { type: "boolean" },
  },
} as const;
