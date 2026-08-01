import { Static, Type } from "@sinclair/typebox";

export const RaiCommercialContextSchema = Type.Object({
  providerKey: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  profile: Type.Optional(Type.String({ minLength: 1, maxLength: 50 })),
  sector: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  campaign: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  audience: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  budget: Type.Optional(Type.Number({ minimum: 0 })),
  quantity: Type.Optional(Type.Integer({ minimum: 1 })),
  currency: Type.Optional(Type.String({ minLength: 3, maxLength: 3 })),
  sustainability: Type.Optional(Type.Boolean()),
  customizable: Type.Optional(Type.Boolean()),
}, { additionalProperties: false });

export const RaiCommercialChatBodySchema = Type.Object({
  message: Type.String({ minLength: 1, maxLength: 2000 }),
  sessionId: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  context: Type.Optional(RaiCommercialContextSchema),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 20, default: 5 })),
  recommendNow: Type.Optional(Type.Boolean({ default: false })),
}, { additionalProperties: false });

export const RaiCommercialSelectBodySchema = Type.Object({
  sessionId: Type.String({ minLength: 1, maxLength: 100 }),
  productId: Type.String({ format: "uuid" }),
}, { additionalProperties: false });

export type RaiCommercialChatBody = Static<typeof RaiCommercialChatBodySchema>;
export type RaiCommercialSelectBody = Static<typeof RaiCommercialSelectBodySchema>;
