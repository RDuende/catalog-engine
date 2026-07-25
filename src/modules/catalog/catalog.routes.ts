import { Prisma } from "@prisma/client";
import type { FastifyInstance, FastifyReply } from "fastify";
import {
  CreateCategoryBodySchema,
  CreateNamedEntityBodySchema,
  CreateProductBodySchema,
  CreateSupplierBodySchema,
  IdParamsSchema,
  ProductListQuerySchema,
  UpdateProductBodySchema,
  type CreateCategoryBody,
  type CreateNamedEntityBody,
  type CreateProductBody,
  type CreateSupplierBody,
  type ProductListQuery,
  type UpdateProductBody
} from "./catalog.schemas.js";
import {
  createBrand,
  createCategory,
  createProduct,
  createSupplier,
  deleteProduct,
  getProduct,
  listBrands,
  listCategories,
  listProducts,
  listSuppliers,
  updateProduct
} from "./catalog.service.js";

function handlePrismaError(error: unknown, reply: FastifyReply) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return reply.code(409).send({
        error: "CONFLICT",
        message: "Ya existe un registro con uno de los valores únicos enviados.",
        fields: error.meta?.target
      });
    }

    if (error.code === "P2003") {
      return reply.code(400).send({
        error: "INVALID_RELATION",
        message: "Una de las relaciones indicadas no existe."
      });
    }

    if (error.code === "P2025") {
      return reply.code(404).send({
        error: "NOT_FOUND",
        message: "No se encontró el registro solicitado."
      });
    }
  }

  throw error;
}

export async function catalogRoutes(app: FastifyInstance) {
  app.get<{ Querystring: ProductListQuery }>(
    "/products",
    {
      schema: {
        querystring: ProductListQuerySchema
      }
    },
    async (request) => listProducts(request.query)
  );

  app.get<{ Params: { id: string } }>(
    "/products/:id",
    {
      schema: {
        params: IdParamsSchema
      }
    },
    async (request, reply) => {
      const product = await getProduct(request.params.id);

      if (!product) {
        return reply.code(404).send({
          error: "NOT_FOUND",
          message: "Producto no encontrado."
        });
      }

      return product;
    }
  );

  app.post<{ Body: CreateProductBody }>(
    "/products",
    {
      schema: {
        body: CreateProductBodySchema
      }
    },
    async (request, reply) => {
      try {
        return reply.code(201).send(
          await createProduct(request.body)
        );
      } catch (error) {
        return handlePrismaError(error, reply);
      }
    }
  );

  app.patch<{
    Params: { id: string };
    Body: UpdateProductBody;
  }>(
    "/products/:id",
    {
      schema: {
        params: IdParamsSchema,
        body: UpdateProductBodySchema
      }
    },
    async (request, reply) => {
      try {
        return await updateProduct(
          request.params.id,
          request.body
        );
      } catch (error) {
        return handlePrismaError(error, reply);
      }
    }
  );

  app.delete<{ Params: { id: string } }>(
    "/products/:id",
    {
      schema: {
        params: IdParamsSchema
      }
    },
    async (request, reply) => {
      try {
        return {
          deleted: true,
          product: await deleteProduct(request.params.id)
        };
      } catch (error) {
        return handlePrismaError(error, reply);
      }
    }
  );

  app.get(
    "/categories",
    {
      schema: {
      }
    },
    listCategories
  );

  app.post<{ Body: CreateCategoryBody }>(
    "/categories",
    {
      schema: {
        body: CreateCategoryBodySchema
      }
    },
    async (request, reply) => {
      try {
        return reply.code(201).send(
          await createCategory(request.body)
        );
      } catch (error) {
        return handlePrismaError(error, reply);
      }
    }
  );

  app.get(
    "/suppliers",
    {
      schema: {
      }
    },
    listSuppliers
  );

  app.post<{ Body: CreateSupplierBody }>(
    "/suppliers",
    {
      schema: {
        body: CreateSupplierBodySchema
      }
    },
    async (request, reply) => {
      try {
        return reply.code(201).send(
          await createSupplier(request.body)
        );
      } catch (error) {
        return handlePrismaError(error, reply);
      }
    }
  );

  app.get(
    "/brands",
    {
      schema: {
      }
    },
    listBrands
  );

  app.post<{ Body: CreateNamedEntityBody }>(
    "/brands",
    {
      schema: {
        body: CreateNamedEntityBodySchema
      }
    },
    async (request, reply) => {
      try {
        return reply.code(201).send(
          await createBrand(request.body)
        );
      } catch (error) {
        return handlePrismaError(error, reply);
      }
    }
  );
}
