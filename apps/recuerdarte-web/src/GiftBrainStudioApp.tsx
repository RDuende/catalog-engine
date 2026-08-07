import {
  useEffect,
  useState,
} from "react";

interface GiftBrainResult {
  readonly generatedAt: string;
  readonly readyForProposals: boolean;
  readonly nextQuestion?: string;
  readonly profile: {
    readonly recipientLabel: string;
    readonly completeness: number;
    readonly missingFields: readonly string[];
  };
  readonly intent: {
    readonly primaryGoal: string;
    readonly confidence: number;
    readonly reasons: readonly string[];
  };
  readonly emotion: {
    readonly primary: string;
    readonly secondary: readonly string[];
    readonly intensity: number;
    readonly reasons: readonly string[];
  };
  readonly simulations: readonly {
    readonly strategy: {
      readonly id: string;
      readonly kind: string;
      readonly title: string;
      readonly description: string;
      readonly targetItemCount: number;
      readonly reasons: readonly string[];
      readonly warnings: readonly string[];
    };
    readonly emotionalScore: number;
    readonly commercialScore: number;
    readonly feasibilityScore: number;
    readonly personalizationScore: number;
    readonly finalScore: number;
    readonly explanation: string;
  }[];
  readonly decision?: {
    readonly selected: {
      readonly strategy: {
        readonly kind: string;
        readonly title: string;
      };
      readonly finalScore: number;
    };
    readonly confidence: number;
    readonly composerContext: Readonly<Record<string, unknown>>;
  };
  readonly traces: readonly {
    readonly phase: string;
    readonly message: string;
    readonly data?: unknown;
  }[];
}

const initialPayload = {
  recipientLabel: "mi padre",
  relationship: "muy cercana",
  occasion: "cumpleaños",
  age: 55,
  budget: 70,
  interests: [
    "motocross",
    "madera",
    "viajes",
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
};

function downloadJson(
  filename: string,
  value: unknown,
): void {
  const blob = new Blob(
    [JSON.stringify(value, null, 2)],
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

export function GiftBrainStudioApp() {
  const [payload, setPayload] =
    useState(
      JSON.stringify(
        initialPayload,
        null,
        2,
      ),
    );
  const [result, setResult] =
    useState<GiftBrainResult>();
  const [busy, setBusy] =
    useState(false);
  const [error, setError] =
    useState<string>();
  const [selectedIndex, setSelectedIndex] =
    useState(0);

  async function execute(): Promise<void> {
    setBusy(true);
    setError(undefined);

    try {
      const response =
        await fetch(
          "/api/v1/gift-brain/analyze",
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
        await response.json() as GiftBrainResult;

      setResult(current);
      setSelectedIndex(0);
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
    void execute();
  }, []);

  const selected =
    result?.simulations[
      selectedIndex
    ];

  async function copyDiagnostic(): Promise<void> {
    await navigator.clipboard.writeText(
      JSON.stringify(
        {
          payload:
            JSON.parse(payload),
          result,
          url:
            window.location.href,
          userAgent:
            navigator.userAgent,
        },
        null,
        2,
      ),
    );
  }

  return (
    <main className="giftBrainStudio">
      <header className="giftBrainStudio__header">
        <div>
          <p>
            RecuerdArte · Inteligencia
          </p>
          <h1>
            Gift Brain Studio
          </h1>
          <span>
            Perfil, intención, emoción, estrategia, simulación y decisión.
          </span>
        </div>

        <div className="giftBrainStudio__actions">
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
                `gift-brain-${new Date().toISOString().replace(/[:.]/gu, "-")}.json`,
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
          <a href="/admin/tools">
            Consola de ingeniería
          </a>
        </div>
      </header>

      {error ? (
        <div className="giftBrainStudio__error">
          {error}
        </div>
      ) : null}

      <div className="giftBrainStudio__layout">
        <section className="giftBrainStudio__panel">
          <header>
            <h2>Entrada</h2>
            <span>JSON editable</span>
          </header>

          <textarea
            value={payload}
            onChange={(event) =>
              setPayload(
                event.target.value,
              )
            }
            spellCheck={false}
          />

          <button
            type="button"
            onClick={() =>
              void execute()
            }
            disabled={busy}
          >
            {busy
              ? "Razonando…"
              : "Ejecutar Gift Brain"}
          </button>
        </section>

        <section className="giftBrainStudio__workspace">
          {result ? (
            <>
              <section className="giftBrainStudio__summary">
                <article>
                  <span>Completitud</span>
                  <strong>
                    {(
                      result.profile
                        .completeness *
                      100
                    ).toFixed(0)}
                    %
                  </strong>
                </article>
                <article>
                  <span>Intención</span>
                  <strong>
                    {
                      result.intent
                        .primaryGoal
                    }
                  </strong>
                </article>
                <article>
                  <span>Emoción</span>
                  <strong>
                    {
                      result.emotion
                        .primary
                    }
                  </strong>
                </article>
                <article>
                  <span>Estado</span>
                  <strong>
                    {result.readyForProposals
                      ? "LISTO"
                      : "DESCUBRIENDO"}
                  </strong>
                </article>
              </section>

              {!result.readyForProposals ? (
                <section className="giftBrainStudio__nextQuestion">
                  <span>
                    Siguiente pregunta
                  </span>
                  <strong>
                    {
                      result.nextQuestion
                    }
                  </strong>
                </section>
              ) : null}

              {result.decision ? (
                <section className="giftBrainStudio__decision">
                  <span>
                    Estrategia seleccionada
                  </span>
                  <h2>
                    {
                      result.decision
                        .selected
                        .strategy.title
                    }
                  </h2>
                  <p>
                    {
                      result.decision
                        .selected
                        .strategy.kind
                    }
                  </p>
                  <strong>
                    Confianza{" "}
                    {(
                      result.decision
                        .confidence *
                      100
                    ).toFixed(0)}
                    %
                  </strong>
                </section>
              ) : null}

              <section className="giftBrainStudio__simulations">
                <h2>
                  Simulaciones
                </h2>

                <div className="giftBrainStudio__simulationTabs">
                  {result.simulations.map(
                    (
                      simulation,
                      index,
                    ) => (
                      <button
                        type="button"
                        key={
                          simulation
                            .strategy.id
                        }
                        className={
                          index ===
                          selectedIndex
                            ? "is-active"
                            : ""
                        }
                        onClick={() =>
                          setSelectedIndex(
                            index,
                          )
                        }
                      >
                        <strong>
                          {
                            simulation
                              .strategy
                              .title
                          }
                        </strong>
                        <span>
                          {(
                            simulation
                              .finalScore *
                            100
                          ).toFixed(0)}
                          %
                        </span>
                      </button>
                    ),
                  )}
                </div>

                {selected ? (
                  <article className="giftBrainStudio__simulationDetail">
                    <header>
                      <div>
                        <span>
                          {
                            selected
                              .strategy.kind
                          }
                        </span>
                        <h3>
                          {
                            selected
                              .strategy.title
                          }
                        </h3>
                        <p>
                          {
                            selected
                              .strategy
                              .description
                          }
                        </p>
                      </div>
                      <strong>
                        {
                          selected
                            .strategy
                            .targetItemCount
                        }{" "}
                        artículos
                      </strong>
                    </header>

                    <div className="giftBrainStudio__scores">
                      {[
                        [
                          "Emoción",
                          selected
                            .emotionalScore,
                        ],
                        [
                          "Comercial",
                          selected
                            .commercialScore,
                        ],
                        [
                          "Viabilidad",
                          selected
                            .feasibilityScore,
                        ],
                        [
                          "Personalización",
                          selected
                            .personalizationScore,
                        ],
                      ].map(
                        ([label, value]) => (
                          <div
                            key={
                              label as string
                            }
                          >
                            <span>
                              {label}
                            </span>
                            <progress
                              max={1}
                              value={
                                value as number
                              }
                            />
                            <strong>
                              {(
                                (
                                  value as number
                                ) * 100
                              ).toFixed(0)}
                              %
                            </strong>
                          </div>
                        ),
                      )}
                    </div>

                    <p>
                      {
                        selected.explanation
                      }
                    </p>

                    <ul>
                      {selected.strategy.reasons.map(
                        (reason) => (
                          <li key={reason}>
                            {reason}
                          </li>
                        ),
                      )}
                    </ul>
                  </article>
                ) : null}
              </section>

              <section className="giftBrainStudio__xray">
                <h2>Rayos X</h2>
                {result.traces.map(
                  (trace, index) => (
                    <article
                      key={`${trace.phase}-${index}`}
                    >
                      <span>
                        {index + 1}
                      </span>
                      <div>
                        <strong>
                          {trace.phase}
                        </strong>
                        <p>
                          {trace.message}
                        </p>
                        {trace.data ? (
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
              Ejecutando Gift Brain…
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
