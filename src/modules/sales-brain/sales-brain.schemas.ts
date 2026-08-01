import { Type, type Static } from "@sinclair/typebox";

export { CommercialContextSchema as SalesBrainContextSchema } from "../../core/commercial-context/commercial-context.schema.js";
import { CommercialContextSchema } from "../../core/commercial-context/commercial-context.schema.js";

export const SalesBrainRequestSchema = Type.Object({
  message: Type.String({ minLength: 1 }), context: Type.Optional(CommercialContextSchema), limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 50 })),
  recommendNow: Type.Optional(Type.Boolean()),
}, { additionalProperties: false });

export type SalesBrainRequestBody = Static<typeof SalesBrainRequestSchema>;
