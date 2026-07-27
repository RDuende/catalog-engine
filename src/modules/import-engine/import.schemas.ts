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

export const AnalyzeImportBodySchema = Type.Object({
  filePath: Type.String({ minLength: 1 }),
  adapter: Type.Optional(Type.String()),
  configuration: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 1000000 })),
  sampleSize: Type.Optional(Type.Integer({ minimum: 1, maximum: 50 }))
});

export type CreateImportSourceBody = Static<typeof CreateImportSourceBodySchema>;
export type RunImportBody = Static<typeof RunImportBodySchema>;
export type AnalyzeImportBody = Static<typeof AnalyzeImportBodySchema>;


export const SearchCatalogCandidatesBodySchema = Type.Object({
  query: Type.Optional(Type.String()),
  recipient: Type.Optional(Type.String()),
  interests: Type.Optional(Type.Array(Type.String(), { maxItems: 20 })),
  occasions: Type.Optional(Type.Array(Type.String(), { maxItems: 20 })),
  styles: Type.Optional(Type.Array(Type.String(), { maxItems: 20 })),
  values: Type.Optional(Type.Array(Type.String(), { maxItems: 20 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 }))
});

export type SearchCatalogCandidatesBody = Static<typeof SearchCatalogCandidatesBodySchema>;
