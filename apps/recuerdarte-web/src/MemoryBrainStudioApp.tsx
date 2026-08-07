import {
  useEffect,
  useState,
} from "react";

interface MemoryRecord {
  readonly id: string;
  readonly subjectKey: string;
  readonly kind: string;
  readonly scope: string;
  readonly key: string;
  readonly value: unknown;
  readonly confidence: number;
  readonly source: string;
  readonly sourceRef?: string;
  readonly learnedAt: string;
  readonly updatedAt: string;
  readonly supersedes?: string;
  readonly tags: readonly string[];
}

interface MemorySnapshot {
  readonly generatedAt: string;
  readonly subjectKey: string;
  readonly records: readonly MemoryRecord[];
  readonly summary: Readonly<Record<string, unknown>>;
}

const starter = {
  conversationId:
    "demo-memory",
  recipientLabel:
    "mi padre",
  relationship:
    "muy cercana",
  occasion:
    "cumpleaños",
  budget: 70,
  interests: [
    "motocross",
    "madera",
  ],
  personality: [
    "práctico",
  ],
  desiredImpact: [
    "sorprender",
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

  const anchor =
    document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function MemoryBrainStudioApp() {
  const [payload, setPayload] =
    useState(
      JSON.stringify(
        starter,
        null,
        2,
      ),
    );

  const [subjectKey, setSubjectKey] =
    useState(
      "recipient:mi padre",
    );

  const [snapshot, setSnapshot] =
    useState<MemorySnapshot>();

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState<string>();

  const [selected, setSelected] =
    useState<MemoryRecord>();

  async function refresh(
    currentSubject =
      subjectKey,
  ): Promise<void> {
    setBusy(true);
    setError(undefined);

    try {
      const response =
        await fetch(
          `/api/v1/memory-brain/snapshot/${encodeURIComponent(currentSubject)}`,
        );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`,
        );
      }

      const current =
        await response.json() as MemorySnapshot;

      setSnapshot(current);
      setSelected(
        current.records[0],
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

  async function learnConversation(): Promise<void> {
    setBusy(true);
    setError(undefined);

    try {
      const body =
        JSON.parse(payload);

      const response =
        await fetch(
          "/api/v1/memory-brain/learn-conversation",
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

      const nextSubject =
        typeof body.recipientLabel === "string"
          ? `recipient:${body.recipientLabel.toLowerCase()}`
          : subjectKey;

      setSubjectKey(
        nextSubject,
      );

      await refresh(
        nextSubject,
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : String(reason),
      );
      setBusy(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function copyDiagnostic(): Promise<void> {
    await navigator.clipboard.writeText(
      JSON.stringify(
        {
          subjectKey,
          snapshot,
          input:
            JSON.parse(payload),
        },
        null,
        2,
      ),
    );
  }

  return (
    <main className="memoryStudio">
      <header className="memoryStudio__header">
        <div>
          <p>
            RecuerdArte · Rai Memory
          </p>
          <h1>
            Memory Brain Studio
          </h1>
          <span>
            Recuerdos, confianza, origen, historial y conflictos.
          </span>
        </div>

        <div className="memoryStudio__actions">
          <button
            type="button"
            onClick={() =>
              void learnConversation()
            }
            disabled={busy}
          >
            Aprender conversación
          </button>

          <button
            type="button"
            onClick={() =>
              void refresh()
            }
            disabled={busy}
          >
            Actualizar
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
              snapshot &&
              downloadJson(
                `memory-${subjectKey.replace(/[^a-z0-9]+/giu, "-")}.json`,
                snapshot,
              )
            }
          >
            Exportar JSON
          </button>

          <a href="/admin/conversation-studio">
            Conversation Studio
          </a>
        </div>
      </header>

      {error ? (
        <div className="memoryStudio__error">
          {error}
        </div>
      ) : null}

      <div className="memoryStudio__layout">
        <aside className="memoryStudio__input">
          <label>
            Subject key
            <input
              value={subjectKey}
              onChange={(event) =>
                setSubjectKey(
                  event.target.value,
                )
              }
            />
          </label>

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

        <section className="memoryStudio__workspace">
          {snapshot ? (
            <>
              <section className="memoryStudio__summary">
                <article>
                  <span>
                    Recuerdos
                  </span>
                  <strong>
                    {
                      snapshot.records
                        .length
                    }
                  </strong>
                </article>

                <article>
                  <span>
                    Regalos previos
                  </span>
                  <strong>
                    {String(
                      snapshot.summary
                        .giftCount ??
                      0,
                    )}
                  </strong>
                </article>

                <article>
                  <span>
                    Presupuesto medio
                  </span>
                  <strong>
                    {typeof snapshot.summary
                      .averageBudget ===
                    "number"
                      ? `${(
                          snapshot.summary
                            .averageBudget as number
                        ).toFixed(2)} €`
                      : "—"}
                  </strong>
                </article>

                <article>
                  <span>
                    Intereses
                  </span>
                  <strong>
                    {Array.isArray(
                      snapshot.summary
                        .interests,
                    )
                      ? (
                          snapshot.summary
                            .interests as
                            readonly unknown[]
                        ).length
                      : 0}
                  </strong>
                </article>
              </section>

              <section className="memoryStudio__records">
                <div className="memoryStudio__list">
                  {snapshot.records.map(
                    (record) => (
                      <button
                        type="button"
                        key={
                          record.id
                        }
                        className={
                          selected?.id ===
                          record.id
                            ? "is-active"
                            : ""
                        }
                        onClick={() =>
                          setSelected(
                            record,
                          )
                        }
                      >
                        <span>
                          {
                            record.kind
                          }
                        </span>
                        <strong>
                          {
                            record.key
                          }
                        </strong>
                        <small>
                          {pct(
                            record.confidence,
                          )}{" "}
                          ·{" "}
                          {
                            record.source
                          }
                        </small>
                      </button>
                    ),
                  )}
                </div>

                <div className="memoryStudio__detail">
                  {selected ? (
                    <>
                      <header>
                        <div>
                          <span>
                            {
                              selected.kind
                            }
                          </span>
                          <h2>
                            {
                              selected.key
                            }
                          </h2>
                        </div>

                        <strong>
                          {pct(
                            selected.confidence,
                          )}
                        </strong>
                      </header>

                      <dl>
                        <div>
                          <dt>
                            Origen
                          </dt>
                          <dd>
                            {
                              selected.source
                            }
                          </dd>
                        </div>
                        <div>
                          <dt>
                            Scope
                          </dt>
                          <dd>
                            {
                              selected.scope
                            }
                          </dd>
                        </div>
                        <div>
                          <dt>
                            Aprendido
                          </dt>
                          <dd>
                            {
                              selected.learnedAt
                            }
                          </dd>
                        </div>
                        <div>
                          <dt>
                            Actualizado
                          </dt>
                          <dd>
                            {
                              selected.updatedAt
                            }
                          </dd>
                        </div>
                      </dl>

                      <h3>
                        Valor
                      </h3>
                      <pre>
                        {JSON.stringify(
                          selected.value,
                          null,
                          2,
                        )}
                      </pre>

                      {selected.supersedes ? (
                        <p>
                          Sustituye a{" "}
                          <code>
                            {
                              selected.supersedes
                            }
                          </code>
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p>
                      Selecciona un recuerdo.
                    </p>
                  )}
                </div>
              </section>

              <section className="memoryStudio__xray">
                <h2>
                  Rayos X
                </h2>
                <pre>
                  {JSON.stringify(
                    snapshot,
                    null,
                    2,
                  )}
                </pre>
              </section>
            </>
          ) : (
            <p>
              Cargando memoria…
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
