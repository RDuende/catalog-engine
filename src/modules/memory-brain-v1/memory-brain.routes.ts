import type {
  FastifyInstance,
} from "fastify";

import {
  defaultMemoryBrain,
} from "./memory-brain.service.js";
import type {
  ConversationMemoryInput,
  GiftHistoryInput,
  MemoryLearnInput,
  MemoryQuery,
} from "./memory-brain.types.js";

export async function memoryBrainRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.post<{
    Body: MemoryLearnInput;
  }>(
    "/api/v1/memory-brain/learn",
    async (request) =>
      defaultMemoryBrain.learn(
        request.body,
      ),
  );

  app.post<{
    Body: MemoryQuery;
  }>(
    "/api/v1/memory-brain/query",
    async (request) => ({
      records:
        await defaultMemoryBrain.query(
          request.body,
        ),
    }),
  );

  app.post<{
    Body: ConversationMemoryInput;
  }>(
    "/api/v1/memory-brain/learn-conversation",
    async (request) => ({
      results:
        await defaultMemoryBrain
          .learnConversation(
            request.body,
          ),
    }),
  );

  app.post<{
    Body: GiftHistoryInput;
  }>(
    "/api/v1/memory-brain/remember-gift",
    async (request) =>
      defaultMemoryBrain
        .rememberGift(
          request.body,
        ),
  );

  app.get<{
    Params: {
      subjectKey: string;
    };
  }>(
    "/api/v1/memory-brain/snapshot/:subjectKey",
    async (request) =>
      defaultMemoryBrain.snapshot(
        decodeURIComponent(
          request.params.subjectKey,
        ),
      ),
  );

  app.get(
    "/api/v1/memory-brain/preset",
    async () => ({
      conversation: {
        conversationId:
          "demo-memory",
        recipientLabel:
          "mi padre",
        relationship:
          "muy cercana",
        occasion:
          "cumpleaños",
        budget: 70,
        interests: [
          "motocross",
          "madera",
        ],
        personality: [
          "práctico",
          "aventurero",
        ],
        desiredImpact: [
          "sorprender",
        ],
      },
      gift: {
        subjectKey:
          "recipient:mi padre",
        orderId:
          "ORDER-DEMO-1",
        occasion:
          "cumpleaños",
        products: [
          {
            productId:
              "p1",
            name:
              "Termo personalizado motocross",
            category:
              "botellas",
          },
        ],
        total: 34,
      },
    }),
  );
}
