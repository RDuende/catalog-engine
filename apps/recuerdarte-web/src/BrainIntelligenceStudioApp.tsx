import {
  useEffect,
  useState,
} from "react";

interface Stage {
  readonly id: string;
  readonly status: string;
  readonly durationMs: number;
  readonly confidence?: number;
  readonly message: string;
  readonly input?: unknown;
  readonly output?: unknown;
}

interface Result {
  readonly generatedAt: string;
  readonly action: string;
  readonly confidence: number;
  readonly message: string;
  readonly executionMode: string;
  readonly executionOrder: readonly string[];
  readonly context: Readonly<Record<string, unknown>>;
  readonly stages: readonly Stage[];
}

const starter = {
  conversationMessage:
    "No sé qué regalarle a mi padre, quiero sorprenderlo",
  recipientLabel:
    "mi padre",
  occasion:
    "cumpleaños",
  budget: 70,
  interests: [
    "motocross",
  ],
  desiredImpact: [
    "sorprender",
  ],
  candidates: [],
};

function pct(
  value: number | undefined,
): string {
  return value === undefined
    ? "—"
    : `${Math.round(value * 100)}%`;
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

export function BrainIntelligenceStudioApp() {
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

  const [selected, setSelected] =
    useState<Stage>();

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
          "/api/v1/brain-orchestrator/intelligence/run",
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

      const current =
        await response.json() as Result;

      setResult(current);
      setSelected(
        current.stages[0],
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
    <main className="brainIntelligence">
      <header className="brainIntelligence__header">
        <div>
          <p>
            RecuerdArte · Rai Intelligence Runtime
          </p>
          <h1>
            Intelligence Pipeline Studio
          </h1>
          <span>
            Intent + Memory + Emotion + Brain Orchestrator.
          </span>
        </div>

        <div className="brainIntelligence__actions">
          <button
            type="button"
            onClick={() =>
              void run()
            }
            disabled={busy}
          >
            {busy
              ? "Ejecutando…"
              : "Ejecutar pipeline"}
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
                `intelligence-${new Date().toISOString().replace(/[:.]/gu, "-")}.json`,
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
        <div className="brainIntelligence__error">
          {error}
        </div>
      ) : null}

      <div className="brainIntelligence__layout">
        <aside className="brainIntelligence__input">
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

        <section className="brainIntelligence__workspace">
          {result ? (
            <>
              <section className="brainIntelligence__summary">
                <article>
                  <span>
                    Acción
                  </span>
                  <strong>
                    {
                      result.action
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
                      result.executionMode
                    }
                  </strong>
                </article>

                <article>
                  <span>
                    Etapas
                  </span>
                  <strong>
                    {
                      result.stages
                        .length
                    }
                  </strong>
                </article>
              </section>

              <section className="brainIntelligence__decision">
                <h2>
                  {
                    result.message
                  }
                </h2>
                <p>
                  Orden:{" "}
                  {
                    result.executionOrder.join(
                      " → ",
                    )
                  }
                </p>
              </section>

              <section className="brainIntelligence__pipeline">
                {result.stages.map(
                  (
                    stage,
                    index,
                  ) => (
                    <button
                      type="button"
                      key={`${stage.id}-${index}`}
                      className={
                        selected ===
                        stage
                          ? "is-active"
                          : ""
                      }
                      onClick={() =>
                        setSelected(
                          stage,
                        )
                      }
                    >
                      <span>
                        {index + 1}
                      </span>
                      <div>
                        <strong>
                          {
                            stage.id
                          }
                        </strong>
                        <small>
                          {
                            stage.status
                          }
                        </small>
                      </div>
                      <div>
                        <b>
                          {pct(
                            stage.confidence,
                          )}
                        </b>
                        <small>
                          {
                            stage.durationMs.toFixed(
                              1,
                            )
                          }{" "}
                          ms
                        </small>
                      </div>
                    </button>
                  ),
                )}
              </section>

              {selected ? (
                <section className="brainIntelligence__xray">
                  <header>
                    <div>
                      <span>
                        Rayos X
                      </span>
                      <h2>
                        {
                          selected.id
                        }
                      </h2>
                    </div>
                    <strong>
                      {pct(
                        selected.confidence,
                      )}
                    </strong>
                  </header>

                  <p>
                    {
                      selected.message
                    }
                  </p>

                  <div>
                    <article>
                      <h3>
                        Input
                      </h3>
                      <pre>
                        {JSON.stringify(
                          selected.input ??
                            null,
                          null,
                          2,
                        )}
                      </pre>
                    </article>

                    <article>
                      <h3>
                        Output
                      </h3>
                      <pre>
                        {JSON.stringify(
                          selected.output ??
                            null,
                          null,
                          2,
                        )}
                      </pre>
                    </article>
                  </div>
                </section>
              ) : null}

              <section className="brainIntelligence__context">
                <h2>
                  Contexto combinado
                </h2>
                <pre>
                  {JSON.stringify(
                    result.context,
                    null,
                    2,
                  )}
                </pre>
              </section>
            </>
          ) : (
            <p>
              Ejecutando…
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
