import {
  useEffect,
  useState,
} from "react";

interface IntentEvidence {
  readonly text: string;
  readonly intent: string;
  readonly weight: number;
  readonly reason: string;
}

interface IntentStep {
  readonly order: number;
  readonly brain: string;
  readonly required: boolean;
  readonly reason: string;
}

interface IntentResult {
  readonly generatedAt: string;
  readonly primaryIntent: string;
  readonly secondaryIntents: readonly string[];
  readonly confidence: number;
  readonly evidence: readonly IntentEvidence[];
  readonly executionPlan: {
    readonly mode: string;
    readonly steps: readonly IntentStep[];
    readonly shouldAskQuestions: boolean;
    readonly shouldGenerateProposals: boolean;
    readonly shouldResetJourney: boolean;
  };
  readonly explanation: string;
  readonly traces: readonly {
    readonly phase: string;
    readonly message: string;
    readonly data?: unknown;
  }[];
}

const starter = {
  message:
    "No sé qué regalarle a mi padre, dame ideas",
  conversationState:
    "DISCOVERY",
  hasCandidates:
    false,
  hasProposals:
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

  const a =
    document.createElement("a");

  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function IntentBrainStudioApp() {
  const [payload, setPayload] =
    useState(
      JSON.stringify(
        starter,
        null,
        2,
      ),
    );

  const [result, setResult] =
    useState<IntentResult>();

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState<string>();

  async function run(): Promise<void> {
    setBusy(true);
    setError(undefined);

    try {
      const response =
        await fetch(
          "/api/v1/intent-brain/analyze",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json",
            },
            body:
              JSON.stringify(
                JSON.parse(payload),
              ),
          },
        );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`,
        );
      }

      setResult(
        await response.json() as IntentResult,
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
    void run();
  }, []);

  async function copyDiagnostic(): Promise<void> {
    await navigator.clipboard.writeText(
      JSON.stringify(
        {
          input:
            JSON.parse(payload),
          result,
          href:
            window.location.href,
        },
        null,
        2,
      ),
    );
  }

  return (
    <main className="intentStudio">
      <header className="intentStudio__header">
        <div>
          <p>
            RecuerdArte · Intent Routing
          </p>
          <h1>
            Intent Brain Studio
          </h1>
          <span>
            Intención, confianza, evidencias y plan de ejecución entre Brains.
          </span>
        </div>

        <div className="intentStudio__actions">
          <button
            type="button"
            onClick={() =>
              void run()
            }
            disabled={busy}
          >
            {busy
              ? "Analizando…"
              : "Ejecutar Intent Brain"}
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
                `intent-brain-${new Date().toISOString().replace(/[:.]/gu, "-")}.json`,
                {
                  input:
                    JSON.parse(payload),
                  result,
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
        <div className="intentStudio__error">
          {error}
        </div>
      ) : null}

      <div className="intentStudio__layout">
        <aside className="intentStudio__input">
          <h2>Entrada</h2>
          <textarea
            value={payload}
            spellCheck={false}
            onChange={(event) =>
              setPayload(
                event.target.value,
              )
            }
          />
        </aside>

        <section className="intentStudio__workspace">
          {result ? (
            <>
              <section className="intentStudio__summary">
                <article>
                  <span>
                    Intención principal
                  </span>
                  <strong>
                    {
                      result.primaryIntent
                    }
                  </strong>
                </article>

                <article>
                  <span>
                    Confidence
                  </span>
                  <strong>
                    {pct(
                      result.confidence,
                    )}
                  </strong>
                </article>

                <article>
                  <span>
                    Modo
                  </span>
                  <strong>
                    {
                      result.executionPlan
                        .mode
                    }
                  </strong>
                </article>

                <article>
                  <span>
                    Pasos
                  </span>
                  <strong>
                    {
                      result.executionPlan
                        .steps.length
                    }
                  </strong>
                </article>
              </section>

              <section className="intentStudio__decision">
                <h2>
                  {
                    result.explanation
                  }
                </h2>

                {result.secondaryIntents.length ? (
                  <p>
                    Secundarias:{" "}
                    {
                      result.secondaryIntents.join(
                        ", ",
                      )
                    }
                  </p>
                ) : null}

                <div>
                  <span>
                    Preguntar:{" "}
                    <b>
                      {result.executionPlan.shouldAskQuestions
                        ? "sí"
                        : "no"}
                    </b>
                  </span>
                  <span>
                    Generar propuestas:{" "}
                    <b>
                      {result.executionPlan.shouldGenerateProposals
                        ? "sí"
                        : "no"}
                    </b>
                  </span>
                  <span>
                    Reiniciar Journey:{" "}
                    <b>
                      {result.executionPlan.shouldResetJourney
                        ? "sí"
                        : "no"}
                    </b>
                  </span>
                </div>
              </section>

              <section className="intentStudio__pipeline">
                <h2>
                  Execution Plan
                </h2>

                {result.executionPlan.steps
                  .slice()
                  .sort(
                    (left, right) =>
                      left.order -
                      right.order,
                  )
                  .map(
                    (step) => (
                      <article
                        key={`${step.order}-${step.brain}`}
                      >
                        <span>
                          {
                            step.order
                          }
                        </span>

                        <div>
                          <strong>
                            {
                              step.brain
                            }
                          </strong>
                          <p>
                            {
                              step.reason
                            }
                          </p>
                        </div>

                        <b>
                          {step.required
                            ? "REQUERIDO"
                            : "OPCIONAL"}
                        </b>
                      </article>
                    ),
                  )}
              </section>

              <section className="intentStudio__evidence">
                <h2>
                  Evidencias
                </h2>

                {result.evidence.length ? (
                  result.evidence.map(
                    (
                      evidence,
                      index,
                    ) => (
                      <article
                        key={`${evidence.intent}-${index}`}
                      >
                        <div>
                          <span>
                            {
                              evidence.intent
                            }
                          </span>
                          <strong>
                            “
                            {
                              evidence.text
                            }
                            ”
                          </strong>
                          <p>
                            {
                              evidence.reason
                            }
                          </p>
                        </div>

                        <b>
                          {pct(
                            evidence.weight,
                          )}
                        </b>
                      </article>
                    ),
                  )
                ) : (
                  <p>
                    Sin intención explícita suficiente.
                  </p>
                )}
              </section>

              <section className="intentStudio__xray">
                <h2>
                  Rayos X
                </h2>

                {result.traces.map(
                  (
                    trace,
                    index,
                  ) => (
                    <article
                      key={`${trace.phase}-${index}`}
                    >
                      <span>
                        {index + 1}
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
            </>
          ) : (
            <p>
              Analizando intención…
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
