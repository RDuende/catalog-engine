import { Type, type Static } from "@sinclair/typebox";

export const SalesBrainContextSchema = Type.Object({
  need: Type.Optional(Type.String()), quantity: Type.Optional(Type.Number({ minimum: 1 })), budget: Type.Optional(Type.Number({ minimum: 0 })),
  currency: Type.Optional(Type.String()), sector: Type.Optional(Type.String()), campaign: Type.Optional(Type.String()), audience: Type.Optional(Type.String()),
  sustainability: Type.Optional(Type.Boolean()), customizable: Type.Optional(Type.Boolean()), providerKey: Type.Optional(Type.String()), profile: Type.Optional(Type.String()),
  selectedProductId: Type.Optional(Type.String({ format: "uuid" })),
  conversationState: Type.Optional(Type.Union([Type.Literal("WELCOME"), Type.Literal("DISCOVERY"), Type.Literal("COLLECT_REQUIREMENTS"), Type.Literal("SEARCH_PRODUCTS"), Type.Literal("COMPARE_OPTIONS"), Type.Literal("BUILD_PROPOSAL"), Type.Literal("CONFIRM"), Type.Literal("FINISHED")])),
  pendingField: Type.Optional(Type.Union([Type.Literal("need"), Type.Literal("quantity"), Type.Literal("budget"), Type.Literal("sustainability"), Type.Literal("customizable")])),
  confidence: Type.Optional(Type.Record(Type.String(), Type.Number({ minimum: 0, maximum: 1 }))),
}, { additionalProperties: false });

export const SalesBrainRequestSchema = Type.Object({
  message: Type.String({ minLength: 1 }), context: Type.Optional(SalesBrainContextSchema), limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 50 })),
  recommendNow: Type.Optional(Type.Boolean()),
}, { additionalProperties: false });

export type SalesBrainRequestBody = Static<typeof SalesBrainRequestSchema>;
