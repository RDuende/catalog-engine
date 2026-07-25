import { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type {
  CreateCategoryBody,
  CreateNamedEntityBody,
  CreateProductBody,
  CreateSupplierBody,
  ProductListQuery,
  UpdateProductBody
} from "./catalog.schemas.js";
import { slugify } from "./catalog.utils.js";

const productInclude = {
  supplier: true,
  brand: true,
  categories: {
    include: { category: true },
    orderBy: { position: "asc" as const }
  },
  variants: {
    orderBy: { createdAt: "asc" as const }
  },
  media: {
    include: { media: true, variant: true },
    orderBy: { position: "asc" as const }
  },
  prices: {
    include: { channel: true, priceList: true },
    orderBy: { minQuantity: "asc" as const }
  },
  inventoryItems: {
    include: { warehouse: true, variant: true }
  }
} satisfies Prisma.ProductInclude;

export async function listProducts(query: ProductListQuery) {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 25;

  const where: Prisma.ProductWhereInput = {
    ...(query.status ? { status: query.status as ProductStatus } : {}),
    ...(query.supplierId ? { supplierId: query.supplierId } : {}),
    ...(query.brandId ? { brandId: query.brandId } : {}),
    ...(typeof query.customizable === "boolean"
      ? { customizable: query.customizable }
      : {}),
    ...(typeof query.featured === "boolean"
      ? { featured: query.featured }
      : {}),
    ...(query.categoryId
      ? { categories: { some: { categoryId: query.categoryId } } }
      : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { sku: { contains: query.search, mode: "insensitive" } },
            { supplierReference: { contains: query.search, mode: "insensitive" } },
            { shortDescription: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
      include: {
        supplier: true,
        brand: true,
        categories: {
          include: { category: true },
          where: { isPrimary: true },
          take: 1
        },
        media: {
          include: { media: true },
          where: { isPrimary: true },
          take: 1
        },
        _count: {
          select: {
            variants: true,
            prices: true,
            inventoryItems: true
          }
        }
      }
    }),
    prisma.product.count({ where })
  ]);

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      pages: Math.ceil(total / pageSize)
    }
  };
}

export function getProduct(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: productInclude
  });
}

export async function createProduct(input: CreateProductBody) {
  const categoryIds = [...(input.categoryIds ?? [])];

  if (
    input.primaryCategoryId &&
    !categoryIds.includes(input.primaryCategoryId)
  ) {
    categoryIds.push(input.primaryCategoryId);
  }

  const {
    categoryIds: _categoryIds,
    primaryCategoryId,
    ...data
  } = input;

  return prisma.product.create({
    data: {
      ...data,
      slug: data.slug?.trim() || slugify(data.name),
      status: data.status as ProductStatus | undefined,
      metadata: data.metadata as Prisma.InputJsonValue | undefined,
      categories: categoryIds.length
        ? {
            create: categoryIds.map((categoryId, index) => ({
              categoryId,
              isPrimary:
                primaryCategoryId === categoryId ||
                (!primaryCategoryId && index === 0),
              position: index
            }))
          }
        : undefined
    },
    include: productInclude
  });
}

export async function updateProduct(id: string, input: UpdateProductBody) {
  const categoryIds = input.categoryIds
    ? [...input.categoryIds]
    : undefined;

  if (
    categoryIds &&
    input.primaryCategoryId &&
    !categoryIds.includes(input.primaryCategoryId)
  ) {
    categoryIds.push(input.primaryCategoryId);
  }

  const {
    categoryIds: _categoryIds,
    primaryCategoryId,
    ...data
  } = input;

  return prisma.$transaction(async (tx) => {
    if (categoryIds) {
      await tx.productCategory.deleteMany({
        where: { productId: id }
      });

      if (categoryIds.length) {
        await tx.productCategory.createMany({
          data: categoryIds.map((categoryId, index) => ({
            productId: id,
            categoryId,
            isPrimary:
              primaryCategoryId === categoryId ||
              (!primaryCategoryId && index === 0),
            position: index
          }))
        });
      }
    }

    return tx.product.update({
      where: { id },
      data: {
        ...data,
        ...(data.name && !data.slug
          ? { slug: slugify(data.name) }
          : {}),
        status: data.status as ProductStatus | undefined,
        metadata: data.metadata as Prisma.InputJsonValue | undefined
      },
      include: productInclude
    });
  });
}

export function deleteProduct(id: string) {
  return prisma.product.delete({
    where: { id },
    select: { id: true, name: true, slug: true }
  });
}

export function listCategories() {
  return prisma.category.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: {
      parent: true,
      _count: {
        select: { children: true, products: true }
      }
    }
  });
}

export function createCategory(input: CreateCategoryBody) {
  return prisma.category.create({
    data: {
      ...input,
      slug: input.slug?.trim() || slugify(input.name),
      metadata: input.metadata as Prisma.InputJsonValue | undefined
    }
  });
}

export function listSuppliers() {
  return prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          products: true,
          priceLists: true,
          importSources: true
        }
      }
    }
  });
}

export function createSupplier(input: CreateSupplierBody) {
  return prisma.supplier.create({
    data: {
      ...input,
      slug: input.slug?.trim() || slugify(input.name),
      metadata: input.metadata as Prisma.InputJsonValue | undefined
    }
  });
}

export function listBrands() {
  return prisma.brand.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { products: true }
      }
    }
  });
}

export function createBrand(input: CreateNamedEntityBody) {
  return prisma.brand.create({
    data: {
      ...input,
      slug: input.slug?.trim() || slugify(input.name),
      metadata: input.metadata as Prisma.InputJsonValue | undefined
    }
  });
}
