import { Static, Type } from "@sinclair/typebox";

export const IntentAnalyzeBodySchema = Type.Object(
  {
    query: Type.String({
      minLength: 2,
      maxLength: 1000,
    }),

    limit: Type.Optional(
      Type.Integer({
        minimum: 1,
        maximum: 50,
        default: 10,
      }),
    ),

    validOnly: Type.Optional(
      Type.Boolean({
        default: true,
      }),
    ),

    minimumScore: Type.Optional(
      Type.Number({
        minimum: 0,
        maximum: 100,
      }),
    ),
  },
  {
    additionalProperties: false,
  },
);

export const IntentRecommendBodySchema = Type.Object(
  {
    query: Type.String({
      minLength: 2,
      maxLength: 1000,
    }),

    limit: Type.Optional(
      Type.Integer({
        minimum: 1,
        maximum: 50,
        default: 10,
      }),
    ),

    validOnly: Type.Optional(
      Type.Boolean({
        default: true,
      }),
    ),

    minimumScore: Type.Optional(
      Type.Number({
        minimum: 0,
        maximum: 100,
      }),
    ),

    currency: Type.Optional(
      Type.String({
        minLength: 3,
        maxLength: 3,
        default: "EUR",
      }),
    ),

    debug: Type.Optional(
      Type.Boolean({
        default: false,
      }),
    ),

    solutionLimit: Type.Optional(
      Type.Integer({
        minimum: 1,
        maximum: 10,
        default: 3,
      }),
    ),
  },
  {
    additionalProperties: false,
  },
);

export type IntentAnalyzeBody = Static<typeof IntentAnalyzeBodySchema>;
export type IntentRecommendBody = Static<typeof IntentRecommendBodySchema>;