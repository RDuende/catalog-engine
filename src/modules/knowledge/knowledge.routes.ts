import { Prisma } from "@prisma/client";
import type { FastifyInstance, FastifyReply } from "fastify";
import {
  CreateEdgeBodySchema,
  CreateNodeBodySchema,
  CreateProductLinkBodySchema,
  ListNodesQuerySchema,
  NodeIdParamsSchema,
  RecommendBodySchema,
  TraverseBodySchema,
  UpdateNodeBodySchema,
  type CreateEdgeBody,
  type CreateNodeBody,
  type CreateProductLinkBody,
  type ListNodesQuery,
  type RecommendBody,
  type TraverseBody,
  type UpdateNodeBody
} from "./knowledge.schemas.js";
import {
  createEdge,
  createNode,
  createProductLink,
  deleteNode,
  getNode,
  getRecommendationExplanation,
  listEdges,
  listNodes,
  recommendProducts,
  traverseGraph,
  updateNode
} from "./knowledge.service.js";

function handlePrismaError(error: unknown, reply: FastifyReply) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return reply.code(409).send({
        error: "CONFLICT",
        message: "Ya existe una relación o valor único igual.",
        fields: error.meta?.target
      });
    }
    if (error.code === "P2003") {
      return reply.code(400).send({
        error: "INVALID_RELATION",
        message: "Uno de los nodos o productos indicados no existe."
      });
    }
    if (error.code === "P2025") {
      return reply.code(404).send({
        error: "NOT_FOUND",
        message: "Registro no encontrado."
      });
    }
  }
  throw error;
}

export async function knowledgeRoutes(app: FastifyInstance) {
  app.get<{ Querystring: ListNodesQuery }>("/knowledge/nodes", {
    schema: {
      querystring: ListNodesQuerySchema
    }
  }, async (request) => listNodes(request.query));

  app.get<{ Params: { id: string } }>("/knowledge/nodes/:id", {
    schema: {
      params: NodeIdParamsSchema
    }
  }, async (request, reply) => {
    const node = await getNode(request.params.id);
    return node ?? reply.code(404).send({
      error: "NOT_FOUND",
      message: "Nodo no encontrado."
    });
  });

  app.post<{ Body: CreateNodeBody }>("/knowledge/nodes", {
    schema: {
      body: CreateNodeBodySchema
    }
  }, async (request, reply) => {
    try {
      return reply.code(201).send(await createNode(request.body));
    } catch (error) {
      return handlePrismaError(error, reply);
    }
  });

  app.patch<{
    Params: { id: string };
    Body: UpdateNodeBody;
  }>("/knowledge/nodes/:id", {
    schema: {
      params: NodeIdParamsSchema,
      body: UpdateNodeBodySchema
    }
  }, async (request, reply) => {
    try {
      return await updateNode(request.params.id, request.body);
    } catch (error) {
      return handlePrismaError(error, reply);
    }
  });

  app.delete<{ Params: { id: string } }>("/knowledge/nodes/:id", {
    schema: {
      params: NodeIdParamsSchema
    }
  }, async (request, reply) => {
    try {
      return {
        deleted: true,
        node: await deleteNode(request.params.id)
      };
    } catch (error) {
      return handlePrismaError(error, reply);
    }
  });

  app.get("/knowledge/edges", {
    schema: {
    }
  }, listEdges);

  app.post<{ Body: CreateEdgeBody }>("/knowledge/edges", {
    schema: {
      body: CreateEdgeBodySchema
    }
  }, async (request, reply) => {
    try {
      return reply.code(201).send(await createEdge(request.body));
    } catch (error) {
      return handlePrismaError(error, reply);
    }
  });

  app.post<{ Body: CreateProductLinkBody }>("/knowledge/product-links", {
    schema: {
      body: CreateProductLinkBodySchema
    }
  }, async (request, reply) => {
    try {
      return reply.code(201).send(
        await createProductLink(request.body)
      );
    } catch (error) {
      return handlePrismaError(error, reply);
    }
  });

  app.post<{ Body: TraverseBody }>("/knowledge/traverse", {
    schema: {
      body: TraverseBodySchema
    }
  }, async (request, reply) => {
    const result = await traverseGraph(request.body);
    return result ?? reply.code(404).send({
      error: "NOT_FOUND",
      message: "Nodo inicial no encontrado."
    });
  });

  app.post<{ Body: RecommendBody }>("/knowledge/recommend", {
    schema: {
      body: RecommendBodySchema
    }
  }, async (request) => recommendProducts(request.body));

  app.get<{ Params: { id: string } }>("/knowledge/sessions/:id", {
    schema: {
      params: NodeIdParamsSchema
    }
  }, async (request, reply) => {
    const session = await getRecommendationExplanation(request.params.id);
    return session ?? reply.code(404).send({
      error: "NOT_FOUND",
      message: "Sesión de recomendación no encontrada."
    });
  });
}
