import { Static, Type } from "@sinclair/typebox";

export const RaiConversationBodySchema = Type.Object({
  message: Type.String({ minLength: 1, maxLength: 1000 }),
  sessionId: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  ideaLimit: Type.Optional(Type.Integer({ minimum: 1, maximum: 5, default: 3 })),
  recommendationLimit: Type.Optional(Type.Integer({ minimum: 1, maximum: 20, default: 8 })),
}, { additionalProperties: false });

export type RaiConversationBody = Static<typeof RaiConversationBodySchema>;
