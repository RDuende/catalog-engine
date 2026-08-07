import { markingIntelligenceRoutes } from "./modules/marking-intelligence/index.js"; // MARKING_INTELLIGENCE_V1
import Fastify, { type FastifyError } from "fastify";
import { env } from "./config/env.js";
import { CATALOG_ENGINE_NAME, CATALOG_ENGINE_VERSION } from "./version.js";
import { catalogRoutes } from "./modules/catalog/index.js";
import { knowledgeRoutes } from "./modules/knowledge/index.js";
import { importRoutes } from "./modules/import-engine/index.js";
import { intentRoutes } from "./modules/intent-api/index.js";
import { raiRoutes } from "./modules/rai-api/index.js";
import { raiPlaygroundRoutes } from "./modules/rai-playground/index.js";
import { importWorkbenchRoutes } from "./modules/import-workbench/index.js";
import { catalogStudioRoutes } from "./modules/catalog-studio/index.js";
import { providerRoutes } from "./modules/provider-engine/index.js";
import { canonicalCatalogRoutes } from "./modules/canonical-catalog/index.js";
import { catalogMediaRoutes } from "./modules/catalog-media/index.js";
import { catalogImportRoutes } from "./modules/catalog-import/index.js";
import { platformStatisticsRoutes } from "./modules/platform-statistics/index.js";
import { platformSettingsRoutes } from "./modules/platform-settings/index.js";
import { catalogProviderAdminRoutes } from "./modules/catalog-providers/index.js";
import { jobRoutes } from "./modules/core-sync/index.js";
import { knowledgeGraphV2Routes } from "./modules/knowledge-graph-v2/index.js";
import { recommendationRoutes } from "./modules/recommendation-engine/index.js";
import { commercialMemoryRoutes } from "./modules/commercial-memory/index.js";
import { raiCommercialRoutes } from "./modules/rai-commercial/index.js";
import { salesBrainRoutes } from "./modules/sales-brain/index.js";
import { productionIntelligenceRoutes } from "./modules/production-intelligence/index.js";
import { raiWorkspaceRoutes } from "./modules/rai-workspace/index.js";
import { raiRuntimeRoutes } from "./modules/rai-runtime/index.js";
import { aiGatewayRoutes } from "./modules/ai-gateway/index.js";
import { raiConversationalAgentRoutes } from "./modules/rai-conversational-agent/index.js";
import { InMemoryTaskManager } from "./modules/task-manager/index.js";
import { taskManagerRoutes } from "./modules/task-manager/task.routes.js";
import { imageGenerationRoutes } from "./modules/image-generation/index.js";
import { createDefaultMvpConversationRepository, MvpConversationService, mvpConversationRoutes, mvpOrchestratorRoutes } from "./modules/mvp-orchestrator/index.js";
import { InMemoryArtifactRepository } from "./modules/artifact-domain/index.js";
import { LocalArtifactStorage } from "./modules/artifact-storage/index.js";
import { ArtifactService, artifactRoutes } from "./modules/artifact-service/index.js";
import { PresentationService, presentationRoutes } from "./modules/presentation-engine/index.js";
import { CanonicalSmartCatalogRepository, HybridSmartCatalogRepository, InMemorySmartCatalogRepository, SmartCatalogService, smartCatalogRoutes } from "./modules/smart-catalog/index.js";
import { PaymentIntentService, PurchaseExperienceService, createDefaultPaymentIntentRepository, createDefaultPurchaseOrderRepository, createPaymentProvider, purchaseExperienceRoutes } from "./modules/purchase-experience/index.js";
import { ExperienceApiService, experienceApiRoutes } from "./modules/experience-api/index.js";
import { channelAdapterRoutes, createDefaultChannelAdapterBundle } from "./modules/channel-adapter/index.js";
import { createDefaultProductionConnector, productionConnectorRoutes } from "./modules/production-connector/index.js";
import { CatalogIntelligenceService, catalogIntelligenceRoutes } from "./modules/catalog-intelligence/index.js";
import { AiIntelligenceService, aiIntelligenceRoutes } from "./modules/ai-intelligence/index.js";
import { commercialOperationsRoutes } from "./modules/commercial-operations/index.js";
import { savedIdeasRoutes } from "./modules/saved-ideas/index.js";

import { adminToolsRoutes } from "./modules/admin-tools/index.js";
import { productBrainStudioRoutes } from "./modules/product-brain-studio/index.js";
import { composerV2Routes } from "./modules/composer-v2/index.js";
import { platformHealthRoutes } from "./modules/platform-foundation/index.js";
import { giftBrainRoutes } from "./modules/gift-brain/index.js";
import { proposalBrainRoutes } from "./modules/proposal-brain/index.js";
import { proposalBrainV2Routes } from "./modules/proposal-brain/index.js";
import { brainOrchestratorRoutes } from "./modules/brain-orchestrator/index.js";
import { brainOrchestratorRuntimeRoutes } from "./modules/brain-orchestrator/index.js";
import { conversationEngineV2Routes } from "./modules/conversation-engine-v2/index.js";
import { conversationEngineV21Routes } from "./modules/conversation-engine-v2/index.js";
import { memoryBrainRoutes } from "./modules/memory-brain-v1/index.js";
import { emotionBrainRoutes } from "./modules/emotion-brain-v1/index.js";
import { intentBrainRoutes } from "./modules/intent-brain-v1/index.js";
import { brainOrchestratorIntelligenceRoutes } from "./modules/brain-orchestrator/index.js";
import { interestBrainV2Routes } from "./modules/interest-brain-v2/index.js";
import { functionalTestConsoleRoutes } from "./modules/functional-test-console/index.js";
export function buildApp() {
  const app = Fastify({
    logger: {
      level: env.logLevel,
    },
  });

  app.get("/", async () => ({
    name: CATALOG_ENGINE_NAME,
    version: CATALOG_ENGINE_VERSION,
    status: "running",
  }));

  app.get("/health", async () => ({
    status: "ok",
    version: CATALOG_ENGINE_VERSION,
    timestamp: new Date().toISOString(),
  }));

  app.get("/version", async () => ({
    name: CATALOG_ENGINE_NAME,
    version: CATALOG_ENGINE_VERSION,
  }));

  app.register(catalogRoutes, { prefix: "/api/v1" });
  app.register(knowledgeRoutes, { prefix: "/api/v1" });
  app.register(importRoutes, { prefix: "/api/v1" });
  app.register(intentRoutes, { prefix: "/api/v1" });
  app.register(raiRoutes, { prefix: "/api/v1" });
  app.register(raiPlaygroundRoutes);
  app.register(importWorkbenchRoutes);
  app.register(catalogStudioRoutes);
  app.register(providerRoutes, { prefix: "/api/v1" });
  app.register(canonicalCatalogRoutes, { prefix: "/api/v1" });
  app.register(catalogMediaRoutes, { prefix: "/api/v1" });
  app.register(catalogImportRoutes, { prefix: "/api/v1" });
  app.register(platformStatisticsRoutes, { prefix: "/api/v1" });
  app.register(async (settingsApp) => platformSettingsRoutes(settingsApp), { prefix: "/api/v1" });
  app.register(catalogProviderAdminRoutes, { prefix: "/api/v1" });
  app.register(commercialOperationsRoutes, { prefix: "/api/v1" });
  app.register(async (savedIdeasApp) => savedIdeasRoutes(savedIdeasApp), { prefix: "/api/v1" });
  app.register(jobRoutes, { prefix: "/api/v1" });
  app.register(knowledgeGraphV2Routes, { prefix: "/api/v1" });
  app.register(recommendationRoutes, { prefix: "/api/v1" });
  app.register(commercialMemoryRoutes, { prefix: "/api/v1" });
  app.register(raiCommercialRoutes, { prefix: "/api/v1" });
  app.register(salesBrainRoutes, { prefix: "/api/v1" });
  app.register(productionIntelligenceRoutes, { prefix: "/api/v1" });
  app.register(raiWorkspaceRoutes);
  app.register(raiRuntimeRoutes, { prefix: "/api/v1" });
  const taskManager = new InMemoryTaskManager();
  const artifactService = new ArtifactService(
    new InMemoryArtifactRepository(),
    new LocalArtifactStorage({ rootDirectory: process.env.ARTIFACT_STORAGE_DIR ?? ".data/artifacts" }),
  );
  app.register(async (taskApp) => taskManagerRoutes(taskApp, taskManager), { prefix: "/api/v1" });
  app.register(
    async (imageApp) => imageGenerationRoutes(imageApp, taskManager, artifactService),
    { prefix: "/api/v1" },
  );
  app.register(aiGatewayRoutes, { prefix: "/api/v1" });
  app.register(raiConversationalAgentRoutes, { prefix: "/api/v1" });
  app.register(mvpOrchestratorRoutes, { prefix: "/api/v1" });
  const conversationRepository = createDefaultMvpConversationRepository();
  const conversationService = new MvpConversationService(conversationRepository);
  app.register(async (conversationApp) => mvpConversationRoutes(conversationApp, conversationService), { prefix: "/api/v1" });
  app.register(async (artifactApp) => artifactRoutes(artifactApp, artifactService), { prefix: "/api/v1" });
  const presentationService = new PresentationService(artifactService);
  app.register(async (presentationApp) => presentationRoutes(presentationApp, presentationService), { prefix: "/api/v1" });
  const smartCatalogRepository = new HybridSmartCatalogRepository(
    new CanonicalSmartCatalogRepository(),
    new InMemorySmartCatalogRepository(),
  );
  const smartCatalogService = new SmartCatalogService(smartCatalogRepository);
  app.register(async (catalogApp) => smartCatalogRoutes(catalogApp, smartCatalogService), { prefix: "/api/v1" });
  const catalogIntelligenceService = new CatalogIntelligenceService(smartCatalogService);
  app.register(async (adminApp) => catalogIntelligenceRoutes(adminApp, catalogIntelligenceService), { prefix: "/api/v1" });
  const aiIntelligenceService = new AiIntelligenceService(smartCatalogService);
  app.register(async (intelligenceApp) => aiIntelligenceRoutes(intelligenceApp, aiIntelligenceService), { prefix: "/api/v1" });
  const purchaseOrderRepository = createDefaultPurchaseOrderRepository();
  const purchaseExperienceService = new PurchaseExperienceService(
    purchaseOrderRepository,
    new InMemorySmartCatalogRepository(),
  );
  const paymentIntentService = new PaymentIntentService(
    purchaseOrderRepository,
    createDefaultPaymentIntentRepository(),
    createPaymentProvider(),
  );
  app.register(async (purchaseApp) => purchaseExperienceRoutes(purchaseApp, purchaseExperienceService, paymentIntentService), { prefix: "/api/v1" });
  const channelAdapterBundle =
    createDefaultChannelAdapterBundle(
      purchaseExperienceService,
    );
  app.register(
    async (channelApp) =>
      channelAdapterRoutes(
        channelApp,
        channelAdapterBundle.channels,
        channelAdapterBundle.queue,
        channelAdapterBundle.webhook,
      ),
    { prefix: "/api/v1" },
  );
  const productionConnector =
    createDefaultProductionConnector(
      purchaseExperienceService,
    );
  app.register(
    async (productionApp) =>
      productionConnectorRoutes(
        productionApp,
        productionConnector,
      ),
    { prefix: "/api/v1" },
  );

  const experienceApiService = new ExperienceApiService(conversationRepository, artifactService, smartCatalogService, purchaseExperienceService, paymentIntentService);
  app.register(async (experienceApp) => experienceApiRoutes(experienceApp, experienceApiService), { prefix: "/api/v1" });

  app.setNotFoundHandler(async (_request, reply) => {
    return reply.code(404).send({
      error: "NOT_FOUND",
      message: "Ruta no encontrada.",
    });
  });

  app.setErrorHandler(async (error: FastifyError, request, reply) => {
    request.log.error(error);

    if (error.validation) {
      return reply.code(400).send({
        error: "VALIDATION_ERROR",
        message: "Los datos enviados no son válidos.",
        details: error.validation,
      });
    }

    return reply.code(error.statusCode ?? 500).send({
      error: "INTERNAL_ERROR",
      message: env.nodeEnv === "production"
        ? "Se ha producido un error interno."
        : error.message,
    });
  });
  void app.register(adminToolsRoutes);
  void app.register(productBrainStudioRoutes);
  void app.register(composerV2Routes);
  void app.register(platformHealthRoutes);
  void app.register(giftBrainRoutes);
  void app.register(proposalBrainRoutes);
  void app.register(proposalBrainV2Routes);
  void app.register(brainOrchestratorRoutes);
  void app.register(brainOrchestratorRuntimeRoutes);
  void app.register(conversationEngineV2Routes);
  void app.register(conversationEngineV21Routes);
  void app.register(memoryBrainRoutes);
  void app.register(emotionBrainRoutes);
  void app.register(intentBrainRoutes);
  void app.register(brainOrchestratorIntelligenceRoutes);
  void app.register(interestBrainV2Routes);
  void app.register(functionalTestConsoleRoutes);

  app.register(markingIntelligenceRoutes, { prefix: "/api/v1" }); // MARKING_INTELLIGENCE_V1
  return app;
}
