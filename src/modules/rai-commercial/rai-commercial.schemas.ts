import { Static, Type } from "@sinclair/typebox";

export { CommercialContextSchema as RaiCommercialContextSchema } from "../../core/commercial-context/commercial-context.schema.js";
import { CommercialContextSchema } from "../../core/commercial-context/commercial-context.schema.js";

export const RaiCommercialChatBodySchema = Type.Object({
  message: Type.String({ minLength: 1, maxLength: 2000 }),
  sessionId: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  context: Type.Optional(CommercialContextSchema),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 20, default: 5 })),
  recommendNow: Type.Optional(Type.Boolean({ default: false })),
}, { additionalProperties: false });

export const RaiCommercialSelectBodySchema = Type.Object({
  sessionId: Type.String({ minLength: 1, maxLength: 100 }),
  productId: Type.String({ format: "uuid" }),
}, { additionalProperties: false });

export type RaiCommercialChatBody = Static<typeof RaiCommercialChatBodySchema>;
export type RaiCommercialSelectBody = Static<typeof RaiCommercialSelectBodySchema>;
