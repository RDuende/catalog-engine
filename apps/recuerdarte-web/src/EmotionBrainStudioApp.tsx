import {
  useEffect,
  useState,
} from "react";

interface EmotionEvidence {
  readonly text: string;
  readonly emotion: string;
  readonly weight: number;
  readonly reason: string;
}

interface EmotionResult {
  readonly generatedAt: string;
  readonly primaryEmotion: string;
  readonly secondaryEmotions: readonly string[];
  readonly style: string;
  readonly intensity: number;
  readonly confidence: number;
  readonly memoryWeight: number;
  readonly surpriseWeight: number;
  readonly humorWeight: number;
  readonly personalizationWeight: number;
  readonly weights: Readonly<Record<string, number>>;
  readonly evidence: readonly EmotionEvidence[];
  readonly explanation: string;
  readonly traces: readonly {
    readonly phase: string;
    readonly message: string;
    readonly data?: unknown;
  }[];
}

const starter = {
  message:
    "Quiero agradecerle todo lo que ha hecho por mí y emocionarlo mucho.",
  occasion:
    "cumpleaños",
  relationship:
    "muy cercana",
  desiredImpact: [
    "emocionar",
    "agradecer",
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

export function EmotionBrainStudioApp() {
  const [payload, setPayload] =
    useState(
      JSON.stringify(
        starter,
        null,
        2,
      ),
    );

  const [result, setResult] =
    useState<EmotionResult>();

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
          "/api/v1/emotion-brain/analyze",
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
        await response.json() as EmotionResult,
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
    <main className="emotionStudio">
      <header className="emotionStudio__header">
        <div>
          <p>
            RecuerdArte · Emotional Intelligence
          </p>
          <h1>
            Emotion Brain Studio
          </h1>
          <span>
            Emoción, intensidad, confianza, evidencias y pesos de decisión.
          </span>
        </div>

        <div className="emotionStudio__actions">
          <button
            type="button"
            onClick={() =>
              void run()
            }
            disabled={busy}
          >
            {busy
              ? "Analizando…"
              : "Ejecutar Emotion Brain"}
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
                `emotion-brain-${new Date().toISOString().replace(/[:.]/gu, "-")}.json`,
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
            Consola
          </a>
        </div>
      </header>

      {error ? (
        <div className="emotionStudio__error">
          {error}
        </div>
      ) : null}

      <div className="emotionStudio__layout">
        <aside className="emotionStudio__input">
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

        <section className="emotionStudio__workspace">
          {result ? (
            <>
              <section className="emotionStudio__summary">
                <article>
                  <span>
                    Emoción principal
                  </span>
                  <strong>
                    {
                      result.primaryEmotion
                    }
                  </strong>
                </article>

                <article>
                  <span>
                    Intensidad
                  </span>
                  <strong>
                    {pct(
                      result.intensity,
                    )}
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
                    Estilo
                  </span>
                  <strong>
                    {
                      result.style
                    }
                  </strong>
                </article>
              </section>

              <section className="emotionStudio__decision">
                <h2>
                  {
                    result.explanation
                  }
                </h2>

                {result.secondaryEmotions.length ? (
                  <p>
                    Secundarias:{" "}
                    {
                      result.secondaryEmotions.join(
                        ", ",
                      )
                    }
                  </p>
                ) : null}
              </section>

              <section className="emotionStudio__weights">
                {[
                  [
                    "Memoria",
                    result.memoryWeight,
                  ],
                  [
                    "Sorpresa",
                    result.surpriseWeight,
                  ],
                  [
                    "Humor",
                    result.humorWeight,
                  ],
                  [
                    "Personalización",
                    result.personalizationWeight,
                  ],
                ].map(
                  ([label, value]) => (
                    <article
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
                        {pct(
                          value as number,
                        )}
                      </strong>
                    </article>
                  ),
                )}
              </section>

              <section className="emotionStudio__evidence">
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
                        key={`${evidence.emotion}-${index}`}
                      >
                        <div>
                          <span>
                            {
                              evidence.emotion
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
                    Sin evidencias explícitas fuertes.
                  </p>
                )}
              </section>

              <section className="emotionStudio__matrix">
                <h2>
                  Matriz emocional
                </h2>

                {Object.entries(
                  result.weights,
                ).map(
                  ([key, value]) => (
                    <article
                      key={key}
                    >
                      <span>
                        {key}
                      </span>
                      <progress
                        max={1}
                        value={value}
                      />
                      <strong>
                        {pct(value)}
                      </strong>
                    </article>
                  ),
                )}
              </section>

              <section className="emotionStudio__xray">
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
              Analizando emoción…
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
