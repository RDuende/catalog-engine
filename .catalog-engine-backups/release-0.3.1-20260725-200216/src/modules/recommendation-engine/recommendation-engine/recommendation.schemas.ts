import { Type, type Static } from "@sinclair/typebox";

export const RecommendationBodySchema = Type.Object({
  query: Type.String({ minLength: 2, maxLength: 500 }),
  budget: Type.Optional(Type.Number({ minimum: 0 })),
  quantity: Type.Optional(Type.Integer({ minimum: 1 })),
  currency: Type.Optional(Type.String({ minLength: 3, maxLength: 3, default: "EUR" })),
  customizable: Type.Optional(Type.Boolean()),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 50, default: 12 })),
  debug: Type.Optional(Type.Boolean({ default: false }))
});

export type RecommendationBody = Static<typeof RecommendationBodySchema>;
