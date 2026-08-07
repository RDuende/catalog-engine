import type {
  AdminToolDefinition,
} from "./admin-tools.types.js";

export const ADMIN_TOOLS:
  readonly AdminToolDefinition[] =
  Object.freeze([
    {
      id: "platform-health",
      name: "System Health Dashboard",
      description:
        "Salud, versiones y diagnóstico de RecuerdArte Platform 2.0.",
      category: "Infrastructure",
      mode: "NAVIGATION",
      adminPath:
        "/admin/platform-health",
      testScript:
        "npm run test:platform-foundation",
    },
    {
      id: "ai-lab",
      name: "AI Laboratory",
      description:
        "Prueba el Journey, Gift Profile, catálogo y trazas completas.",
      category: "Conversation",
      mode: "NAVIGATION",
      adminPath: "/admin/ai-lab",
      testScript:
        "npx tsx --test src/modules/ai-intelligence/*.test.ts",
    },
    {
      id: "intelligence-center",
      name: "Intelligence Center",
      description:
        "Acceso general a diagnóstico e inteligencia del sistema.",
      category: "Intelligence",
      mode: "NAVIGATION",
      adminPath:
        "/admin/intelligence",
    },
    {
      id: "catalog-intelligence",
      name: "Catalog Intelligence",
      description:
        "Inspección del catálogo, clasificación y Product Brain.",
      category: "Catalog",
      mode: "NAVIGATION",
      adminPath:
        "/admin/catalog-intelligence",
      testScript:
        "npm run test:product-brain",
    },

    {
      id: "functional-test-console",
      name: "Functional Test Console",
      description:
        "Batería funcional revisable caso por caso para Rai y sus Brains.",
      category: "Infrastructure",
      mode: "NAVIGATION",
      adminPath:
        "/admin/functional-tests",
      testScript:
        "npm run test:functional-console",
    },
    {
      id: "intelligence-runtime",
      name: "Rai Intelligence Runtime",
      description: "Pipeline dinámico Intent + Memory + Emotion + Orchestrator.",
      category: "Infrastructure",
      mode: "NAVIGATION",
      adminPath: "/admin/intelligence-runtime",
      testScript: "npm run test:intelligence-runtime",
    },
    {
      id: "interest-brain-v2",
      name: "Interest Brain Studio V2",
      description:
        "Taxonomía canónica, intereses implícitos, clusters, pesos y afinidades.",
      category: "Intelligence",
      mode: "NAVIGATION",
      adminPath:
        "/admin/interest-brain-v2",
      testScript:
        "npm run test:interest-brain-v2",
    },
    {
      id: "intent-brain-v1",
      name: "Intent Brain Studio",
      description:
        "Intención principal, evidencias y plan de ejecución entre Brains.",
      category: "Intelligence",
      mode: "NAVIGATION",
      adminPath:
        "/admin/intent-brain",
      testScript:
        "npm run test:intent-brain-v1",
    },
    {
      id: "emotion-brain-v1",
      name: "Emotion Brain Studio",
      description:
        "Emoción principal, intensidad, confianza, evidencias y pesos emocionales.",
      category: "Intelligence",
      mode: "NAVIGATION",
      adminPath:
        "/admin/emotion-brain",
      testScript:
        "npm run test:emotion-brain-v1",
    },
    {
      id: "memory-brain-v1",
      name: "Memory Brain Studio",
      description:
        "Memoria persistente, confianza, origen, regalos anteriores y conflictos.",
      category: "Conversation",
      mode: "NAVIGATION",
      adminPath:
        "/admin/memory-brain",
      testScript:
        "npm run test:memory-brain-v1",
    },
    {
      id: "conversation-engine-v2",
      name: "Conversation Studio V2",
      description:
        "Conversation Graph, hechos, preguntas, contradicciones, replay y Orchestrator.",
      category: "Conversation",
      mode: "NAVIGATION",
      adminPath:
        "/admin/conversation-studio",
      testScript:
        "npm run test:conversation-engine-v2",
    },
    {
      id: "brain-orchestrator",
      name: "Brain Orchestrator Studio",
      description:
        "Pipeline central de Rai: etapas, tiempos, confidence, replay y benchmark.",
      category: "Infrastructure",
      mode: "NAVIGATION",
      adminPath:
        "/admin/brain-orchestrator",
      testScript:
        "npm run test:brain-orchestrator",
    },
    {
      id: "proposal-brain",
      name: "Proposal Brain Studio",
      description:
        "Comparación, ranking, Confidence y Rayos X de propuestas.",
      category: "Intelligence",
      mode: "NAVIGATION",
      adminPath:
        "/admin/proposal-brain",
      testScript:
        "npm run test:proposal-brain-v2",
    },
    {
      id: "gift-brain",
      name: "Gift Brain Studio",
      description:
        "Perfil, intención, emoción, estrategias, simulación y decisión.",
      category: "Intelligence",
      mode: "NAVIGATION",
      adminPath:
        "/admin/gift-brain",
      testScript:
        "npm run test:gift-brain",
    },
    {
      id: "interest-brain",
      name: "Interest Brain",
      description:
        "Normalización y detección de intereses canónicos.",
      category: "Intelligence",
      mode: "RUNNABLE",
      adminPath:
        "/admin/tools?tool=interest-brain",
      testScript:
        "npm run test:interest-brain",
      defaultPayload: {
        text:
          "Es para mi padre, es chef y le encanta hacer barbacoas.",
      },
    },
    {
      id: "knowledge-brain",
      name: "Knowledge Brain",
      description:
        "Clasificación semántica de intereses, materiales, características y objetos.",
      category: "Intelligence",
      mode: "RUNNABLE",
      adminPath:
        "/admin/tools?tool=knowledge-brain",
      testScript:
        "npm run test:knowledge-brain",
      defaultPayload: {
        text:
          "Power bank metálico con batería de 5000mAh y USB-C.",
      },
    },
    {
      id: "memory-brain",
      name: "Memory Brain",
      description:
        "Memoria incremental, conflictos, preguntas y decisiones.",
      category: "Conversation",
      mode: "RUNNABLE",
      adminPath:
        "/admin/tools?tool=memory-brain",
      testScript:
        "npm run test:memory-brain",
      defaultPayload: {
        messages: [
          "Es para mis padres.",
          "Les encanta cocinar.",
          "Tengo 60 euros.",
          "No quiero tazas.",
          "Prefiero madera.",
        ],
      },
    },
    {
      id: "journey-memory",
      name: "Journey Memory",
      description:
        "Persistencia y snapshot de memoria asociados al Journey.",
      category: "Conversation",
      mode: "RUNNABLE",
      adminPath:
        "/admin/tools?tool=journey-memory",
      testScript:
        "npm run test:journey-memory",
      defaultPayload: {
        journeyId: "admin-test",
        ownerId: "admin",
        messageId: "message-1",
        text:
          "Es para mis padres, les encanta cocinar y tengo 60 euros.",
      },
    },
    {
      id: "composer-engine",
      name: "Composer Engine",
      description:
        "Construcción de lotes, narrativa, compatibilidad y ranking.",
      category: "Creative",
      mode: "RUNNABLE",
      adminPath:
        "/admin/tools?tool=composer-engine",
      testScript:
        "npm run test:composer-engine",
      defaultPayload: {
        context: {
          journeyId: "admin-test",
          ownerId: "admin",
          interests: ["cooking"],
          budget: 60,
          maxItems: 4,
        },
        candidates: [
          {
            id: "board",
            name: "Tabla grabada",
            price: 25,
            cost: 10,
            stock: 10,
            score: 0.95,
            canonicalInterests: [
              "cooking",
            ],
            bundleRoles: [
              "HERO",
              "CORE",
            ],
            personalizationAvailable:
              true,
          },
          {
            id: "apron",
            name:
              "Delantal personalizado",
            price: 18,
            cost: 7,
            stock: 10,
            score: 0.88,
            canonicalInterests: [
              "cooking",
            ],
            bundleRoles: [
              "COMPLEMENT",
            ],
            personalizationAvailable:
              true,
          },
          {
            id: "card",
            name:
              "Tarjeta con receta familiar",
            price: 5,
            cost: 1,
            stock: 100,
            score: 0.8,
            canonicalInterests: [
              "cooking",
            ],
            bundleRoles: [
              "MESSAGE",
            ],
            personalizationAvailable:
              true,
          },
        ],
      },
    },
    {
      id: "smart-catalog",
      name: "Smart Catalog",
      description:
        "Afinidad, ranking y diagnóstico del catálogo inteligente.",
      category: "Catalog",
      mode: "RUNNABLE",
      adminPath:
        "/admin/tools?tool=smart-catalog",
      testScript:
        "npm run test:smart-catalog",
      defaultPayload: {
        product: {
          canonicalInterests: [
            "cooking",
          ],
          name:
            "Delantal para chef",
          category: "TEXTILE",
          tags: [
            "cocina",
            "barbacoa",
          ],
        },
        interests: ["cooking"],
      },
    },
    {
      id: "catalog-enrichment",
      name:
        "Catalog Interest Enrichment",
      description:
        "Previsualiza intereses canónicos y evidencias de un producto.",
      category: "Catalog",
      mode: "RUNNABLE",
      adminPath:
        "/admin/tools?tool=catalog-enrichment",
      testScript:
        "npm run test:catalog-interest-enrichment",
      defaultPayload: {
        product: {
          id: "sample-product",
          name:
            "Power bank metálico con batería de 5000mAh y USB",
          category:
            "ELECTRONICS",
          tags: [
            "metal",
            "carga",
          ],
        },
      },
    },
    {
      id: "proposal-studio",
      name: "Proposal Studio",
      description: "Bundle Brain, restricciones, narrativa y ranking de propuestas.",
      category: "Creative",
      mode: "NAVIGATION",
      adminPath: "/admin/proposal-studio",
      testScript: "npm run test:composer-v2",
    },
    {
      id: "product-brain-studio",
      name: "Product Brain Studio",
      description:
        "Exploración visual, Rayos X, cobertura y control de calidad del catálogo.",
      category: "Catalog",
      mode: "NAVIGATION",
      adminPath:
        "/admin/product-brain-studio",
      testScript:
        "npm run test:product-brain-studio",
    },
    {
      id: "product-brain",
      name: "Product Brain",
      description:
        "Clasificación estructurada de productos y roles comerciales.",
      category: "Catalog",
      mode: "DIAGNOSTIC",
      adminPath:
        "/admin/catalog-intelligence",
      testScript:
        "npm run test:product-brain",
    },
    {
      id: "experience-api",
      name: "Experience API",
      description:
        "Journey agregado, artefactos, catálogo y siguiente acción.",
      category: "Infrastructure",
      mode: "DIAGNOSTIC",
      adminPath: "/admin/ai-lab",
      testScript:
        "npm run test:experience-api",
    },
    {
      id: "presentation-engine",
      name:
        "Presentation / Mockup Engine",
      description:
        "Plantillas, presentaciones y previsualizaciones de producto.",
      category: "Creative",
      mode: "DIAGNOSTIC",
      adminPath: "/admin/ai-lab",
      testScript:
        "npm run test:presentation-engine",
    },
    {
      id: "image-generation",
      name: "Image Generation",
      description:
        "Tareas, progreso y artefactos de generación visual.",
      category: "Creative",
      mode: "DIAGNOSTIC",
      adminPath: "/admin/ai-lab",
      testScript:
        "npm run test:image-generation",
    },
    {
      id: "purchase-experience",
      name: "Purchase Experience",
      description:
        "Pedidos, intentos de pago e idempotencia.",
      category: "Commerce",
      mode: "DIAGNOSTIC",
      adminPath: "/admin/ai-lab",
      testScript:
        "npm run test:purchase-experience",
    },
    {
      id: "channel-adapters",
      name: "Channel Adapters",
      description:
        "Publicación y sincronización con canales externos.",
      category: "Commerce",
      mode: "DIAGNOSTIC",
      adminPath:
        "/admin/intelligence",
      testScript:
        "npm run test:channel-adapters",
    },
  ] satisfies AdminToolDefinition[]);
