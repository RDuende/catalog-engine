import {
  useEffect,
  useState,
} from "react";

interface Stage {
  readonly stage: string;
  readonly status: string;
  readonly durationMs?: number;
  readonly confidence?: number;
  readonly message: string;
  readonly input?: unknown;
  readonly output?: unknown;
  readonly error?: {
    readonly name: string;
    readonly message: string;
  };
}

interface Result {
  readonly runId: string;
  readonly generatedAt: string;
  readonly totalDurationMs: number;
  readonly decision: {
    readonly action: string;
    readonly confidence: number;
    readonly reason: string;
    readonly nextQuestion?: string;
  };
  readonly stages: readonly Stage[];
  readonly context: Readonly<Record<string, unknown>>;
}

interface Benchmark {
  readonly generatedAt: string;
  readonly runs: number;
  readonly successfulRuns: number;
  readonly failedRuns: number;
  readonly avgMs: number;
  readonly p50Ms: number;
  readonly p95Ms: number;
  readonly avgConfidence: number;
}

const preset = {
  recipientLabel: "mi padre",
  occasion: "cumpleaños",
  budget: 70,
  interests: [
    "motocross",
    "madera",
  ],
  personality: [
    "práctico",
    "aventurero",
  ],
  desiredImpact: [
    "sorprender",
    "emocionar",
  ],
  recipientCount: 1,
  autoCompose: false,
  candidates: [
    {
      id: "p1",
      name: "Termo personalizado motocross",
      category: "botellas",
      price: 24,
      stock: 20,
      score: 0.9,
      canonicalInterests: [
        "motocross",
      ],
      personalizationAvailable: true,
      marginPercent: 55,
      bundleRoles: [
        "HERO",
      ],
      imageUrl:
        "/placeholder-product.png",
    },
    {
      id: "p2",
      name: "Llavero de madera",
      category: "llaveros",
      price: 9,
      stock: 50,
      score: 0.78,
      canonicalInterests: [
        "madera",
      ],
      personalizationAvailable: true,
      marginPercent: 60,
      bundleRoles: [
        "COMPLEMENT",
      ],
      imageUrl:
        "/placeholder-product.png",
    },
    {
      id: "p3",
      name: "Caja de madera",
      category: "packaging",
      price: 14,
      stock: 8,
      score: 0.7,
      materials: [
        "madera",
      ],
      personalizationAvailable: true,
      marginPercent: 45,
      bundleRoles: [
        "PACKAGING",
      ],
      imageUrl:
        "/placeholder-product.png",
    },
  ],
};

function pct(
  value: number | undefined,
): string {
  return value === undefined
    ? "—"
    : `${Math.round(value * 100)}%`;
}

function download(
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

export function BrainOrchestratorStudioApp() {
  const [input, setInput] =
    useState(
      JSON.stringify(
        preset,
        null,
        2,
      ),
    );

  const [result, setResult] =
    useState<Result>();

  const [benchmark, setBenchmark] =
    useState<Benchmark>();

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState<string>();

  const [selectedStage, setSelectedStage] =
    useState<string>();

  async function run(): Promise<void> {
    setBusy(true);
    setError(undefined);

    try {
      const body =
        JSON.parse(input);

      const response =
        await fetch(
          "/api/v1/brain-orchestrator/run",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json",
            },
            body:
              JSON.stringify(body),
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
      setSelectedStage(
        current.stages[0]?.stage,
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

  async function runBenchmark(): Promise<void> {
    setBusy(true);
    setError(undefined);

    try {
      const response =
        await fetch(
          "/api/v1/brain-orchestrator/benchmark",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json",
            },
            body:
              JSON.stringify({
                input:
                  JSON.parse(input),
                runs: 10,
              }),
          },
        );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`,
        );
      }

      setBenchmark(
        await response.json() as Benchmark,
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

  const active =
    result?.stages.find(
      (stage) =>
        stage.stage ===
        selectedStage,
    );

  async function copyDiagnostic(): Promise<void> {
    await navigator.clipboard.writeText(
      JSON.stringify(
        {
          input:
            JSON.parse(input),
          result,
          benchmark,
          href:
            window.location.href,
        },
        null,
        2,
      ),
    );
  }

  return (
    <main className="brainOrchestrator">
      <header className="brainOrchestrator__header">
        <div>
          <p>
            RecuerdArte · Rai Runtime
          </p>
          <h1>
            Brain Orchestrator Studio
          </h1>
          <span>
            Pipeline, confidence, tiempos, replay y benchmark.
          </span>
        </div>

        <div className="brainOrchestrator__actions">
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
              void runBenchmark()
            }
            disabled={busy}
          >
            Benchmark ×10
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
              download(
                `brain-run-${result.runId}.json`,
                {
                  input:
                    JSON.parse(input),
                  result,
                  benchmark,
                },
              )
            }
          >
            Exportar JSON
          </button>

          <a href="/admin/tools">
            Consola
          </a>
        </div>
      </header>

      {error ? (
        <div className="brainOrchestrator__error">
          {error}
        </div>
      ) : null}

      <div className="brainOrchestrator__layout">
        <aside className="brainOrchestrator__input">
          <h2>Brain Input</h2>
          <textarea
            value={input}
            spellCheck={false}
            onChange={(event) =>
              setInput(
                event.target.value,
              )
            }
          />
        </aside>

        <section className="brainOrchestrator__workspace">
          {result ? (
            <>
              <section className="brainOrchestrator__summary">
                <article>
                  <span>Acción</span>
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
                    Tiempo total
                  </span>
                  <strong>
                    {
                      result.totalDurationMs.toFixed(
                        1,
                      )
                    }{" "}
                    ms
                  </strong>
                </article>
                <article>
                  <span>
                    Run ID
                  </span>
                  <strong>
                    {
                      result.runId
                    }
                  </strong>
                </article>
              </section>

              <section className="brainOrchestrator__decision">
                <strong>
                  {
                    result.decision
                      .reason
                  }
                </strong>
                {result.decision.nextQuestion ? (
                  <p>
                    Siguiente pregunta:{" "}
                    {
                      result.decision
                        .nextQuestion
                    }
                  </p>
                ) : null}
              </section>

              <section className="brainOrchestrator__pipeline">
                {result.stages.map(
                  (
                    stage,
                    index,
                  ) => (
                    <button
                      type="button"
                      key={`${stage.stage}-${index}`}
                      className={
                        selectedStage ===
                        stage.stage
                          ? "is-active"
                          : ""
                      }
                      onClick={() =>
                        setSelectedStage(
                          stage.stage,
                        )
                      }
                    >
                      <span>
                        {index +
                          1}
                      </span>
                      <div>
                        <strong>
                          {
                            stage.stage
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
                            stage.durationMs?.toFixed(
                              1,
                            ) ??
                            "0"
                          }{" "}
                          ms
                        </small>
                      </div>
                    </button>
                  ),
                )}
              </section>

              {active ? (
                <section className="brainOrchestrator__xray">
                  <header>
                    <div>
                      <span>
                        Rayos X
                      </span>
                      <h2>
                        {
                          active.stage
                        }
                      </h2>
                    </div>
                    <div>
                      <b>
                        {pct(
                          active.confidence,
                        )}
                      </b>
                      <small>
                        {
                          active.status
                        }
                      </small>
                    </div>
                  </header>

                  <p>
                    {
                      active.message
                    }
                  </p>

                  <div className="brainOrchestrator__io">
                    <article>
                      <h3>Input</h3>
                      <pre>
                        {JSON.stringify(
                          active.input ??
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
                          active.output ??
                            null,
                          null,
                          2,
                        )}
                      </pre>
                    </article>
                  </div>
                </section>
              ) : null}

              {benchmark ? (
                <section className="brainOrchestrator__benchmark">
                  <h2>
                    Benchmark
                  </h2>
                  <div>
                    <article>
                      <span>
                        Runs
                      </span>
                      <strong>
                        {
                          benchmark.runs
                        }
                      </strong>
                    </article>
                    <article>
                      <span>
                        Media
                      </span>
                      <strong>
                        {
                          benchmark.avgMs.toFixed(
                            1,
                          )
                        }{" "}
                        ms
                      </strong>
                    </article>
                    <article>
                      <span>
                        P50
                      </span>
                      <strong>
                        {
                          benchmark.p50Ms.toFixed(
                            1,
                          )
                        }{" "}
                        ms
                      </strong>
                    </article>
                    <article>
                      <span>
                        P95
                      </span>
                      <strong>
                        {
                          benchmark.p95Ms.toFixed(
                            1,
                          )
                        }{" "}
                        ms
                      </strong>
                    </article>
                    <article>
                      <span>
                        Confidence media
                      </span>
                      <strong>
                        {pct(
                          benchmark.avgConfidence,
                        )}
                      </strong>
                    </article>
                  </div>
                </section>
              ) : null}
            </>
          ) : (
            <p>
              Ejecutando pipeline…
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
