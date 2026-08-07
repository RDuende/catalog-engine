export const conversationSchema = {
  type: "object",
  additionalProperties: false,
  required: ["intent", "patches", "missingFields", "nextQuestion", "userFacingReply", "confidence"],
  properties: {
    intent: {
      type: "string",
      enum: ["GREETING", "DISCOVER", "RECOMMEND", "COMPARE", "PROPOSAL", "CORRECT", "CONFIRM", "OTHER"],
    },
    patches: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["field", "operation", "value", "confidence", "evidence"],
        properties: {
          field: {
            type: "string",
            enum: [
              "need", "businessGoal", "audience", "quantity", "budget", "currency", "sector", "campaign",
              "sustainability", "customizable", "deadline", "providerKey", "profile", "selectedProductId",
            ],
          },
          operation: { type: "string", enum: ["SET", "UNSET"] },
          value: { anyOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }, { type: "null" }] },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          evidence: { type: "string" },
        },
      },
    },
    missingFields: {
      type: "array",
      items: {
        type: "string",
        enum: [
          "need", "businessGoal", "audience", "quantity", "budget", "currency", "sector", "campaign",
          "sustainability", "customizable", "deadline", "providerKey", "profile", "selectedProductId",
        ],
      },
    },
    nextQuestion: { anyOf: [{ type: "string" }, { type: "null" }] },
    userFacingReply: { type: "string" },
    confidence: { type: "number", minimum: 0, maximum: 1 },
  },
} as const;
