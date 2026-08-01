export const conversationExtractBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["message"],
  properties: {
    message: { type: "string", minLength: 1, maxLength: 10000 },
    context: { type: "object", additionalProperties: true },
  },
} as const;
