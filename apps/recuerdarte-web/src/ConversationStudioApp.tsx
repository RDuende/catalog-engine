import {
  useEffect,
  useMemo,
  useState,
} from "react";

interface GraphNode {
  readonly id: string;
  readonly parentId?: string;
  readonly kind: string;
  readonly createdAt: string;
  readonly text: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

interface Fact {
  readonly key: string;
  readonly value: unknown;
  readonly confidence: number;
  readonly updatedAt: string;
}

interface Contradiction {
  readonly id: string;
  readonly severity: string;
  readonly summary: string;
  readonly question: string;
}

interface PendingQuestion {
  readonly key: string;
  readonly question: string;
  readonly reason: string;
  readonly priority: number;
  readonly required: boolean;
}

interface Result {
  readonly generatedAt: string;
  readonly graph: {
    readonly conversationId: string;
    readonly rootNodeId: string;
    readonly activeNodeId: string;
    readonly nodes: readonly GraphNode[];
    readonly facts: readonly Fact[];
    readonly contradictions: readonly Contradiction[];
    readonly pendingQuestions: readonly PendingQuestion[];
    readonly version: number;
  };
  readonly decision: {
    readonly action: string;
    readonly text: string;
    readonly confidence: number;
    readonly reason: string;
    readonly question?: PendingQuestion;
    readonly showProposalButton?: boolean;
  };
  readonly orchestrator?: unknown;
  readonly extraction?: {
    readonly facts: readonly {
      readonly key: string;
      readonly value: unknown;
      readonly confidence: number;
      readonly evidence: string;
    }[];
    readonly proposalRequested: boolean;
    readonly diagnostics: readonly string[];
  };
  readonly traces: readonly {
    readonly phase: string;
    readonly message: string;
    readonly data?: unknown;
  }[];
}

const starter = {
  conversationId:
    "conversation-demo",
  message:
    "Quiero un regalo para mi padre",
  candidates: [],
  autoCompose:
    false,
};

function pct(
  value: number,
): string {
  return `${Math.round(value * 100)}%`;
}

function downloadJson(
  filename: string,
  value: unknown,
): void {
  const blob =
    new Blob(
      [
        JSON.stringify(
          value,
          null,
          2,
        ),
      ],
      {
        type:
          "application/json;charset=utf-8",
      },
    );

  const url =
    URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function ConversationStudioApp() {
  const [payload, setPayload] =
    useState(
      JSON.stringify(
        starter,
        null,
        2,
      ),
    );

  const [result, setResult] =
    useState<Result>();

  const [history, setHistory] =
    useState<
      readonly Result[]
    >([]);

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState<string>();

  const [tab, setTab] =
    useState<
      "conversation" |
      "facts" |
      "questions" |
      "orchestrator" |
      "extraction" |
      "xray"
    >("conversation");

  async function process(
    usePreviousGraph = false,
  ): Promise<void> {
    setBusy(true);
    setError(undefined);

    try {
      const parsed =
        JSON.parse(payload);

      const body =
        usePreviousGraph &&
        result
          ? {
              ...parsed,
              graph:
                result.graph,
            }
          : parsed;

      const response =
        await fetch(
          "/api/v2/conversation/process-natural",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json",
            },
            body:
              JSON.stringify(
                body,
              ),
          },
        );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`,
        );
      }

      const current =
        await response.json() as Result;

      setResult(current);

      setHistory(
        (previous) =>
          Object.freeze([
            ...previous,
            current,
          ]),
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : String(reason),
      );
    } finally {
      setBusy(false);
    }
  }

  async function makeProposals(): Promise<void> {
    if (!result) return;

    setBusy(true);
    setError(undefined);

    try {
      const parsed =
        JSON.parse(payload);

      const response =
        await fetch(
          "/api/v2/conversation/process-natural",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json",
            },
            body:
              JSON.stringify({
                ...parsed,
                graph:
                  result.graph,
                message:
                  "Hacer propuestas",
              }),
          },
        );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`,
        );
      }

      const current =
        await response.json() as Result;

      setResult(current);
      setHistory(
        (previous) =>
          Object.freeze([
            ...previous,
            current,
          ]),
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : String(reason),
      );
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void process(false);
  }, []);

  const activePath =
    useMemo(
      () => {
        if (!result) {
          return [];
        }

        const byId =
          new Map(
            result.graph.nodes.map(
              (node) => [
                node.id,
                node,
              ],
            ),
          );

        const path:
          GraphNode[] = [];

        let current =
          byId.get(
            result.graph.activeNodeId,
          );

        while (current) {
          path.unshift(current);

          current =
            current.parentId
              ? byId.get(
                  current.parentId,
                )
              : undefined;
        }

        return path;
      },
      [result],
    );

  async function copyDiagnostic(): Promise<void> {
    await navigator.clipboard.writeText(
      JSON.stringify(
        {
          payload:
            JSON.parse(payload),
          result,
          history,
          href:
            window.location.href,
        },
        null,
        2,
      ),
    );
  }

  return (
    <main className="conversationStudio">
      <header className="conversationStudio__header">
        <div>
          <p>
            RecuerdArte · Rai Conversation Runtime
          </p>
          <h1>
            Conversation Studio V2
          </h1>
          <span>
            Conversation Graph, hechos, preguntas, contradicciones y Brain Orchestrator.
          </span>
        </div>

        <div className="conversationStudio__actions">
          <button
            type="button"
            onClick={() =>
              void process(false)
            }
            disabled={busy}
          >
            Ejecutar nuevo
          </button>

          <button
            type="button"
            onClick={() =>
              void process(true)
            }
            disabled={
              busy ||
              !result
            }
          >
            Continuar conversación
          </button>

          <button
            type="button"
            onClick={() =>
              void copyDiagnostic()
            }
          >
            Copiar diagnóstico
          </button>

          <button
            type="button"
            onClick={() =>
              result &&
              downloadJson(
                `conversation-${result.graph.conversationId}.json`,
                {
                  payload:
                    JSON.parse(payload),
                  result,
                  history,
                },
              )
            }
          >
            Exportar JSON
          </button>

          <a href="/admin/brain-orchestrator">
            Orchestrator
          </a>
        </div>
      </header>

      {error ? (
        <div className="conversationStudio__error">
          {error}
        </div>
      ) : null}

      <div className="conversationStudio__layout">
        <aside className="conversationStudio__input">
          <header>
            <h2>Turno</h2>
            <span>
              JSON editable
            </span>
          </header>

          <textarea
            value={payload}
            spellCheck={false}
            onChange={(event) =>
              setPayload(
                event.target.value,
              )
            }
          />

          <div className="conversationStudio__history">
            <strong>
              Replay local
            </strong>
            <span>
              {history.length} ejecuciones
            </span>

            {history.map(
              (
                item,
                index,
              ) => (
                <button
                  type="button"
                  key={`${item.generatedAt}-${index}`}
                  onClick={() =>
                    setResult(
                      item,
                    )
                  }
                >
                  <span>
                    Turno{" "}
                    {index + 1}
                  </span>
                  <strong>
                    {
                      item.decision
                        .action
                    }
                  </strong>
                  <small>
                    {pct(
                      item.decision
                        .confidence,
                    )}
                  </small>
                </button>
              ),
            )}
          </div>
        </aside>

        <section className="conversationStudio__workspace">
          {result ? (
            <>
              <section className="conversationStudio__summary">
                <article>
                  <span>
                    Acción
                  </span>
                  <strong>
                    {
                      result.decision
                        .action
                    }
                  </strong>
                </article>

                <article>
                  <span>
                    Confidence
                  </span>
                  <strong>
                    {pct(
                      result.decision
                        .confidence,
                    )}
                  </strong>
                </article>

                <article>
                  <span>
                    Hechos
                  </span>
                  <strong>
                    {
                      result.graph
                        .facts
                        .length
                    }
                  </strong>
                </article>

                <article>
                  <span>
                    Contradicciones
                  </span>
                  <strong>
                    {
                      result.graph
                        .contradictions
                        .length
                    }
                  </strong>
                </article>

                <article>
                  <span>
                    Graph v.
                  </span>
                  <strong>
                    {
                      result.graph
                        .version
                    }
                  </strong>
                </article>
              </section>

              <section className="conversationStudio__decision">
                <span>
                  Respuesta de Rai
                </span>
                <h2>
                  {
                    result.decision
                      .text
                  }
                </h2>
                <p>
                  {
                    result.decision
                      .reason
                  }
                </p>

                {result.decision.showProposalButton ? (
                  <button
                    type="button"
                    onClick={() =>
                      void makeProposals()
                    }
                    disabled={busy}
                  >
                    Hacer propuestas
                  </button>
                ) : null}

                {result.decision.question ? (
                  <div>
                    <strong>
                      ¿Por qué pregunta esto?
                    </strong>
                    <p>
                      {
                        result.decision
                          .question
                          .reason
                      }
                    </p>
                  </div>
                ) : null}
              </section>

              <nav className="conversationStudio__tabs">
                {[
                  [
                    "conversation",
                    "Conversation Graph",
                  ],
                  [
                    "facts",
                    "Hechos",
                  ],
                  [
                    "questions",
                    "Preguntas",
                  ],
                  [
                    "orchestrator",
                    "Orchestrator",
                  ],
                  [
                    "extraction",
                    "Extracción",
                  ],
                  [
                    "xray",
                    "Rayos X",
                  ],
                ].map(
                  ([key, label]) => (
                    <button
                      type="button"
                      key={key}
                      className={
                        tab === key
                          ? "is-active"
                          : ""
                      }
                      onClick={() =>
                        setTab(
                          key as typeof tab,
                        )
                      }
                    >
                      {label}
                    </button>
                  ),
                )}
              </nav>

              {tab ===
              "conversation" ? (
                <section className="conversationStudio__graph">
                  <h2>
                    Camino activo
                  </h2>

                  {activePath.map(
                    (
                      node,
                      index,
                    ) => (
                      <article
                        key={
                          node.id
                        }
                      >
                        <span>
                          {index +
                            1}
                        </span>

                        <div>
                          <small>
                            {
                              node.kind
                            }
                          </small>
                          <strong>
                            {
                              node.text
                            }
                          </strong>
                          <code>
                            {
                              node.id
                            }
                          </code>
                        </div>
                      </article>
                    ),
                  )}

                  <details>
                    <summary>
                      Ver grafo completo (
                      {
                        result.graph
                          .nodes
                          .length
                      }{" "}
                      nodos)
                    </summary>
                    <pre>
                      {JSON.stringify(
                        result.graph
                          .nodes,
                        null,
                        2,
                      )}
                    </pre>
                  </details>
                </section>
              ) : null}

              {tab ===
              "facts" ? (
                <section className="conversationStudio__facts">
                  <h2>
                    Memoria viva del turno
                  </h2>

                  <table>
                    <thead>
                      <tr>
                        <th>
                          Hecho
                        </th>
                        <th>
                          Valor
                        </th>
                        <th>
                          Confidence
                        </th>
                        <th>
                          Actualizado
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.graph.facts.map(
                        (fact) => (
                          <tr
                            key={
                              fact.key
                            }
                          >
                            <th>
                              {
                                fact.key
                              }
                            </th>
                            <td>
                              <code>
                                {JSON.stringify(
                                  fact.value,
                                )}
                              </code>
                            </td>
                            <td>
                              {pct(
                                fact.confidence,
                              )}
                            </td>
                            <td>
                              {
                                fact.updatedAt
                              }
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </section>
              ) : null}

              {tab ===
              "questions" ? (
                <section className="conversationStudio__questions">
                  <div>
                    <h2>
                      Preguntas pendientes
                    </h2>

                    {result.graph.pendingQuestions.map(
                      (
                        question,
                      ) => (
                        <article
                          key={
                            question.key
                          }
                        >
                          <div>
                            <span>
                              Prioridad{" "}
                              {
                                question.priority
                              }
                            </span>
                            <strong>
                              {
                                question.question
                              }
                            </strong>
                            <p>
                              {
                                question.reason
                              }
                            </p>
                          </div>
                          <b>
                            {question.required
                              ? "REQUERIDA"
                              : "OPCIONAL"}
                          </b>
                        </article>
                      ),
                    )}
                  </div>

                  <div>
                    <h2>
                      Contradicciones
                    </h2>

                    {result.graph.contradictions.length ? (
                      result.graph.contradictions.map(
                        (
                          contradiction,
                        ) => (
                          <article
                            key={
                              contradiction.id
                            }
                            className="is-contradiction"
                          >
                            <div>
                              <span>
                                {
                                  contradiction.severity
                                }
                              </span>
                              <strong>
                                {
                                  contradiction.summary
                                }
                              </strong>
                              <p>
                                {
                                  contradiction.question
                                }
                              </p>
                            </div>
                          </article>
                        ),
                      )
                    ) : (
                      <p>
                        No hay contradicciones activas.
                      </p>
                    )}
                  </div>
                </section>
              ) : null}

              {tab ===
              "orchestrator" ? (
                <section className="conversationStudio__orchestrator">
                  <h2>
                    Brain Orchestrator
                  </h2>

                  {result.orchestrator ? (
                    <pre>
                      {JSON.stringify(
                        result.orchestrator,
                        null,
                        2,
                      )}
                    </pre>
                  ) : (
                    <p>
                      El Orchestrator todavía no se ejecutó en este turno.
                    </p>
                  )}
                </section>
              ) : null}

              {tab ===
              "extraction" ? (
                <section className="conversationStudio__orchestrator">
                  <h2>
                    Extracción natural
                  </h2>

                  {result.extraction ? (
                    <>
                      <p>
                        Proposal requested:{" "}
                        <strong>
                          {result.extraction.proposalRequested
                            ? "sí"
                            : "no"}
                        </strong>
                      </p>
                      <pre>
                        {JSON.stringify(
                          result.extraction,
                          null,
                          2,
                        )}
                      </pre>
                    </>
                  ) : (
                    <p>
                      Este resultado no contiene trazas de extracción V2.1.
                    </p>
                  )}
                </section>
              ) : null}

              {tab ===
              "xray" ? (
                <section className="conversationStudio__xray">
                  {result.traces.map(
                    (
                      trace,
                      index,
                    ) => (
                      <article
                        key={`${trace.phase}-${index}`}
                      >
                        <span>
                          {index +
                            1}
                        </span>
                        <div>
                          <strong>
                            {
                              trace.phase
                            }
                          </strong>
                          <p>
                            {
                              trace.message
                            }
                          </p>

                          {trace.data !==
                          undefined ? (
                            <details>
                              <summary>
                                Ver datos
                              </summary>
                              <pre>
                                {JSON.stringify(
                                  trace.data,
                                  null,
                                  2,
                                )}
                              </pre>
                            </details>
                          ) : null}
                        </div>
                      </article>
                    ),
                  )}
                </section>
              ) : null}
            </>
          ) : (
            <p>
              Procesando conversación…
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
