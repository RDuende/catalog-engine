import { Type } from "@sinclair/typebox";

const conversationStateSchema = Type.Union([
  Type.Literal("WELCOME"), Type.Literal("DISCOVERY"), Type.Literal("QUALIFICATION"),
  Type.Literal("RECOMMENDATION"), Type.Literal("PROPOSAL"), Type.Literal("ORDER"),
  Type.Literal("COLLECT_REQUIREMENTS"), Type.Literal("SEARCH_PRODUCTS"), Type.Literal("COMPARE_OPTIONS"),
  Type.Literal("BUILD_PROPOSAL"), Type.Literal("CONFIRM"), Type.Literal("FINISHED"),
]);

const fieldSchema = Type.Union([
  Type.Literal("need"), Type.Literal("businessGoal"), Type.Literal("audience"), Type.Literal("quantity"),
  Type.Literal("budget"), Type.Literal("currency"), Type.Literal("sector"), Type.Literal("campaign"),
  Type.Literal("sustainability"), Type.Literal("customizable"), Type.Literal("personalizationRequested"), Type.Literal("deadline"),
  Type.Literal("providerKey"), Type.Literal("profile"), Type.Literal("selectedProductId"),
  Type.Literal("customerType"), Type.Literal("giftDiscoveryMode"), Type.Literal("recipientRelationship"),
  Type.Literal("recipientAge"), Type.Literal("recipientInterests"), Type.Literal("recipientDislikes"),
  Type.Literal("recipientPersonality"), Type.Literal("occasion"), Type.Literal("intendedUse"),
]);

export const CommercialContextSchema = Type.Object({
  need: Type.Optional(Type.String()),
  businessGoal: Type.Optional(Type.String()),
  audience: Type.Optional(Type.String()),
  quantity: Type.Optional(Type.Integer({ minimum: 1 })),
  budget: Type.Optional(Type.Number({ minimum: 0 })),
  currency: Type.Optional(Type.String({ minLength: 3, maxLength: 3 })),
  sector: Type.Optional(Type.String()),
  campaign: Type.Optional(Type.String()),
  sustainability: Type.Optional(Type.Boolean()),
  customizable: Type.Optional(Type.Boolean()),
  personalizationRequested: Type.Optional(Type.Boolean()),
  deadline: Type.Optional(Type.String()),
  providerKey: Type.Optional(Type.String()),
  profile: Type.Optional(Type.String()),
  selectedProductId: Type.Optional(Type.String({ format: "uuid" })),
  customerType: Type.Optional(Type.Union([Type.Literal("BUSINESS"), Type.Literal("CONSUMER")])),
  giftDiscoveryMode: Type.Optional(Type.Union([Type.Literal("HAS_IDEA"), Type.Literal("WANTS_SUGGESTIONS")])),
  recipientRelationship: Type.Optional(Type.String()),
  recipientAge: Type.Optional(Type.String()),
  recipientInterests: Type.Optional(Type.String()),
  recipientDislikes: Type.Optional(Type.String()),
  recipientPersonality: Type.Optional(Type.String()),
  occasion: Type.Optional(Type.String()),
  intendedUse: Type.Optional(Type.String()),
  conversationState: Type.Optional(conversationStateSchema),
  pendingField: Type.Optional(fieldSchema),
  confidence: Type.Optional(Type.Record(Type.String(), Type.Number({ minimum: 0, maximum: 1 }))),
}, { additionalProperties: false });
