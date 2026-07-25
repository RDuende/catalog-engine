import { Static, Type } from "@sinclair/typebox";

export const CreateImportSourceBodySchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  type: Type.String({ minLength: 1 }),
  supplierId: Type.Optional(Type.String()),
  configuration: Type.Optional(Type.Record(Type.String(), Type.Unknown()))
});

export const RunImportBodySchema = Type.Object({
  sourceId: Type.String({ minLength: 1 }),
  filePath: Type.String({ minLength: 1 }),
  adapter: Type.Optional(Type.String()),
  dryRun: Type.Optional(Type.Boolean()),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 1000000 }))
});

export type CreateImportSourceBody = Static<typeof CreateImportSourceBodySchema>;
export type RunImportBody = Static<typeof RunImportBodySchema>;
