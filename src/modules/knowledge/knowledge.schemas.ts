import { Type, type Static } from "@sinclair/typebox";

const NodeType = Type.Union([
  Type.Literal("CONCEPT"),
  Type.Literal("NEED"),
  Type.Literal("SOLUTION"),
  Type.Literal("SOLUTION_STEP"),
  Type.Literal("AUDIENCE"),
  Type.Literal("OCCASION"),
  Type.Literal("BUSINESS_TYPE"),
  Type.Literal("OBJECTIVE"),
  Type.Literal("STYLE"),
  Type.Literal("MATERIAL"),
  Type.Literal("TECHNIQUE")
]);

const RelationType = Type.Union([
  Type.Literal("REQUIRES"),
  Type.Literal("SUGGESTS"),
  Type.Literal("SOLVES"),
  Type.Literal("PART_OF"),
  Type.Literal("RELATED_TO"),
  Type.Literal("SUITABLE_FOR"),
  Type.Literal("ALTERNATIVE_TO"),
  Type.Literal("COMPLEMENTS"),
  Type.Literal("PRECEDES"),
  Type.Literal("DEPENDS_ON"),
  Type.Literal("USED_FOR"),
  Type.Literal("PRODUCES")
]);

const EvidenceType = Type.Union([
  Type.Literal("MANUAL"),
  Type.Literal("RULE"),
  Type.Literal("IMPORT"),
  Type.Literal("AI"),
  Type.Literal("BEHAVIOR")
]);

export const NodeIdParamsSchema = Type.Object({
  id: Type.String({ minLength: 1 })
});

export const ListNodesQuerySchema = Type.Object({
  type: Type.Optional(NodeType),
  search: Type.Optional(Type.String({ minLength: 1 })),
  active: Type.Optional(Type.Boolean())
});

export const CreateNodeBodySchema = Type.Object({
  type: NodeType,
  name: Type.String({ minLength: 2, maxLength: 250 }),
  slug: Type.Optional(Type.String({ minLength: 2, maxLength: 250 })),
  description: Type.Optional(Type.String()),
  active: Type.Optional(Type.Boolean()),
  priority: Type.Optional(Type.Integer()),
  metadata: Type.Optional(Type.Unknown())
});

export const UpdateNodeBodySchema = Type.Partial(CreateNodeBodySchema);

export const CreateEdgeBodySchema = Type.Object({
  sourceId: Type.String(),
  targetId: Type.String(),
  relationType: RelationType,
  weight: Type.Optional(Type.Number({ minimum: 0, maximum: 1 })),
  confidence: Type.Optional(Type.Number({ minimum: 0, maximum: 1 })),
  evidenceType: Type.Optional(EvidenceType),
  explanation: Type.Optional(Type.String()),
  active: Type.Optional(Type.Boolean()),
  metadata: Type.Optional(Type.Unknown())
});

export const CreateProductLinkBodySchema = Type.Object({
  nodeId: Type.String(),
  productId: Type.String(),
  relationType: Type.Optional(RelationType),
  weight: Type.Optional(Type.Number({ minimum: 0, maximum: 1 })),
  confidence: Type.Optional(Type.Number({ minimum: 0, maximum: 1 })),
  evidenceType: Type.Optional(EvidenceType),
  explanation: Type.Optional(Type.String()),
  active: Type.Optional(Type.Boolean()),
  metadata: Type.Optional(Type.Unknown())
});

export const TraverseBodySchema = Type.Object({
  nodeId: Type.String(),
  depth: Type.Optional(Type.Integer({ minimum: 1, maximum: 5, default: 2 })),
  minimumWeight: Type.Optional(Type.Number({ minimum: 0, maximum: 1, default: 0 })),
  relationTypes: Type.Optional(Type.Array(RelationType, { uniqueItems: true }))
});

export const RecommendBodySchema = Type.Object({
  query: Type.String({ minLength: 2, maxLength: 1000 }),
  nodeIds: Type.Optional(Type.Array(Type.String(), { uniqueItems: true })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 50, default: 10 })),
  depth: Type.Optional(Type.Integer({ minimum: 1, maximum: 4, default: 2 })),
  minimumScore: Type.Optional(Type.Number({ minimum: 0, maximum: 1, default: 0.05 })),
  context: Type.Optional(Type.Unknown())
});

export type ListNodesQuery = Static<typeof ListNodesQuerySchema>;
export type CreateNodeBody = Static<typeof CreateNodeBodySchema>;
export type UpdateNodeBody = Static<typeof UpdateNodeBodySchema>;
export type CreateEdgeBody = Static<typeof CreateEdgeBodySchema>;
export type CreateProductLinkBody = Static<typeof CreateProductLinkBodySchema>;
export type TraverseBody = Static<typeof TraverseBodySchema>;
export type RecommendBody = Static<typeof RecommendBodySchema>;
