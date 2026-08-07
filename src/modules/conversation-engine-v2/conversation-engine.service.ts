import {
  detectConversationContradictions,
} from "./contradiction-engine.js";
import {
  ingestConversationInput,
} from "./conversation-graph.js";
import {
  planConversationQuestions,
} from "./question-planner.js";
import type {
  ConversationEngineInput,
  ConversationEngineResult,
  ConversationFact,
  ConversationGraph,
} from "./conversation-engine.types.js";

type ConversationTrace =
  ConversationEngineResult["traces"][number];

function factValue(
  facts:
    readonly ConversationFact[],
  key:
    ConversationFact["key"],
): unknown {
  return facts.find(
    (fact) =>
      fact.key === key,
  )?.value;
}

function graphWithDerivedState(
  graph: ConversationGraph,
): ConversationGraph {
  const contradictions =
    detectConversationContradictions(
      graph.facts,
    );

  const pendingQuestions =
    planConversationQuestions(
      graph.facts,
    );

  return Object.freeze({
    ...graph,
    contradictions,
    pendingQuestions,
  });
}

function readyForProposals(
  graph: ConversationGraph,
): boolean {
  const recipient =
    factValue(
      graph.facts,
      "recipientLabel",
    );

  const occasion =
    factValue(
      graph.facts,
      "occasion",
    );

  const budget =
    factValue(
      graph.facts,
      "budget",
    );

  const interests =
    factValue(
      graph.facts,
      "interests",
    );

  return Boolean(
    recipient &&
    occasion &&
    typeof budget === "number" &&
    Array.isArray(interests) &&
    interests.length > 0 &&
    graph.contradictions.length === 0,
  );
}

function confidenceFromGraph(
  graph: ConversationGraph,
): number {
  const requiredKeys =
    [
      "recipientLabel",
      "occasion",
      "budget",
      "interests",
    ] as const;

  const known =
    requiredKeys.filter(
      (key) =>
        graph.facts.some(
          (fact) =>
            fact.key === key,
        ),
    ).length;

  const base =
    known /
    requiredKeys.length;

  const contradictionPenalty =
    Math.min(
      0.35,
      graph.contradictions.length *
        0.12,
    );

  return Math.max(
    0.2,
    Math.min(
      0.99,
      0.45 +
      base * 0.5 -
      contradictionPenalty,
    ),
  );
}

function orchestratorInputFromGraph(
  graph: ConversationGraph,
  input: ConversationEngineInput,
): Record<string, unknown> {
  const value = (
    key:
      ConversationFact["key"],
  ) =>
    factValue(
      graph.facts,
      key,
    );

  return {
    conversationId:
      graph.conversationId,
    recipientLabel:
      value(
        "recipientLabel",
      ),
    relationship:
      value(
        "relationship",
      ),
    occasion:
      value(
        "occasion",
      ),
    age:
      value("age"),
    budget:
      value("budget"),
    recipientCount:
      value(
        "recipientCount",
      ),
    interests:
      value("interests"),
    personality:
      value(
        "personality",
      ),
    desiredImpact:
      value(
        "desiredImpact",
      ),
    candidates:
      input.candidates ??
      [],
    autoCompose:
      input.autoCompose ===
      true,
  };
}

async function runOrchestrator(
  graph: ConversationGraph,
  input: ConversationEngineInput,
): Promise<unknown> {
  const payload =
    orchestratorInputFromGraph(
      graph,
      input,
    );

  const module =
    await import(
      "../brain-orchestrator/brain-orchestrator-runtime.service.js"
    );

  return module
    .defaultBrainOrchestratorRuntime
    .run(
      payload as never,
    );
}

function appendTrace(
  traces: readonly ConversationTrace[],
  trace: ConversationTrace,
): readonly ConversationTrace[] {
  return Object.freeze([
    ...traces,
    trace,
  ]);
}

export class ConversationEngineV2Service {
  async process(
    input: ConversationEngineInput,
  ): Promise<ConversationEngineResult> {
    const traces:
      ConversationTrace[] =
      [];

    const ingested =
      ingestConversationInput(
        input,
      );

    traces.push({
      phase: "INGEST",
      message:
        "Mensaje y hechos incorporados al Conversation Graph.",
      data:
        ingested.newNode,
    });

    let graph =
      graphWithDerivedState(
        ingested.graph,
      );

    traces.push({
      phase: "FACTS",
      message:
        `${graph.facts.length} hechos activos en la conversación.`,
      data:
        graph.facts,
    });

    traces.push({
      phase:
        "CONTRADICTIONS",
      message:
        graph.contradictions.length
          ? `${graph.contradictions.length} contradicciones detectadas.`
          : "No se detectaron contradicciones.",
      data:
        graph.contradictions,
    });

    traces.push({
      phase: "QUESTIONS",
      message:
        `${graph.pendingQuestions.length} preguntas potenciales ordenadas por prioridad.`,
      data:
        graph.pendingQuestions,
    });

    const confidence =
      confidenceFromGraph(
        graph,
      );

    const contradiction =
      graph.contradictions[0];

    if (contradiction) {
      const responseTrace:
        ConversationTrace = {
          phase:
            "RESPONSE",
          message:
            "Se prioriza resolver la contradicción antes de continuar.",
        };

      return Object.freeze({
        generatedAt:
          new Date().toISOString(),
        graph,
        decision:
          Object.freeze({
            action:
              "RESOLVE_CONTRADICTION",
            text:
              contradiction.question,
            confidence,
            reason:
              contradiction.summary,
          }),
        traces:
          appendTrace(
            traces,
            responseTrace,
          ),
      });
    }

    if (
      !readyForProposals(
        graph,
      )
    ) {
      const question =
        graph.pendingQuestions.find(
          (item) =>
            item.required,
        ) ??
        graph.pendingQuestions[0];

      const responseTrace:
        ConversationTrace = {
          phase:
            "RESPONSE",
          message:
            question
              ? `Pregunta seleccionada: ${question.key}.`
              : "Se solicita más contexto.",
        };

      return Object.freeze({
        generatedAt:
          new Date().toISOString(),
        graph,
        decision:
          Object.freeze({
            action: "ASK",
            text:
              question?.question ??
              "Cuéntame un poco más sobre la persona.",
            confidence,
            reason:
              question?.reason ??
              "Falta información para afinar la propuesta.",
            ...(question
              ? {
                  question,
                }
              : {}),
          }),
        traces:
          appendTrace(
            traces,
            responseTrace,
          ),
      });
    }

    const orchestrator =
      await runOrchestrator(
        graph,
        input,
      );

    traces.push({
      phase:
        "ORCHESTRATOR",
      message:
        "Brain Orchestrator ejecutado con el contexto de conversación.",
      data:
        orchestrator,
    });

    const orchestratorRecord =
      orchestrator &&
      typeof orchestrator ===
        "object"
        ? orchestrator as
            Readonly<Record<string, unknown>>
        : {};

    const decisionRecord =
      orchestratorRecord
        .decision &&
      typeof orchestratorRecord
        .decision ===
        "object"
        ? orchestratorRecord
            .decision as
              Readonly<Record<string, unknown>>
        : {};

    const action =
      typeof decisionRecord
        .action ===
        "string"
        ? decisionRecord
            .action
        : "READY_FOR_PROPOSALS";

    const text =
      action ===
      "PROPOSALS_READY"
        ? "Ya tengo propuestas preparadas para ti."
        : action ===
          "COMPOSED"
          ? "Ya tengo una propuesta completa preparada."
          : "Ya tengo suficiente información para hacer propuestas.";

    const raiNodeId =
      `node-rai-${Date.now().toString(36)}`;

    graph =
      Object.freeze({
        ...graph,
        nodes:
          Object.freeze([
            ...graph.nodes,
            Object.freeze({
              id:
                raiNodeId,
              parentId:
                graph.activeNodeId,
              kind:
                action ===
                "PROPOSALS_READY"
                  ? "PROPOSAL"
                  : "DECISION",
              createdAt:
                new Date().toISOString(),
              text,
              metadata:
                Object.freeze({
                  orchestratorAction:
                    action,
                }),
            }),
          ]),
        activeNodeId:
          raiNodeId,
        version:
          graph.version + 1,
      });

    const finalAction:
      ConversationEngineResult["decision"]["action"] =
      action ===
      "COMPOSED"
        ? "COMPOSED"
        : action ===
          "PROPOSALS_READY"
          ? "PROPOSALS_READY"
          : "READY_FOR_PROPOSALS";

    const responseTrace:
      ConversationTrace = {
        phase:
          "RESPONSE",
        message:
          `Respuesta preparada con acción ${finalAction}.`,
      };

    return Object.freeze({
      generatedAt:
        new Date().toISOString(),
      graph,
      decision:
        Object.freeze({
          action:
            finalAction,
          text,
          confidence:
            typeof decisionRecord
              .confidence ===
              "number"
              ? decisionRecord
                  .confidence
              : confidence,
          reason:
            typeof decisionRecord
              .reason ===
              "string"
              ? decisionRecord
                  .reason
              : "La conversación contiene los datos mínimos necesarios.",
        }),
      orchestrator,
      traces:
        appendTrace(
          traces,
          responseTrace,
        ),
    });
  }
}

export const
  defaultConversationEngineV2 =
    new ConversationEngineV2Service();
