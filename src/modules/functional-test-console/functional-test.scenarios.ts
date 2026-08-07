import { performance } from "node:perf_hooks";
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

import { MOCKUP_FUNCTIONAL_TEST_SCENARIOS } from "./functional-test.mockup-scenarios.js";
interface CheckSpec {
  readonly kind:
    | "equals"
    | "truthy"
    | "includes";
  readonly label: string;
  readonly path: string;
  readonly expected?: unknown;
}

function checksFrom(
  body: unknown,
  statusCode: number,
  specs:
    readonly CheckSpec[],
): readonly FunctionalTestCheck[] {
  const checks:
    FunctionalTestCheck[] =
    [
      equalsCheck(
        "HTTP 200",
        statusCode,
        200,
      ),
    ];

  for (const spec of specs) {
    const actual =
      pathValue(
        body,
        spec.path,
      );

    if (
      spec.kind ===
      "equals"
    ) {
      checks.push(
        equalsCheck(
          spec.label,
          actual,
          spec.expected,
        ),
      );
    } else if (
      spec.kind ===
      "includes"
    ) {
      checks.push(
        includesCheck(
          spec.label,
          actual,
          spec.expected,
        ),
      );
    } else {
      checks.push(
        truthyCheck(
          spec.label,
          actual,
        ),
      );
    }
  }

  return Object.freeze(
    checks,
  );
}

function singlePost(
  definition:
    Omit<
      ScenarioDefinition,
      "execute"
    > & {
      readonly url: string;
      readonly body: unknown;
      readonly checks:
        readonly CheckSpec[];
    },
): ScenarioDefinition {
  return Object.freeze({
    id:
      definition.id,
    group:
      definition.group,
    title:
      definition.title,
    objective:
      definition.objective,
    priority:
      definition.priority,
    tags:
      definition.tags,
    preconditions:
      definition.preconditions,
    execute:
      async (
        app: FastifyInstance,
      ) =>
        Object.freeze([
          await postJson(
            app,
            definition.title,
            definition.url,
            definition.body,
            (
              response,
              statusCode,
            ) =>
              checksFrom(
                response,
                statusCode,
                definition.checks,
              ),
          ),
        ]),
  });
}

const candidates =
  Object.freeze([
    Object.freeze({
      id: "ft-p1",
      name:
        "Termo motocross personalizado",
      category:
        "botellas",
      price: 24,
      stock: 20,
      score: 0.94,
      canonicalInterests:
        Object.freeze([
          "motocross",
        ]),
      personalizationAvailable:
        true,
      marginPercent: 55,
      images:
        Object.freeze([
          "/functional/ft-p1.jpg",
        ]),
    }),
    Object.freeze({
      id: "ft-p2",
      name:
        "Llavero de madera",
      category:
        "llaveros",
      price: 9,
      stock: 50,
      score: 0.82,
      canonicalInterests:
        Object.freeze([
          "wood",
        ]),
      personalizationAvailable:
        true,
      marginPercent: 60,
      images:
        Object.freeze([
          "/functional/ft-p2.jpg",
        ]),
    }),
    Object.freeze({
      id: "ft-p3",
      name:
        "Caja recuerdo",
      category:
        "packaging",
      price: 14,
      stock: 12,
      score: 0.76,
      canonicalInterests:
        Object.freeze([
          "memories",
        ]),
      personalizationAvailable:
        true,
      marginPercent: 48,
      images:
        Object.freeze([
          "/functional/ft-p3.jpg",
        ]),
    }),
  ]);

const intentScenarios:
  readonly ScenarioDefinition[] =
  Object.freeze([
    singlePost({
      id: "INT-001",
      group: "01 · Intent Brain",
      title:
        "Descubrimiento de regalo",
      objective:
        "Detectar que el usuario no sabe qué regalar y mantener el flujo en descubrimiento.",
      priority: "CRITICAL",
      tags:
        Object.freeze([
          "intent",
          "discovery",
        ]),
      preconditions:
        Object.freeze([]),
      url:
        "/api/v1/intent-brain/analyze",
      body: {
        message:
          "No sé qué regalarle a mi padre",
      },
      checks:
        Object.freeze([
          {
            kind: "equals",
            label:
              "Intención DISCOVER_GIFT",
            path:
              "primaryIntent",
            expected:
              "DISCOVER_GIFT",
          },
          {
            kind: "equals",
            label:
              "No genera propuestas",
            path:
              "executionPlan.shouldGenerateProposals",
            expected:
              false,
          },
        ]),
    }),
    singlePost({
      id: "INT-002",
      group: "01 · Intent Brain",
      title:
        "Hacer propuestas explícito",
      objective:
        "Abrir Proposal Gate únicamente cuando el usuario lo pide.",
      priority: "CRITICAL",
      tags:
        Object.freeze([
          "intent",
          "proposal-gate",
        ]),
      preconditions:
        Object.freeze([]),
      url:
        "/api/v1/intent-brain/analyze",
      body: {
        message:
          "Hacer propuestas",
        hasCandidates:
          true,
      },
      checks:
        Object.freeze([
          {
            kind: "equals",
            label:
              "Intención MAKE_PROPOSALS",
            path:
              "primaryIntent",
            expected:
              "MAKE_PROPOSALS",
          },
          {
            kind: "equals",
            label:
              "Proposal Gate abierto",
            path:
              "executionPlan.shouldGenerateProposals",
            expected:
              true,
          },
        ]),
    }),
    singlePost({
      id: "INT-003",
      group: "01 · Intent Brain",
      title:
        "Reinicio explícito",
      objective:
        "Reiniciar el Journey sólo con una petición explícita.",
      priority: "CRITICAL",
      tags:
        Object.freeze([
          "intent",
          "reset",
        ]),
      preconditions:
        Object.freeze([]),
      url:
        "/api/v1/intent-brain/analyze",
      body: {
        message:
          "Empezar de nuevo",
      },
      checks:
        Object.freeze([
          {
            kind: "equals",
            label:
              "Intención RESTART_GIFT",
            path:
              "primaryIntent",
            expected:
              "RESTART_GIFT",
          },
          {
            kind: "equals",
            label:
              "Reset autorizado",
            path:
              "executionPlan.shouldResetJourney",
            expected:
              true,
          },
        ]),
    }),
    singlePost({
      id: "INT-004",
      group: "01 · Intent Brain",
      title:
        "Consulta de precio",
      objective:
        "Detectar una consulta directa de precio sin generar propuestas.",
      priority: "HIGH",
      tags:
        Object.freeze([
          "intent",
          "price",
        ]),
      preconditions:
        Object.freeze([]),
      url:
        "/api/v1/intent-brain/analyze",
      body: {
        message:
          "¿Cuánto cuesta esta taza?",
        hasSelectedProduct:
          true,
      },
      checks:
        Object.freeze([
          {
            kind: "equals",
            label:
              "Intención CHECK_PRICE",
            path:
              "primaryIntent",
            expected:
              "CHECK_PRICE",
          },
          {
            kind: "equals",
            label:
              "Modo UTILITY",
            path:
              "executionPlan.mode",
            expected:
              "UTILITY",
          },
        ]),
    }),
    singlePost({
      id: "INT-005",
      group: "01 · Intent Brain",
      title:
        "Consulta de disponibilidad",
      objective:
        "Detectar una consulta de stock.",
      priority: "HIGH",
      tags:
        Object.freeze([
          "intent",
          "stock",
        ]),
      preconditions:
        Object.freeze([]),
      url:
        "/api/v1/intent-brain/analyze",
      body: {
        message:
          "¿Está disponible esta taza?",
        hasSelectedProduct:
          true,
      },
      checks:
        Object.freeze([
          {
            kind: "equals",
            label:
              "Intención CHECK_AVAILABILITY",
            path:
              "primaryIntent",
            expected:
              "CHECK_AVAILABILITY",
          },
        ]),
    }),
    singlePost({
      id: "INT-006",
      group: "01 · Intent Brain",
      title:
        "Personalización directa",
      objective:
        "Detectar que el usuario ya quiere personalizar un producto.",
      priority: "HIGH",
      tags:
        Object.freeze([
          "intent",
          "personalization",
        ]),
      preconditions:
        Object.freeze([]),
      url:
        "/api/v1/intent-brain/analyze",
      body: {
        message:
          "Quiero una taza con una foto",
        hasSelectedProduct:
          true,
      },
      checks:
        Object.freeze([
          {
            kind: "equals",
            label:
              "Intención PERSONALIZE_PRODUCT",
            path:
              "primaryIntent",
            expected:
              "PERSONALIZE_PRODUCT",
          },
        ]),
    }),
  ]);

const emotionScenarios:
  readonly ScenarioDefinition[] =
  Object.freeze([
    singlePost({
      id: "EMO-001",
      group: "02 · Emotion Brain",
      title:
        "Gratitud",
      objective:
        "Detectar gratitud explícita con confianza alta.",
      priority: "HIGH",
      tags:
        Object.freeze([
          "emotion",
          "gratitude",
        ]),
      preconditions:
        Object.freeze([]),
      url:
        "/api/v1/emotion-brain/analyze",
      body: {
        message:
          "Quiero agradecerle todo lo que ha hecho por mí.",
      },
      checks:
        Object.freeze([
          {
            kind: "equals",
            label:
              "Emoción GRATITUDE",
            path:
              "primaryEmotion",
            expected:
              "GRATITUDE",
          },
          {
            kind: "truthy",
            label:
              "Confidence disponible",
            path:
              "confidence",
          },
        ]),
    }),
    singlePost({
      id: "EMO-002",
      group: "02 · Emotion Brain",
      title:
        "Humor",
      objective:
        "Detectar intención de hacer reír.",
      priority: "HIGH",
      tags:
        Object.freeze([
          "emotion",
          "humor",
        ]),
      preconditions:
        Object.freeze([]),
      url:
        "/api/v1/emotion-brain/analyze",
      body: {
        message:
          "Quiero que se parta de risa.",
      },
      checks:
        Object.freeze([
          {
            kind: "equals",
            label:
              "Emoción HUMOR",
            path:
              "primaryEmotion",
            expected:
              "HUMOR",
          },
        ]),
    }),
    singlePost({
      id: "EMO-003",
      group: "02 · Emotion Brain",
      title:
        "Reconciliación",
      objective:
        "Detectar un regalo vinculado a pedir perdón.",
      priority: "HIGH",
      tags:
        Object.freeze([
          "emotion",
          "reconciliation",
        ]),
      preconditions:
        Object.freeze([]),
      url:
        "/api/v1/emotion-brain/analyze",
      body: {
        message:
          "Quiero pedirle perdón y hacer las paces.",
      },
      checks:
        Object.freeze([
          {
            kind: "equals",
            label:
              "Emoción RECONCILIATION",
            path:
              "primaryEmotion",
            expected:
              "RECONCILIATION",
          },
        ]),
    }),
    singlePost({
      id: "EMO-004",
      group: "02 · Emotion Brain",
      title:
        "Sorpresa",
      objective:
        "Detectar que el objetivo emocional es sorprender.",
      priority: "MEDIUM",
      tags:
        Object.freeze([
          "emotion",
          "surprise",
        ]),
      preconditions:
        Object.freeze([]),
      url:
        "/api/v1/emotion-brain/analyze",
      body: {
        message:
          "Quiero sorprenderlo, que no se lo espere.",
      },
      checks:
        Object.freeze([
          {
            kind: "equals",
            label:
              "Emoción SURPRISE",
            path:
              "primaryEmotion",
            expected:
              "SURPRISE",
          },
        ]),
    }),
  ]);

const interestScenarios:
  readonly ScenarioDefinition[] =
  Object.freeze([
    singlePost({
      id: "INTV2-001",
      group: "03 · Interest Brain V2",
      title:
        "Fútbol canónico",
      objective:
        "Convertir fútbol a la taxonomía canónica football.",
      priority: "HIGH",
      tags:
        Object.freeze([
          "interest",
          "taxonomy",
        ]),
      preconditions:
        Object.freeze([]),
      url:
        "/api/v2/interest-brain/analyze",
      body: {
        message:
          "Le encanta el fútbol.",
      },
      checks:
        Object.freeze([
          {
            kind: "equals",
            label:
              "Principal football",
            path:
              "primaryInterest",
            expected:
              "football",
          },
          {
            kind: "includes",
            label:
              "Incluye football",
            path:
              "canonicalInterests",
            expected:
              "football",
          },
        ]),
    }),
    singlePost({
      id: "INTV2-002",
      group: "03 · Interest Brain V2",
      title:
        "Monte expande intereses",
      objective:
        "Expandir monte a hiking, nature y adventure con pesos menores.",
      priority: "CRITICAL",
      tags:
        Object.freeze([
          "interest",
          "inference",
        ]),
      preconditions:
        Object.freeze([]),
      url:
        "/api/v2/interest-brain/analyze",
      body: {
        message:
          "Le encanta el monte y hacer rutas.",
      },
      checks:
        Object.freeze([
          {
            kind: "includes",
            label:
              "Incluye hiking",
            path:
              "canonicalInterests",
            expected:
              "hiking",
          },
          {
            kind: "includes",
            label:
              "Incluye nature",
            path:
              "canonicalInterests",
            expected:
              "nature",
          },
          {
            kind: "includes",
            label:
              "Incluye adventure",
            path:
              "canonicalInterests",
            expected:
              "adventure",
          },
        ]),
    }),
    singlePost({
      id: "INTV2-003",
      group: "03 · Interest Brain V2",
      title:
        "Madera mantiene prioridad",
      objective:
        "Mantener la afinidad explícita wood por encima de inferencias.",
      priority: "HIGH",
      tags:
        Object.freeze([
          "interest",
          "weight",
        ]),
      preconditions:
        Object.freeze([]),
      url:
        "/api/v2/interest-brain/analyze",
      body: {
        interests:
          Object.freeze([
            "madera",
          ]),
      },
      checks:
        Object.freeze([
          {
            kind: "equals",
            label:
              "Principal wood",
            path:
              "primaryInterest",
            expected:
              "wood",
          },
          {
            kind: "equals",
            label:
              "Primera señal explícita",
            path:
              "signals.0.source",
            expected:
              "EXPLICIT",
          },
        ]),
    }),
    singlePost({
      id: "INTV2-004",
      group: "03 · Interest Brain V2",
      title:
        "Barcos generan mar y navegación",
      objective:
        "Comprobar afinidades secundarias de barcos.",
      priority: "MEDIUM",
      tags:
        Object.freeze([
          "interest",
          "boats",
        ]),
      preconditions:
        Object.freeze([]),
      url:
        "/api/v2/interest-brain/analyze",
      body: {
        message:
          "Le gustan mucho los barcos.",
      },
      checks:
        Object.freeze([
          {
            kind: "includes",
            label:
              "Incluye boats",
            path:
              "canonicalInterests",
            expected:
              "boats",
          },
          {
            kind: "includes",
            label:
              "Incluye sea",
            path:
              "canonicalInterests",
            expected:
              "sea",
          },
        ]),
    }),
  ]);

const conversationScenarios:
  readonly ScenarioDefinition[] =
  Object.freeze([
    singlePost({
      id: "CONV-001",
      group: "04 · Conversation Engine",
      title:
        "Extrae datos de una frase completa",
      objective:
        "Extraer destinatario, ocasión, interés y presupuesto de lenguaje natural.",
      priority: "CRITICAL",
      tags:
        Object.freeze([
          "conversation",
          "extraction",
        ]),
      preconditions:
        Object.freeze([]),
      url:
        "/api/v2/conversation/process-natural",
      body: {
        message:
          "Es para mi padre por su cumpleaños, le encanta el motocross y tengo 70 euros",
      },
      checks:
        Object.freeze([
          {
            kind: "equals",
            label:
              "Queda listo para proponer",
            path:
              "decision.action",
            expected:
              "READY_TO_PROPOSE",
          },
          {
            kind: "equals",
            label:
              "Muestra botón de propuestas",
            path:
              "decision.showProposalButton",
            expected:
              true,
          },
        ]),
    }),
    singlePost({
      id: "CONV-002",
      group: "04 · Conversation Engine",
      title:
        "No genera propuestas automáticamente",
      objective:
        "Confirmar el Proposal Gate con datos mínimos completos.",
      priority: "CRITICAL",
      tags:
        Object.freeze([
          "conversation",
          "proposal-gate",
        ]),
      preconditions:
        Object.freeze([]),
      url:
        "/api/v2/conversation/process-natural",
      body: {
        message:
          "Es para mi padre, por su cumpleaños, le gusta el motocross y tengo 70 euros",
        candidates,
      },
      checks:
        Object.freeze([
          {
            kind: "equals",
            label:
              "READY_TO_PROPOSE",
            path:
              "decision.action",
            expected:
              "READY_TO_PROPOSE",
          },
          {
            kind: "equals",
            label:
              "Orchestrator aún no ejecutado",
            path:
              "orchestrator",
            expected:
              undefined,
          },
        ]),
    }),
    singlePost({
      id: "CONV-003",
      group: "04 · Conversation Engine",
      title:
        "Mis padres resuelve dos destinatarios",
      objective:
        "Inferir recipientLabel y recipientCount=2.",
      priority: "HIGH",
      tags:
        Object.freeze([
          "conversation",
          "recipient",
        ]),
      preconditions:
        Object.freeze([]),
      url:
        "/api/v2/conversation/process-natural",
      body: {
        message:
          "Es para mis padres",
      },
      checks:
        Object.freeze([
          {
            kind: "equals",
            label:
              "Pregunta siguiente es interés",
            path:
              "decision.question.key",
            expected:
              "interests",
          },
        ]),
    }),
    Object.freeze({
      id: "CONV-004",
      group: "04 · Conversation Engine",
      title:
        "Respuesta numérica contextual",
      objective:
        "Interpretar 60 como presupuesto cuando Rai acaba de preguntar presupuesto.",
      priority: "CRITICAL",
      tags:
        Object.freeze([
          "conversation",
          "context",
          "budget",
        ]),
      preconditions:
        Object.freeze([]),
      execute:
        async (
          app: FastifyInstance,
        ): Promise<
          readonly FunctionalTestStepResult[]
        > => {
          const first =
            await postJson(
              app,
              "Crear conversación sin presupuesto",
              "/api/v2/conversation/process-natural",
              {
                message:
                  "Es para mi padre, por su cumpleaños, le gusta el motocross",
              },
              (
                body,
                statusCode,
              ) =>
                checksFrom(
                  body,
                  statusCode,
                  Object.freeze([
                    {
                      kind: "equals",
                      label:
                        "Pregunta presupuesto",
                      path:
                        "decision.question.key",
                      expected:
                        "budget",
                    },
                  ]),
                ),
            );

          const graph =
            pathValue(
              first.responseBody,
              "graph",
            );

          const second =
            await postJson(
              app,
              "Responder sólo 60",
              "/api/v2/conversation/process-natural",
              {
                graph,
                message: "60",
              },
              (
                body,
                statusCode,
              ) =>
                checksFrom(
                  body,
                  statusCode,
                  Object.freeze([
                    {
                      kind: "equals",
                      label:
                        "Ahora está listo para proponer",
                      path:
                        "decision.action",
                      expected:
                        "READY_TO_PROPOSE",
                    },
                    {
                      kind: "equals",
                      label:
                        "Proposal Gate sigue cerrado",
                      path:
                        "extraction.proposalRequested",
                      expected:
                        false,
                    },
                  ]),
                ),
            );

          return Object.freeze([
            first,
            second,
          ]);
        },
    }),
    Object.freeze({
      id: "CONV-005",
      group: "04 · Conversation Engine",
      title:
        "Hacer propuestas abre el gate",
      objective:
        "Mantener el graph y ejecutar propuestas sólo tras la acción explícita.",
      priority: "CRITICAL",
      tags:
        Object.freeze([
          "conversation",
          "proposal-gate",
          "multi-step",
        ]),
      preconditions:
        Object.freeze([]),
      execute:
        async (
          app: FastifyInstance,
        ): Promise<
          readonly FunctionalTestStepResult[]
        > => {
          const first =
            await postJson(
              app,
              "Completar descubrimiento",
              "/api/v2/conversation/process-natural",
              {
                message:
                  "Es para mi padre, por su cumpleaños, le gusta el motocross y tengo 70 euros",
                candidates,
              },
              (
                body,
                statusCode,
              ) =>
                checksFrom(
                  body,
                  statusCode,
                  Object.freeze([
                    {
                      kind: "equals",
                      label:
                        "READY_TO_PROPOSE",
                      path:
                        "decision.action",
                      expected:
                        "READY_TO_PROPOSE",
                    },
                  ]),
                ),
            );

          const graph =
            pathValue(
              first.responseBody,
              "graph",
            );

          const second =
            await postJson(
              app,
              "Pulsar Hacer propuestas",
              "/api/v2/conversation/process-natural",
              {
                graph,
                message:
                  "Hacer propuestas",
                candidates,
              },
              (
                body,
                statusCode,
              ) =>
                checksFrom(
                  body,
                  statusCode,
                  Object.freeze([
                    {
                      kind: "equals",
                      label:
                        "Propuestas generadas",
                      path:
                        "decision.action",
                      expected:
                        "PROPOSALS_READY",
                    },
                    {
                      kind: "equals",
                      label:
                        "Petición explícita detectada",
                      path:
                        "extraction.proposalRequested",
                      expected:
                        true,
                    },
                  ]),
                ),
            );

          return Object.freeze([
            first,
            second,
          ]);
        },
    }),
  ]);

const memoryScenarios:
  readonly ScenarioDefinition[] =
  Object.freeze([
    Object.freeze({
      id: "MEM-001",
      group: "05 · Memory Brain",
      title:
        "Aprender y recuperar perfil",
      objective:
        "Persistir intereses y presupuesto de un destinatario y recuperarlos.",
      priority: "HIGH",
      tags:
        Object.freeze([
          "memory",
          "persistence",
        ]),
      preconditions:
        Object.freeze([
          "Escribe en storage/memory-brain/memories.json",
        ]),
      execute:
        async (
          app: FastifyInstance,
        ): Promise<
          readonly FunctionalTestStepResult[]
        > => {
          const subject =
            `recipient:functional-${Date.now()}`;

          const learn =
            await postJson(
              app,
              "Aprender conversación",
              "/api/v1/memory-brain/learn-conversation",
              {
                conversationId:
                  `functional-${Date.now()}`,
                recipientLabel:
                  subject.replace(
                    "recipient:",
                    "",
                  ),
                budget: 70,
                interests:
                  [
                    "motocross",
                    "madera",
                  ],
              },
              (
                body,
                statusCode,
              ) =>
                Object.freeze([
                  equalsCheck(
                    "HTTP 200",
                    statusCode,
                    200,
                  ),
                  truthyCheck(
                    "Resultados de aprendizaje",
                    pathValue(
                      body,
                      "results",
                    ),
                  ),
                ]),
            );

          const snapshotUrl =
            `/api/v1/memory-brain/snapshot/${encodeURIComponent(subject)}`;

          const started =
            performance.now();

          const response =
            await app.inject({
              method: "GET",
              url:
                snapshotUrl,
            });

          const responseBody =
            JSON.parse(
              response.body,
            ) as unknown;

          const snapshot:
            FunctionalTestStepResult =
            Object.freeze({
              name:
                "Recuperar snapshot",
              method: "GET",
              url:
                snapshotUrl,
              statusCode:
                response.statusCode,
              durationMs:
                performance.now() -
                started,
              responseBody,
              checks:
                Object.freeze([
                  equalsCheck(
                    "HTTP 200",
                    response.statusCode,
                    200,
                  ),
                  equalsCheck(
                    "Subject correcto",
                    pathValue(
                      responseBody,
                      "subjectKey",
                    ),
                    subject,
                  ),
                  includesCheck(
                    "Recuerda motocross",
                    pathValue(
                      responseBody,
                      "summary.interests",
                    ),
                    "motocross",
                  ),
                ]),
            });

          return Object.freeze([
            learn,
            snapshot,
          ]);
        },
    }),
  ]);

const intelligenceScenarios:
  readonly ScenarioDefinition[] =
  Object.freeze([
    singlePost({
      id: "AI-001",
      group: "06 · Intelligence Runtime",
      title:
        "Descubrimiento mantiene Proposal Gate cerrado",
      objective:
        "Intent, Memory y Emotion pueden participar sin generar propuestas.",
      priority: "CRITICAL",
      tags:
        Object.freeze([
          "runtime",
          "proposal-gate",
        ]),
      preconditions:
        Object.freeze([]),
      url:
        "/api/v1/brain-orchestrator/intelligence/run",
      body: {
        conversationMessage:
          "No sé qué regalarle a mi padre",
        recipientLabel:
          "mi padre",
      },
      checks:
        Object.freeze([
          {
            kind: "equals",
            label:
              "Acción ASK",
            path:
              "action",
            expected:
              "ASK",
          },
          {
            kind: "equals",
            label:
              "Modo DISCOVERY",
            path:
              "executionMode",
            expected:
              "DISCOVERY",
          },
        ]),
    }),
    singlePost({
      id: "AI-002",
      group: "06 · Intelligence Runtime",
      title:
        "Pipeline completo de propuestas",
      objective:
        "Ejecutar Intent → Memory → Emotion → Orchestrator y producir propuestas.",
      priority: "CRITICAL",
      tags:
        Object.freeze([
          "runtime",
          "proposal",
          "e2e",
        ]),
      preconditions:
        Object.freeze([]),
      url:
        "/api/v1/brain-orchestrator/intelligence/run",
      body: {
        conversationMessage:
          "Hacer propuestas",
        recipientLabel:
          "mi padre",
        occasion:
          "cumpleaños",
        budget: 70,
        interests:
          [
            "motocross",
            "madera",
          ],
        desiredImpact:
          [
            "sorprender",
          ],
        candidates,
      },
      checks:
        Object.freeze([
          {
            kind: "equals",
            label:
              "PROPOSALS_READY",
            path:
              "action",
            expected:
              "PROPOSALS_READY",
          },
          {
            kind: "includes",
            label:
              "Execution order incluye PROPOSAL",
            path:
              "executionOrder",
            expected:
              "PROPOSAL",
          },
          {
            kind: "truthy",
            label:
              "Orchestrator en contexto",
            path:
              "context.orchestrator",
          },
        ]),
    }),
    singlePost({
      id: "AI-003",
      group: "06 · Intelligence Runtime",
      title:
        "Consulta directa de precio",
      objective:
        "Saltar los Brains innecesarios para una consulta de utilidad.",
      priority: "HIGH",
      tags:
        Object.freeze([
          "runtime",
          "direct-route",
        ]),
      preconditions:
        Object.freeze([]),
      url:
        "/api/v1/brain-orchestrator/intelligence/run",
      body: {
        conversationMessage:
          "¿Cuánto cuesta esta taza?",
        hasSelectedProduct:
          true,
      },
      checks:
        Object.freeze([
          {
            kind: "equals",
            label:
              "Ruta DIRECT",
            path:
              "action",
            expected:
              "DIRECT",
          },
          {
            kind: "includes",
            label:
              "Execution order incluye PRODUCT",
            path:
              "executionOrder",
            expected:
              "PRODUCT",
          },
        ]),
    }),
    singlePost({
      id: "AI-004",
      group: "06 · Intelligence Runtime",
      title:
        "Reinicio protegido",
      objective:
        "Comprobar que sólo la intención explícita produce RESET.",
      priority: "CRITICAL",
      tags:
        Object.freeze([
          "runtime",
          "reset",
        ]),
      preconditions:
        Object.freeze([]),
      url:
        "/api/v1/brain-orchestrator/intelligence/run",
      body: {
        conversationMessage:
          "Empezar de nuevo",
      },
      checks:
        Object.freeze([
          {
            kind: "equals",
            label:
              "Acción RESET",
            path:
              "action",
            expected:
              "RESET",
          },
        ]),
    }),
  ]);

export const FUNCTIONAL_TEST_SCENARIOS:
  readonly ScenarioDefinition[] =
  Object.freeze([
    ...MOCKUP_FUNCTIONAL_TEST_SCENARIOS,
    ...intentScenarios,
    ...emotionScenarios,
    ...interestScenarios,
    ...conversationScenarios,
    ...memoryScenarios,
    ...intelligenceScenarios,
  ]);
