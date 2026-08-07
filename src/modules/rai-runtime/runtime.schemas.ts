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

export const runtimeContextRequestSchema = {
  type: "object",
  additionalProperties: false,
  required: ["sessionId", "message"],
  properties: {
    requestId: { type: "string", minLength: 1, maxLength: 200 },
    correlationId: { type: "string", minLength: 1, maxLength: 200 },
    sessionId: { type: "string", minLength: 1, maxLength: 200 },
    message: { type: "string", minLength: 1, maxLength: 10000 },
    goal: { type: "string", enum: ["UNDERSTAND_REQUEST", "RECOMMEND_PRODUCTS", "PREPARE_PROPOSAL"] },
    state: { type: "string", enum: ["WELCOME", "DISCOVER", "UNDERSTAND", "INSPIRE", "PROPOSE", "REFINE", "CONFIRM", "COMPLETE"] },
    actor: {
      type: "object",
      additionalProperties: false,
      properties: {
        actorId: { type: "string", minLength: 1, maxLength: 200 },
        role: { type: "string", enum: ["ANONYMOUS", "CUSTOMER", "RECIPIENT", "COLLABORATOR", "STAFF", "SYSTEM"] },
        locale: { type: "string", minLength: 2, maxLength: 20 },
      },
    },
    project: {
      type: "object",
      additionalProperties: false,
      required: ["projectId"],
      properties: {
        projectId: { type: "string", minLength: 1, maxLength: 200 },
        version: { type: "integer", minimum: 0 },
        status: { type: "string", maxLength: 100 },
      },
    },
    context: { type: "object", additionalProperties: true },
    limit: { type: "integer", minimum: 1, maximum: 50 },
    recommendNow: { type: "boolean" },
    metadata: { type: "object", additionalProperties: true },
  },
} as const;
