import { Type, type Static } from "@sinclair/typebox";

export const IdParamsSchema = Type.Object({
  id: Type.String({ minLength: 1 })
});

export const ProductListQuerySchema = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
  pageSize: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 25 })),
  search: Type.Optional(Type.String({ minLength: 1 })),
  status: Type.Optional(Type.Union([
    Type.Literal("DRAFT"),
    Type.Literal("ACTIVE"),
    Type.Literal("ARCHIVED"),
    Type.Literal("DISCONTINUED")
  ])),
  supplierId: Type.Optional(Type.String()),
  brandId: Type.Optional(Type.String()),
  categoryId: Type.Optional(Type.String()),
  customizable: Type.Optional(Type.Boolean()),
  featured: Type.Optional(Type.Boolean())
});

export const CreateProductBodySchema = Type.Object({
  name: Type.String({ minLength: 2, maxLength: 250 }),
  slug: Type.Optional(Type.String({ minLength: 2, maxLength: 250 })),
  sku: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  supplierId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  brandId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  supplierReference: Type.Optional(Type.String({ maxLength: 150 })),
  shortDescription: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
  aiDescription: Type.Optional(Type.String()),
  status: Type.Optional(Type.Union([
    Type.Literal("DRAFT"),
    Type.Literal("ACTIVE"),
    Type.Literal("ARCHIVED"),
    Type.Literal("DISCONTINUED")
  ])),
  productType: Type.Optional(Type.String({ maxLength: 100 })),
  primaryColor: Type.Optional(Type.String({ maxLength: 50 })),
  material: Type.Optional(Type.String({ maxLength: 100 })),
  weightGrams: Type.Optional(Type.Integer({ minimum: 0 })),
  widthMm: Type.Optional(Type.Integer({ minimum: 0 })),
  heightMm: Type.Optional(Type.Integer({ minimum: 0 })),
  depthMm: Type.Optional(Type.Integer({ minimum: 0 })),
  customizable: Type.Optional(Type.Boolean()),
  featured: Type.Optional(Type.Boolean()),
  metadata: Type.Optional(Type.Unknown()),
  categoryIds: Type.Optional(Type.Array(Type.String(), { uniqueItems: true })),
  primaryCategoryId: Type.Optional(Type.String())
});

export const UpdateProductBodySchema = Type.Partial(CreateProductBodySchema);

export const CreateNamedEntityBodySchema = Type.Object({
  name: Type.String({ minLength: 2, maxLength: 200 }),
  slug: Type.Optional(Type.String({ minLength: 2, maxLength: 200 })),
  metadata: Type.Optional(Type.Unknown())
});

export const CreateCategoryBodySchema = Type.Intersect([
  CreateNamedEntityBodySchema,
  Type.Object({
    description: Type.Optional(Type.String()),
    parentId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    position: Type.Optional(Type.Integer({ minimum: 0 })),
    active: Type.Optional(Type.Boolean())
  })
]);

export const CreateSupplierBodySchema = Type.Intersect([
  CreateNamedEntityBodySchema,
  Type.Object({
    taxId: Type.Optional(Type.String({ maxLength: 50 })),
    email: Type.Optional(Type.String({ format: "email" })),
    phone: Type.Optional(Type.String({ maxLength: 50 })),
    website: Type.Optional(Type.String()),
    active: Type.Optional(Type.Boolean())
  })
]);

export type ProductListQuery = Static<typeof ProductListQuerySchema>;
export type CreateProductBody = Static<typeof CreateProductBodySchema>;
export type UpdateProductBody = Static<typeof UpdateProductBodySchema>;
export type CreateCategoryBody = Static<typeof CreateCategoryBodySchema>;
export type CreateSupplierBody = Static<typeof CreateSupplierBodySchema>;
export type CreateNamedEntityBody = Static<typeof CreateNamedEntityBodySchema>;
