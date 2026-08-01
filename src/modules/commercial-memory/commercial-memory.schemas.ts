import { Static, Type } from "@sinclair/typebox";

export const FeedbackBodySchema = Type.Object({
  runId: Type.String({ format: "uuid" }),
  productId: Type.String({ format: "uuid" }),
  eventType: Type.Union([
    Type.Literal("SHOWN"), Type.Literal("SHORTLISTED"), Type.Literal("QUOTED"),
    Type.Literal("ACCEPTED"), Type.Literal("REJECTED"), Type.Literal("PURCHASED"),
  ]),
  value: Type.Optional(Type.Number()),
  notes: Type.Optional(Type.String({ maxLength: 2000 })),
  actor: Type.Optional(Type.String({ maxLength: 200 })),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
}, { additionalProperties: false });
export type FeedbackBody = Static<typeof FeedbackBodySchema>;
