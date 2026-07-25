import { Static, Type } from "@sinclair/typebox";

export const RecommendationBodySchema = Type.Object(
  {
    query: Type.String({ minLength: 2, maxLength: 1000 }),
    limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 50, default: 10 })),
    budget: Type.Optional(Type.Number({ minimum: 0 })),
    quantity: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
    currency: Type.Optional(Type.String({ minLength: 3, maxLength: 3, default: "EUR" })),
    categorySlugs: Type.Optional(Type.Array(Type.String({ minLength: 1 }), { maxItems: 20 })),
    knowledgeSlugs: Type.Optional(Type.Array(Type.String({ minLength: 1 }), { maxItems: 30 })),
    customizable: Type.Optional(Type.Boolean()),
    debug: Type.Optional(Type.Boolean({ default: false }))
  },
  { additionalProperties: false }
);

export type RecommendationBody = Static<typeof RecommendationBodySchema>;
