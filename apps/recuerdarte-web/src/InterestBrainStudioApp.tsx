import {
  useEffect,
  useState,
} from "react";

interface Signal {
  readonly raw: string;
  readonly canonical: string;
  readonly source: string;
  readonly confidence: number;
  readonly weight: number;
  readonly evidence?: string;
  readonly parent?: string;
}

interface Cluster {
  readonly key: string;
  readonly score: number;
  readonly confidence: number;
  readonly members: readonly Signal[];
}

interface Result {
  readonly generatedAt: string;
  readonly canonicalInterests: readonly string[];
  readonly signals: readonly Signal[];
  readonly clusters: readonly Cluster[];
  readonly primaryInterest?: string;
  readonly confidence: number;
  readonly explanation: string;
  readonly traces: readonly {
    readonly phase: string;
    readonly message: string;
    readonly data?: unknown;
  }[];
}

const starter = {
  message:
    "Le encanta el monte, hacer rutas y la fotografía",
  interests: [
    "madera",
  ],
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

export function InterestBrainStudioApp() {
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
    useState<Signal>();

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
          "/api/v2/interest-brain/analyze",
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
        current.signals[0],
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
    <main className="interestStudio">
      <header className="interestStudio__header">
        <div>
          <p>
            RecuerdArte · Semantic Interests
          </p>
          <h1>
            Interest Brain Studio V2
          </h1>
          <span>
            Canonicalización, inferencias, clusters, pesos y confidence.
          </span>
        </div>

        <div className="interestStudio__actions">
          <button
            type="button"
            onClick={() =>
              void run()
            }
            disabled={busy}
          >
            {busy
              ? "Analizando…"
              : "Ejecutar Interest Brain"}
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
                `interest-brain-${new Date().toISOString().replace(/[:.]/gu, "-")}.json`,
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

          <a href="/admin/intelligence-runtime">
            Intelligence Runtime
          </a>
        </div>
      </header>

      {error ? (
        <div className="interestStudio__error">
          {error}
        </div>
      ) : null}

      <div className="interestStudio__layout">
        <aside className="interestStudio__input">
          <h2>
            Entrada
          </h2>
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

        <section className="interestStudio__workspace">
          {result ? (
            <>
              <section className="interestStudio__summary">
                <article>
                  <span>
                    Principal
                  </span>
                  <strong>
                    {
                      result.primaryInterest ??
                      "—"
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
                    Canónicos
                  </span>
                  <strong>
                    {
                      result.canonicalInterests
                        .length
                    }
                  </strong>
                </article>

                <article>
                  <span>
                    Clusters
                  </span>
                  <strong>
                    {
                      result.clusters
                        .length
                    }
                  </strong>
                </article>
              </section>

              <section className="interestStudio__decision">
                <h2>
                  {
                    result.explanation
                  }
                </h2>

                <p>
                  {
                    result.canonicalInterests.join(
                      " · ",
                    )
                  }
                </p>
              </section>

              <section className="interestStudio__signals">
                <div className="interestStudio__list">
                  {result.signals.map(
                    (signal) => (
                      <button
                        type="button"
                        key={`${signal.canonical}-${signal.source}`}
                        className={
                          selected === signal
                            ? "is-active"
                            : ""
                        }
                        onClick={() =>
                          setSelected(
                            signal,
                          )
                        }
                      >
                        <span>
                          {
                            signal.source
                          }
                        </span>
                        <strong>
                          {
                            signal.canonical
                          }
                        </strong>
                        <small>
                          {pct(
                            signal.confidence,
                          )}{" "}
                          · peso{" "}
                          {pct(
                            signal.weight,
                          )}
                        </small>
                      </button>
                    ),
                  )}
                </div>

                <div className="interestStudio__detail">
                  {selected ? (
                    <>
                      <header>
                        <div>
                          <span>
                            {
                              selected.source
                            }
                          </span>
                          <h2>
                            {
                              selected.canonical
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
                        Evidencia:{" "}
                        <b>
                          {
                            selected.evidence ??
                            selected.raw
                          }
                        </b>
                      </p>

                      <pre>
                        {JSON.stringify(
                          selected,
                          null,
                          2,
                        )}
                      </pre>
                    </>
                  ) : null}
                </div>
              </section>

              <section className="interestStudio__clusters">
                <h2>
                  Clusters de afinidad
                </h2>

                {result.clusters.map(
                  (cluster) => (
                    <article
                      key={
                        cluster.key
                      }
                    >
                      <div>
                        <strong>
                          {
                            cluster.key
                          }
                        </strong>
                        <span>
                          {cluster.members
                            .map(
                              (member) =>
                                member.canonical,
                            )
                            .join(
                              ", ",
                            )}
                        </span>
                      </div>

                      <div>
                        <b>
                          score{" "}
                          {cluster.score.toFixed(
                            2,
                          )}
                        </b>
                        <small>
                          {pct(
                            cluster.confidence,
                          )}
                        </small>
                      </div>
                    </article>
                  ),
                )}
              </section>

              <section className="interestStudio__xray">
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
              Analizando intereses…
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
