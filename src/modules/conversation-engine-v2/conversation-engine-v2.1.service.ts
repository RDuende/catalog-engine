import {
  detectConversationContradictions,
} from "./contradiction-engine.js";
import {
  createConversationGraph,
  ingestConversationInput,
} from "./conversation-graph.js";
import {
  mergeExtractedFacts,
} from "./conversation-fact-merge.js";
import {
  planConversationQuestions,
} from "./question-planner.js";
import {
  extractConversationUtterance,
} from "./utterance-extractor.js";
import type {
  ConversationEngineInput,
  ConversationEngineResult,
  ConversationFact,
  ConversationGraph,
  ConversationNode,
  ConversationQuestionPlan,
} from "./conversation-engine.types.js";

export interface ConversationEngineV21Decision {
  readonly action:
    | "ASK"
    | "RESOLVE_CONTRADICTION"
    | "READY_TO_PROPOSE"
    | "PROPOSALS_READY"
    | "COMPOSED";
  readonly text: string;
  readonly confidence: number;
  readonly reason: string;
  readonly question?: ConversationQuestionPlan;
  readonly showProposalButton: boolean;
}

export interface ConversationEngineV21Result
  extends Omit<
    ConversationEngineResult,
    "decision"
  > {
  readonly decision:
    ConversationEngineV21Decision;
  readonly extraction: {
    readonly facts:
      ReturnType<
        typeof extractConversationUtterance
      >["facts"];
    readonly proposalRequested: boolean;
    readonly diagnostics:
      readonly string[];
  };
}

type Trace =
  ConversationEngineResult["traces"][number];

function factValue(
  graph: ConversationGraph,
  key: ConversationFact["key"],
): unknown {
  return graph.facts.find(
    (fact) =>
      fact.key === key,
  )?.value;
}

function requiredComplete(
  graph: ConversationGraph,
): boolean {
  const recipient =
    factValue(
      graph,
      "recipientLabel",
    );

  const occasion =
    factValue(
      graph,
      "occasion",
    );

  const budget =
    factValue(
      graph,
      "budget",
    );

  const interests =
    factValue(
      graph,
      "interests",
    );

  return Boolean(
    recipient &&
    occasion &&
    typeof budget ===
      "number" &&
    Array.isArray(interests) &&
    interests.length > 0,
  );
}

function confidence(
  graph: ConversationGraph,
): number {
  const required =
    [
      "recipientLabel",
      "occasion",
      "budget",
      "interests",
    ] as const;

  const known =
    required.filter(
      (key) =>
        graph.facts.some(
          (fact) =>
            fact.key === key,
        ),
    ).length;

  const base =
    0.4 +
    (
      known /
      required.length
    ) * 0.5;

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
      base -
        contradictionPenalty,
    ),
  );
}

function derivedGraph(
  graph: ConversationGraph,
): ConversationGraph {
  return Object.freeze({
    ...graph,
    contradictions:
      detectConversationContradictions(
        graph.facts,
      ),
    pendingQuestions:
      planConversationQuestions(
        graph.facts,
      ),
  });
}

function appendRaiNode(
  graph: ConversationGraph,
  text: string,
  kind:
    ConversationNode["kind"],
  metadata?:
    Readonly<Record<string, unknown>>,
): ConversationGraph {
  const id =
    `node-rai-${Date.now().toString(36)}-${graph.version}`;

  const node:
    ConversationNode =
    Object.freeze({
      id,
      parentId:
        graph.activeNodeId,
      kind,
      createdAt:
        new Date().toISOString(),
      text,
      ...(metadata
        ? { metadata }
        : {}),
    });

  return Object.freeze({
    ...graph,
    activeNodeId: id,
    nodes:
      Object.freeze([
        ...graph.nodes,
        node,
      ]),
    version:
      graph.version + 1,
  });
}

function orchestratorPayload(
  graph: ConversationGraph,
  input: ConversationEngineInput,
): Record<string, unknown> {
  const value = (
    key: ConversationFact["key"],
  ) =>
    factValue(
      graph,
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
      value(
        "age",
      ),
    budget:
      value(
        "budget",
      ),
    recipientCount:
      value(
        "recipientCount",
      ),
    interests:
      value(
        "interests",
      ),
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
  const module =
    await import(
      "../brain-orchestrator/brain-orchestrator-runtime.service.js"
    );

  return module
    .defaultBrainOrchestratorRuntime
    .run(
      orchestratorPayload(
        graph,
        input,
      ) as never,
    );
}

function questionFor(
  graph: ConversationGraph,
): ConversationQuestionPlan | undefined {
  return graph.pendingQuestions.find(
    (question) =>
      question.required,
  ) ??
  graph.pendingQuestions[0];
}

export class ConversationEngineV21Service {
  async process(
    input: ConversationEngineInput,
  ): Promise<ConversationEngineV21Result> {
    const traces:
      Trace[] = [];

    let base =
      input.graph ??
      createConversationGraph(
        input.conversationId,
      );

    const extraction =
      input.message
        ? extractConversationUtterance(
            input.message,
            base,
          )
        : Object.freeze({
            normalizedText: "",
            facts:
              Object.freeze([]),
            proposalRequested:
              false,
            resetRequested:
              false,
            diagnostics:
              Object.freeze([]),
          });

    if (
      extraction.resetRequested
    ) {
      base =
        createConversationGraph(
          input.conversationId,
        );
    }

    const explicitFacts =
      input.facts ?? {};

    const ingested =
      ingestConversationInput({
        ...input,
        graph: base,
        facts:
          explicitFacts,
      });

    traces.push({
      phase: "INGEST",
      message:
        extraction.resetRequested
          ? "Conversación reiniciada por petición explícita."
          : "Turno incorporado al Conversation Graph.",
      data:
        ingested.newNode,
    });

    let graph =
      mergeExtractedFacts(
        ingested.graph,
        extraction.facts,
        ingested.newNode?.id,
      );

    graph =
      derivedGraph(graph);

    traces.push({
      phase: "FACTS",
      message:
        `${extraction.facts.length} hechos extraídos automáticamente; ${graph.facts.length} hechos activos.`,
      data:
        Object.freeze({
          extraction:
            extraction.facts,
          facts:
            graph.facts,
          diagnostics:
            extraction.diagnostics,
        }),
    });

    traces.push({
      phase:
        "CONTRADICTIONS",
      message:
        graph.contradictions.length
          ? `${graph.contradictions.length} contradicciones activas.`
          : "Sin contradicciones activas.",
      data:
        graph.contradictions,
    });

    const currentConfidence =
      confidence(graph);

    const contradiction =
      graph.contradictions[0];

    if (contradiction) {
      graph =
        appendRaiNode(
          graph,
          contradiction.question,
          "CONTRADICTION",
          Object.freeze({
            reason:
              contradiction.summary,
          }),
        );

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
            confidence:
              currentConfidence,
            reason:
              contradiction.summary,
            showProposalButton:
              false,
          }),
        extraction:
          Object.freeze({
            facts:
              extraction.facts,
            proposalRequested:
              extraction.proposalRequested,
            diagnostics:
              extraction.diagnostics,
          }),
        traces:
          Object.freeze([
            ...traces,
            {
              phase:
                "RESPONSE",
              message:
                "Rai prioriza resolver la contradicción.",
            } satisfies Trace,
          ]),
      });
    }

    const ready =
      requiredComplete(
        graph,
      );

    if (!ready) {
      const question =
        questionFor(graph);

      const text =
        question?.question ??
        "Cuéntame un poco más para poder afinar el regalo.";

      graph =
        appendRaiNode(
          graph,
          text,
          "QUESTION",
          question
            ? Object.freeze({
                factKey:
                  question.key,
                reason:
                  question.reason,
              })
            : undefined,
        );

      return Object.freeze({
        generatedAt:
          new Date().toISOString(),
        graph,
        decision:
          Object.freeze({
            action: "ASK",
            text,
            confidence:
              currentConfidence,
            reason:
              question?.reason ??
              "Todavía faltan datos para preparar propuestas.",
            ...(question
              ? { question }
              : {}),
            showProposalButton:
              false,
          }),
        extraction:
          Object.freeze({
            facts:
              extraction.facts,
            proposalRequested:
              extraction.proposalRequested,
            diagnostics:
              extraction.diagnostics,
          }),
        traces:
          Object.freeze([
            ...traces,
            {
              phase:
                "QUESTIONS",
              message:
                question
                  ? `Siguiente dato prioritario: ${question.key}.`
                  : "No hay pregunta específica.",
              data:
                question,
            } satisfies Trace,
            {
              phase:
                "RESPONSE",
              message:
                "Rai continúa en descubrimiento.",
            } satisfies Trace,
          ]),
      });
    }

    /*
     * Regla RecuerdArte:
     * tener datos suficientes NO dispara propuestas.
     */
    if (
      !extraction.proposalRequested
    ) {
      const optional =
        graph.pendingQuestions.find(
          (question) =>
            !question.required,
        );

      const text =
        optional
          ? `${optional.question} Si prefieres, ya puedo preparar propuestas.`
          : "Ya tengo suficiente información. Cuando quieras, puedo preparar propuestas.";

      graph =
        appendRaiNode(
          graph,
          text,
          "DECISION",
          Object.freeze({
            readyToPropose:
              true,
          }),
        );

      return Object.freeze({
        generatedAt:
          new Date().toISOString(),
        graph,
        decision:
          Object.freeze({
            action:
              "READY_TO_PROPOSE",
            text,
            confidence:
              currentConfidence,
            reason:
              "Los datos mínimos están completos, pero las propuestas requieren una acción explícita del usuario.",
            ...(optional
              ? {
                  question:
                    optional,
                }
              : {}),
            showProposalButton:
              true,
          }),
        extraction:
          Object.freeze({
            facts:
              extraction.facts,
            proposalRequested:
              false,
            diagnostics:
              extraction.diagnostics,
          }),
        traces:
          Object.freeze([
            ...traces,
            {
              phase:
                "QUESTIONS",
              message:
                optional
                  ? `Descubrimiento opcional disponible: ${optional.key}.`
                  : "No quedan preguntas prioritarias.",
              data:
                optional,
            } satisfies Trace,
            {
              phase:
                "RESPONSE",
              message:
                "Proposal Gate activado: esperando Hacer propuestas.",
            } satisfies Trace,
          ]),
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
        "Hacer propuestas confirmado; Brain Orchestrator ejecutado.",
      data:
        orchestrator,
    });

    const record =
      orchestrator &&
      typeof orchestrator ===
        "object"
        ? orchestrator as
            Readonly<Record<string, unknown>>
        : {};

    const decision =
      record.decision &&
      typeof record.decision ===
        "object"
        ? record.decision as
            Readonly<Record<string, unknown>>
        : {};

    const action =
      decision.action ===
      "COMPOSED"
        ? "COMPOSED"
        : "PROPOSALS_READY";

    const text =
      action === "COMPOSED"
        ? "He preparado una propuesta completa."
        : "He preparado varias propuestas para que elijas la que más te guste.";

    graph =
      appendRaiNode(
        graph,
        text,
        "PROPOSAL",
        Object.freeze({
          orchestratorAction:
            decision.action,
        }),
      );

    return Object.freeze({
      generatedAt:
        new Date().toISOString(),
      graph,
      decision:
        Object.freeze({
          action,
          text,
          confidence:
            typeof decision.confidence ===
              "number"
              ? decision.confidence
              : currentConfidence,
          reason:
            typeof decision.reason ===
              "string"
              ? decision.reason
              : "El usuario solicitó explícitamente generar propuestas.",
          showProposalButton:
            false,
        }),
      orchestrator,
      extraction:
        Object.freeze({
          facts:
            extraction.facts,
          proposalRequested:
            true,
          diagnostics:
            extraction.diagnostics,
        }),
      traces:
        Object.freeze([
          ...traces,
          {
            phase:
              "RESPONSE",
            message:
              `Proposal Gate abierto; resultado ${action}.`,
          } satisfies Trace,
        ]),
    });
  }
}

export const
  defaultConversationEngineV21 =
    new ConversationEngineV21Service();
