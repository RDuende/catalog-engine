import type {
  FastifyInstance,
} from "fastify";

import {
  equalsCheck,
  includesCheck,
  pathValue,
  postJson,
  truthyCheck,
  type ScenarioDefinition,
} from "./functional-test.runner.js";
import type {
  FunctionalTestCheck,
  FunctionalTestStepResult,
} from "./functional-test.types.js";

interface MockupCapabilities {
  readonly imageGenerationEndpoint?: string;
  readonly mockupEndpoint?: string;
  readonly finalGiftImageEndpoint?: string;
}

function capabilities():
  MockupCapabilities {
  return Object.freeze({
    ...(process.env.RECUERDARTE_IMAGE_GENERATION_TEST_ENDPOINT
      ? {
          imageGenerationEndpoint:
            process.env.RECUERDARTE_IMAGE_GENERATION_TEST_ENDPOINT,
        }
      : {}),
    ...(process.env.RECUERDARTE_MOCKUP_TEST_ENDPOINT
      ? {
          mockupEndpoint:
            process.env.RECUERDARTE_MOCKUP_TEST_ENDPOINT,
        }
      : {}),
    ...(process.env.RECUERDARTE_FINAL_GIFT_IMAGE_TEST_ENDPOINT
      ? {
          finalGiftImageEndpoint:
            process.env.RECUERDARTE_FINAL_GIFT_IMAGE_TEST_ENDPOINT,
        }
      : {}),
  });
}

function statusCheck(
  label: string,
  value: boolean,
  detail?: string,
): FunctionalTestCheck {
  return Object.freeze({
    label,
    pass: value,
    expected: true,
    actual: value,
    ...(detail
      ? { detail }
      : {}),
  });
}

function visualRouteCheck(
  label: string,
  endpoint: string | undefined,
): FunctionalTestCheck {
  return statusCheck(
    label,
    Boolean(endpoint),
    endpoint
      ? `Configurado: ${endpoint}`
      : "Pendiente: configura la variable de entorno correspondiente para ejecutar la generación real.",
  );
}

async function runConfiguredPost(
  app: FastifyInstance,
  name: string,
  endpoint: string | undefined,
  payload: unknown,
): Promise<FunctionalTestStepResult> {
  if (!endpoint) {
    return Object.freeze({
      name,
      method: "POST",
      url: "(sin endpoint configurado)",
      statusCode: 0,
      durationMs: 0,
      requestBody: payload,
      responseBody: Object.freeze({
        integrationStatus:
          "PENDING_CONFIGURATION",
      }),
      checks: Object.freeze([
        statusCheck(
          "Endpoint real configurado",
          false,
          "Define la variable de entorno para conectar este escenario al pipeline real.",
        ),
      ]),
    });
  }

  return postJson(
    app,
    name,
    endpoint,
    payload,
    (body, statusCode) =>
      Object.freeze([
        equalsCheck(
          "HTTP 200",
          statusCode,
          200,
        ),
        truthyCheck(
          "Existe respuesta",
          body,
        ),
      ]),
  );
}

function baseGiftPayload(
  overrides:
    Readonly<Record<string, unknown>> = {},
): Readonly<Record<string, unknown>> {
  return Object.freeze({
    conversationMessage:
      "Hacer propuestas",
    recipientLabel:
      "mi padre",
    occasion:
      "cumpleaños",
    budget: 90,
    interests:
      Object.freeze([
        "motocross",
        "madera",
      ]),
    desiredImpact:
      Object.freeze([
        "emocionar",
      ]),
    candidates:
      Object.freeze([
        Object.freeze({
          id: "mock-p1",
          name:
            "Termo motocross personalizado",
          category:
            "botellas",
          price: 31.5,
          stock: 20,
          score: 0.95,
          canonicalInterests:
            Object.freeze([
              "motocross",
            ]),
          personalizationAvailable:
            true,
          imageUrl:
            "/functional/mock-p1.jpg",
        }),
        Object.freeze({
          id: "mock-p2",
          name:
            "Llavero de madera personalizado",
          category:
            "llaveros",
          price: 9.9,
          stock: 50,
          score: 0.86,
          canonicalInterests:
            Object.freeze([
              "wood",
            ]),
          personalizationAvailable:
            true,
          imageUrl:
            "/functional/mock-p2.jpg",
        }),
        Object.freeze({
          id: "mock-p3",
          name:
            "Caja regalo personalizada",
          category:
            "packaging",
          price: 18,
          stock: 12,
          score: 0.8,
          canonicalInterests:
            Object.freeze([
              "memories",
            ]),
          personalizationAvailable:
            true,
          imageUrl:
            "/functional/mock-p3.jpg",
        }),
      ]),
    ...overrides,
  });
}

async function proposalStep(
  app: FastifyInstance,
  payload:
    Readonly<Record<string, unknown>>,
): Promise<FunctionalTestStepResult> {
  return postJson(
    app,
    "Generar propuesta base",
    "/api/v1/brain-orchestrator/intelligence/run",
    payload,
    (body, statusCode) =>
      Object.freeze([
        equalsCheck(
          "HTTP 200",
          statusCode,
          200,
        ),
        equalsCheck(
          "Propuestas generadas",
          pathValue(
            body,
            "action",
          ),
          "PROPOSALS_READY",
        ),
        truthyCheck(
          "Orchestrator disponible",
          pathValue(
            body,
            "context.orchestrator",
          ),
        ),
      ]),
  );
}

async function fullMockupScenario(
  app: FastifyInstance,
  id: string,
  personalization:
    Readonly<Record<string, unknown>>,
  options: {
    readonly requireImageGeneration?: boolean;
    readonly requireFinalGiftImage?: boolean;
  } = {},
): Promise<
  readonly FunctionalTestStepResult[]
> {
  const caps =
    capabilities();

  const proposal =
    await proposalStep(
      app,
      baseGiftPayload(),
    );

  const visualInput =
    Object.freeze({
      scenarioId: id,
      proposal:
        proposal.responseBody,
      personalization,
    });

  const steps:
    FunctionalTestStepResult[] =
    [proposal];

  if (
    options.requireImageGeneration
  ) {
    steps.push(
      await runConfiguredPost(
        app,
        "Generar diseño de personalización",
        caps.imageGenerationEndpoint,
        visualInput,
      ),
    );
  }

  steps.push(
    await runConfiguredPost(
      app,
      "Generar mockup del producto personalizado",
      caps.mockupEndpoint,
      visualInput,
    ),
  );

  if (
    options.requireFinalGiftImage
  ) {
    steps.push(
      await runConfiguredPost(
        app,
        "Generar imagen final del regalo/lote",
        caps.finalGiftImageEndpoint,
        visualInput,
      ),
    );
  }

  return Object.freeze(
    steps,
  );
}

export const MOCKUP_FUNCTIONAL_TEST_SCENARIOS:
  readonly ScenarioDefinition[] =
  Object.freeze([
    {
      id: "MOCK-001",
      group:
        "07 · Personalización + Mockup E2E",
      title:
        "Producto único con foto",
      objective:
        "Desde una personalización con fotografía hasta el mockup final del producto.",
      priority: "CRITICAL",
      tags:
        Object.freeze([
          "mockup",
          "photo",
          "e2e",
        ]),
      preconditions:
        Object.freeze([
          "Configurar RECUERDARTE_MOCKUP_TEST_ENDPOINT para generación real.",
          "El payload usa una imagen de prueba referenciada, no una foto personal real.",
        ]),
      execute:
        async (app) =>
          fullMockupScenario(
            app,
            "MOCK-001",
            {
              type: "PHOTO",
              sourceImageUrl:
                "/functional/customer-photo.jpg",
              instruction:
                "Aplicar la fotografía respetando el área imprimible.",
            },
          ),
    },
    {
      id: "MOCK-002",
      group:
        "07 · Personalización + Mockup E2E",
      title:
        "Producto único con texto",
      objective:
        "Componer una personalización tipográfica y visualizarla sobre el producto.",
      priority: "CRITICAL",
      tags:
        Object.freeze([
          "mockup",
          "text",
        ]),
      preconditions:
        Object.freeze([
          "Configurar RECUERDARTE_MOCKUP_TEST_ENDPOINT.",
        ]),
      execute:
        async (app) =>
          fullMockupScenario(
            app,
            "MOCK-002",
            {
              type: "TEXT",
              text:
                "La mejor abuela del mundo",
              instruction:
                "Composición centrada, legible y dentro de márgenes.",
            },
          ),
    },
    {
      id: "MOCK-003",
      group:
        "07 · Personalización + Mockup E2E",
      title:
        "Imagen generada por Rai + mockup",
      objective:
        "Generar un diseño temático con IA y aplicarlo al producto seleccionado.",
      priority: "CRITICAL",
      tags:
        Object.freeze([
          "image-generation",
          "mockup",
          "ai",
        ]),
      preconditions:
        Object.freeze([
          "Usa las rutas reales de Rai, Image Generation y Task Manager.",
          "No requiere RECUERDARTE_IMAGE_GENERATION_TEST_ENDPOINT ni RECUERDARTE_MOCKUP_TEST_ENDPOINT.",
        ]),
      execute:
        async (app) =>
          fullMockupScenario(
            app,
            "MOCK-003",
            {
              type:
                "AI_GENERATED_DESIGN",
              prompt:
                "Diseño emocional de motocross para un padre, elegante y no infantil.",
            },
            {
              requireImageGeneration:
                true,
            },
          ),
    },
    {
      id: "MOCK-004",
      group:
        "07 · Personalización + Mockup E2E",
      title:
        "Foto + texto combinados",
      objective:
        "Combinar una fotografía con dedicatoria y generar un mockup coherente.",
      priority: "HIGH",
      tags:
        Object.freeze([
          "photo",
          "text",
          "composition",
        ]),
      preconditions:
        Object.freeze([
          "Configurar endpoint de mockup.",
        ]),
      execute:
        async (app) =>
          fullMockupScenario(
            app,
            "MOCK-004",
            {
              type:
                "PHOTO_AND_TEXT",
              sourceImageUrl:
                "/functional/customer-photo.jpg",
              text:
                "Gracias por todos nuestros caminos juntos",
            },
          ),
    },
    {
      id: "MOCK-005",
      group:
        "07 · Personalización + Mockup E2E",
      title:
        "Modificar el primer mockup",
      objective:
        "Crear una segunda versión sin perder producto, propuesta ni Journey.",
      priority: "CRITICAL",
      tags:
        Object.freeze([
          "mockup",
          "revision",
          "versioning",
        ]),
      preconditions:
        Object.freeze([
          "Configurar endpoint de mockup.",
        ]),
      execute:
        async (app) => {
          const caps =
            capabilities();

          const proposal =
            await proposalStep(
              app,
              baseGiftPayload(),
            );

          const first =
            await runConfiguredPost(
              app,
              "Mockup V1",
              caps.mockupEndpoint,
              {
                scenarioId:
                  "MOCK-005",
                version: 1,
                proposal:
                  proposal.responseBody,
                personalization: {
                  text:
                    "Papá, siempre contigo",
                },
              },
            );

          const second =
            await runConfiguredPost(
              app,
              "Mockup V2: texto menor y foto más arriba",
              caps.mockupEndpoint,
              {
                scenarioId:
                  "MOCK-005",
                version: 2,
                previous:
                  first.responseBody,
                proposal:
                  proposal.responseBody,
                changes: {
                  textScale:
                    "SMALLER",
                  imagePosition:
                    "UP",
                },
              },
            );

          return Object.freeze([
            proposal,
            first,
            second,
          ]);
        },
    },
    {
      id: "MOCK-006",
      group:
        "07 · Personalización + Mockup E2E",
      title:
        "Cambiar producto manteniendo diseño",
      objective:
        "Reutilizar el diseño aprobado al cambiar de soporte.",
      priority: "HIGH",
      tags:
        Object.freeze([
          "mockup",
          "product-change",
        ]),
      preconditions:
        Object.freeze([
          "Configurar endpoint de mockup.",
        ]),
      execute:
        async (app) =>
          fullMockupScenario(
            app,
            "MOCK-006",
            {
              type:
                "REUSE_DESIGN",
              previousDesignId:
                "functional-design-v1",
              targetProduct:
                "sudadera",
            },
          ),
    },
    {
      id: "MOCK-007",
      group:
        "07 · Personalización + Mockup E2E",
      title:
        "Lote personalizado completo",
      objective:
        "Generar visuales individuales y una imagen final conjunta del lote.",
      priority: "CRITICAL",
      tags:
        Object.freeze([
          "bundle",
          "mockup",
          "final-image",
        ]),
      preconditions:
        Object.freeze([
          "Configurar endpoint de mockup.",
          "Configurar RECUERDARTE_FINAL_GIFT_IMAGE_TEST_ENDPOINT.",
        ]),
      execute:
        async (app) =>
          fullMockupScenario(
            app,
            "MOCK-007",
            {
              type:
                "BUNDLE_PERSONALIZATION",
              instruction:
                "Personalizar termo, llavero y caja con identidad visual común.",
            },
            {
              requireFinalGiftImage:
                true,
            },
          ),
    },
    {
      id: "MOCK-008",
      group:
        "07 · Personalización + Mockup E2E",
      title:
        "Presupuesto objetivo + lote",
      objective:
        "Construir un lote cercano al precio objetivo y visualizar el conjunto final.",
      priority: "CRITICAL",
      tags:
        Object.freeze([
          "budget",
          "bundle",
          "mockup",
        ]),
      preconditions:
        Object.freeze([
          "Objetivo de prueba: 90 €.",
          "Rango ideal de revisión: 81–99 €.",
          "Configurar endpoint de mockup e imagen final.",
        ]),
      execute:
        async (app) =>
          fullMockupScenario(
            app,
            "MOCK-008",
            {
              type:
                "BUNDLE_PERSONALIZATION",
              budgetIntent: {
                type:
                  "TARGET",
                target:
                  90,
                idealMin:
                  81,
                idealMax:
                  99,
                acceptableMin:
                  63,
                acceptableMax:
                  108,
              },
            },
            {
              requireFinalGiftImage:
                true,
            },
          ),
    },
    {
      id: "MOCK-009",
      group:
        "07 · Personalización + Mockup E2E",
      title:
        "Bono de personalización",
      objective:
        "Representar correctamente un regalo cuyo destinatario personalizará después.",
      priority: "HIGH",
      tags:
        Object.freeze([
          "voucher",
          "personalization-right",
        ]),
      preconditions:
        Object.freeze([
          "No debe inventarse una personalización final que todavía no existe.",
          "Configurar endpoint de imagen final si se quiere visualizar el bono.",
        ]),
      execute:
        async (app) => {
          const caps =
            capabilities();

          const proposal =
            await proposalStep(
              app,
              baseGiftPayload({
                conversationMessage:
                  "Quiero regalar dos camisetas para que él las personalice después",
              }),
            );

          const voucher =
            await runConfiguredPost(
              app,
              "Generar representación visual del bono",
              caps.finalGiftImageEndpoint,
              {
                scenarioId:
                  "MOCK-009",
                proposal:
                  proposal.responseBody,
                personalizationMode:
                  "RECIPIENT_WILL_CUSTOMIZE",
                quantity: 2,
              },
            );

          return Object.freeze([
            proposal,
            voucher,
          ]);
        },
    },
    {
      id: "MOCK-010",
      group:
        "07 · Personalización + Mockup E2E",
      title:
        "Fallo recuperable de generación",
      objective:
        "Validar que un error visual no reinicia el Journey ni destruye la propuesta.",
      priority: "CRITICAL",
      tags:
        Object.freeze([
          "mockup",
          "failure",
          "resilience",
        ]),
      preconditions:
        Object.freeze([
          "El endpoint de mockup debe admitir un modo de fallo de prueba o devolver un error controlado.",
        ]),
      execute:
        async (app) => {
          const caps =
            capabilities();

          const proposal =
            await proposalStep(
              app,
              baseGiftPayload(),
            );

          const failure =
            await runConfiguredPost(
              app,
              "Intentar generación con fallo simulado",
              caps.mockupEndpoint,
              {
                scenarioId:
                  "MOCK-010",
                proposal:
                  proposal.responseBody,
                simulateFailure:
                  true,
              },
            );

          return Object.freeze([
            proposal,
            Object.freeze({
              ...failure,
              checks:
                Object.freeze([
                  ...failure.checks,
                  truthyCheck(
                    "La propuesta previa sigue disponible",
                    proposal.responseBody,
                  ),
                ]),
            }),
          ]);
        },
    },
    {
      id:
        "MOCK-E2E-001",
      group:
        "07 · Personalización + Mockup E2E",
      title:
        "Recorrido completo RecuerdArte",
      objective:
        "Validar de extremo a extremo conversación, intención, emoción, intereses, propuesta, personalización, mockup e imagen final del regalo.",
      priority: "CRITICAL",
      tags:
        Object.freeze([
          "full-e2e",
          "mockup",
          "final-gift",
        ]),
      preconditions:
        Object.freeze([
          "Configurar los tres endpoints visuales para completar el recorrido real.",
        ]),
      execute:
        async (app) => {
          const caps =
            capabilities();

          const conversation =
            await postJson(
              app,
              "Interpretar petición completa",
              "/api/v2/conversation/process-natural",
              {
                message:
                  "Quiero un regalo para mi padre por su 60 cumpleaños. Le encanta el motocross y la madera. Quiero gastarme unos 90 euros. Me gustaría emocionarlo.",
              },
              (body, statusCode) =>
                Object.freeze([
                  equalsCheck(
                    "HTTP 200",
                    statusCode,
                    200,
                  ),
                  truthyCheck(
                    "Conversation Graph disponible",
                    pathValue(
                      body,
                      "graph",
                    ),
                  ),
                ]),
            );

          const proposal =
            await proposalStep(
              app,
              baseGiftPayload({
                recipientLabel:
                  "mi padre",
                occasion:
                  "60 cumpleaños",
                budget: 90,
                interests:
                  Object.freeze([
                    "motocross",
                    "madera",
                  ]),
                desiredImpact:
                  Object.freeze([
                    "emocionar",
                  ]),
              }),
            );

          const design =
            await runConfiguredPost(
              app,
              "Generar diseño emocional",
              caps.imageGenerationEndpoint,
              {
                scenarioId:
                  "MOCK-E2E-001",
                conversation:
                  conversation.responseBody,
                proposal:
                  proposal.responseBody,
                inputAssets:
                  Object.freeze([
                    "/functional/customer-photo.jpg",
                  ]),
                instruction:
                  "Crear un diseño emocional basado en motocross, madera y recuerdos padre-hijo.",
              },
            );

          const mockup =
            await runConfiguredPost(
              app,
              "Aplicar diseño al regalo",
              caps.mockupEndpoint,
              {
                scenarioId:
                  "MOCK-E2E-001",
                proposal:
                  proposal.responseBody,
                design:
                  design.responseBody,
              },
            );

          const finalGift =
            await runConfiguredPost(
              app,
              "Crear imagen final del regalo personalizado",
              caps.finalGiftImageEndpoint,
              {
                scenarioId:
                  "MOCK-E2E-001",
                proposal:
                  proposal.responseBody,
                mockup:
                  mockup.responseBody,
              },
            );

          return Object.freeze([
            conversation,
            proposal,
            design,
            mockup,
            finalGift,
          ]);
        },
    },
  ]);
