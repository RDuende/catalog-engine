import {
  useEffect,
  useMemo,
  useState,
} from "react";

interface ProposalBrainCandidate {
  readonly id: string;
  readonly sku?: string;
  readonly name: string;
  readonly category?: string;
  readonly price?: number;
  readonly stock?: number;
  readonly score?: number;
  readonly imageUrl?: string;
  readonly images?: readonly string[];
  readonly canonicalInterests?: readonly string[];
  readonly materials?: readonly string[];
  readonly personalizationAvailable?: boolean;
  readonly marginPercent?: number;
  readonly bundleRoles?: readonly string[];
}

interface ConfidenceFactor {
  readonly key: string;
  readonly label: string;
  readonly impact: number;
  readonly reason: string;
}

interface Proposal {
  readonly id: string;
  readonly title: string;
  readonly strategy: string;
  readonly candidateIds: readonly string[];
  readonly primaryCandidateId?: string;
  readonly estimatedPrice?: number;
  readonly withinBudget: boolean;
  readonly diversityScore: number;
  readonly score: number;
  readonly confidence: number;
  readonly rankingScore: number;
  readonly reasons: readonly string[];
  readonly warnings: readonly string[];
  readonly confidenceBreakdown: {
    readonly score: number;
    readonly summary: string;
    readonly factors: readonly ConfidenceFactor[];
  };
  readonly explanation: {
    readonly short: string;
    readonly detailed: string;
    readonly strengths: readonly string[];
    readonly risks: readonly string[];
  };
  readonly optimizedBundle?: {
    readonly candidateIds: readonly string[];
    readonly totalPrice?: number;
    readonly withinBudget: boolean;
    readonly diversityScore: number;
    readonly compatibilityScore: number;
    readonly emotionalScore: number;
    readonly commercialScore: number;
    readonly finalScore: number;
    readonly components: readonly {
      readonly productId: string;
      readonly role: string;
      readonly reason: string;
    }[];
  };
}

interface ProposalBrainResult {
  readonly generatedAt: string;
  readonly input: {
    readonly recipientLabel?: string;
    readonly occasion?: string;
    readonly budget?: number;
    readonly interests?: readonly string[];
    readonly strategy?: string;
    readonly targetItemCount?: number;
    readonly confidence?: number;
    readonly candidates: readonly ProposalBrainCandidate[];
  };
  readonly rankedCandidates: readonly {
    readonly candidate: ProposalBrainCandidate;
    readonly relevanceScore: number;
    readonly budgetScore: number;
    readonly personalizationScore: number;
    readonly stockScore: number;
    readonly commercialScore: number;
    readonly emotionalScore: number;
    readonly noveltyScore: number;
    readonly productionScore: number;
    readonly visualQualityScore: number;
    readonly compatibilityScore: number;
    readonly weightedScore: number;
    readonly reasons: readonly string[];
    readonly warnings: readonly string[];
  }[];
  readonly proposals: readonly Proposal[];
  readonly diagnostics: {
    readonly inputCandidates: number;
    readonly rankedCandidates: number;
    readonly optimizedBundles: number;
    readonly returnedProposals: number;
  };
}

const fallbackInput = {
  recipientLabel: "mi padre",
  occasion: "cumpleaños",
  budget: 70,
  interests: ["motocross", "madera"],
  strategy: "HERO_PLUS_COMPLEMENTS",
  targetItemCount: 3,
  confidence: 0.86,
  candidates: [
    {
      id: "p1",
      sku: "P1",
      name: "Termo personalizado motocross",
      category: "botellas",
      price: 24,
      stock: 20,
      score: 0.9,
      canonicalInterests: ["motocross"],
      personalizationAvailable: true,
      marginPercent: 55,
      bundleRoles: ["HERO"],
      imageUrl: "/placeholder-product.png",
    },
    {
      id: "p2",
      sku: "P2",
      name: "Llavero de madera",
      category: "llaveros",
      price: 9,
      stock: 50,
      score: 0.78,
      canonicalInterests: ["madera"],
      materials: ["madera"],
      personalizationAvailable: true,
      marginPercent: 60,
      bundleRoles: ["COMPLEMENT"],
      imageUrl: "/placeholder-product.png",
    },
    {
      id: "p3",
      sku: "P3",
      name: "Caja de madera",
      category: "packaging",
      price: 14,
      stock: 8,
      score: 0.7,
      materials: ["madera"],
      personalizationAvailable: true,
      marginPercent: 45,
      bundleRoles: ["PACKAGING"],
      imageUrl: "/placeholder-product.png",
    },
    {
      id: "p4",
      sku: "P4",
      name: "Taza motocross",
      category: "tazas",
      price: 13,
      stock: 30,
      score: 0.83,
      canonicalInterests: ["motocross"],
      personalizationAvailable: true,
      marginPercent: 58,
      bundleRoles: ["COMPLEMENT"],
      imageUrl: "/placeholder-product.png",
    },
  ],
};

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function money(value: number | undefined): string {
  return value === undefined
    ? "—"
    : `${value.toFixed(2)} €`;
}

function downloadText(
  filename: string,
  content: string,
  type: string,
): void {
  const blob =
    new Blob(
      [content],
      { type },
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

function proposalMarkdown(
  proposal: Proposal,
  result: ProposalBrainResult,
): string {
  const products =
    proposal.candidateIds
      .map(
        (id) =>
          result.input.candidates.find(
            (candidate) =>
              candidate.id === id,
          ),
      )
      .filter(
        (
          candidate,
        ): candidate is ProposalBrainCandidate =>
          Boolean(candidate),
      );

  return [
    `# ${proposal.title}`,
    "",
    `**Strategy:** ${proposal.strategy}`,
    `**Score:** ${percent(proposal.score)}`,
    `**Confidence:** ${percent(proposal.confidence)}`,
    `**Estimated price:** ${money(proposal.estimatedPrice)}`,
    `**Within budget:** ${proposal.withinBudget ? "Yes" : "No"}`,
    "",
    "## Explanation",
    "",
    proposal.explanation.detailed,
    "",
    "## Products",
    "",
    ...products.map(
      (product) =>
        `- ${product.name}${product.price !== undefined ? ` — ${money(product.price)}` : ""}`,
    ),
    "",
    "## Strengths",
    "",
    ...proposal.explanation.strengths.map(
      (strength) =>
        `- ${strength}`,
    ),
    "",
    "## Risks",
    "",
    ...(
      proposal.explanation.risks.length
        ? proposal.explanation.risks
        : ["None detected."]
    ).map(
      (risk) =>
        `- ${risk}`,
    ),
    "",
    "## Confidence",
    "",
    ...proposal.confidenceBreakdown.factors.map(
      (factor) =>
        `- ${factor.impact >= 0 ? "+" : ""}${Math.round(factor.impact * 100)}% — ${factor.label}: ${factor.reason}`,
    ),
    "",
  ].join("\n");
}

export function ProposalBrainStudioApp() {
  const [input, setInput] =
    useState(
      JSON.stringify(
        fallbackInput,
        null,
        2,
      ),
    );

  const [result, setResult] =
    useState<ProposalBrainResult>();

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState<string>();

  const [selectedId, setSelectedId] =
    useState<string>();

  const [tab, setTab] =
    useState<
      "proposal" |
      "compare" |
      "ranking" |
      "xray"
    >("proposal");

  async function run(): Promise<void> {
    setBusy(true);
    setError(undefined);

    try {
      const parsed =
        JSON.parse(input);

      const response =
        await fetch(
          "/api/v1/proposal-brain/v2/analyze",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json",
            },
            body:
              JSON.stringify(parsed),
          },
        );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`,
        );
      }

      const current =
        await response.json() as ProposalBrainResult;

      setResult(current);
      setSelectedId(
        current.proposals[0]?.id,
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

  const selected =
    result?.proposals.find(
      (proposal) =>
        proposal.id === selectedId,
    ) ??
    result?.proposals[0];

  const products =
    useMemo(
      () =>
        selected && result
          ? selected.candidateIds
              .map(
                (id) =>
                  result.input.candidates.find(
                    (candidate) =>
                      candidate.id === id,
                  ),
              )
              .filter(
                (
                  candidate,
                ): candidate is ProposalBrainCandidate =>
                  Boolean(candidate),
              )
          : [],
      [selected, result],
    );

  async function copyDiagnostic(): Promise<void> {
    await navigator.clipboard.writeText(
      JSON.stringify(
        {
          input:
            JSON.parse(input),
          result,
          selected,
          href:
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
    <main className="proposalStudio">
      <header className="proposalStudio__header">
        <div>
          <p>
            RecuerdArte · Inteligencia
          </p>
          <h1>
            Proposal Brain Studio
          </h1>
          <span>
            Generación, ranking, comparación y Rayos X de propuestas.
          </span>
        </div>

        <div className="proposalStudio__actions">
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
              downloadText(
                `proposal-brain-${new Date().toISOString().replace(/[:.]/gu, "-")}.json`,
                JSON.stringify(
                  {
                    input:
                      JSON.parse(input),
                    result,
                  },
                  null,
                  2,
                ),
                "application/json;charset=utf-8",
              )
            }
          >
            Exportar JSON
          </button>

          <button
            type="button"
            onClick={() =>
              selected &&
              result &&
              downloadText(
                `proposal-${selected.id}.md`,
                proposalMarkdown(
                  selected,
                  result,
                ),
                "text/markdown;charset=utf-8",
              )
            }
          >
            Exportar Markdown
          </button>

          <a href="/admin/tools">
            Consola de ingeniería
          </a>
        </div>
      </header>

      {error ? (
        <div className="proposalStudio__error">
          {error}
        </div>
      ) : null}

      <div className="proposalStudio__layout">
        <aside className="proposalStudio__input">
          <header>
            <div>
              <h2>Entrada</h2>
              <span>
                Gift Brain + candidatos
              </span>
            </div>
          </header>

          <textarea
            value={input}
            spellCheck={false}
            onChange={(event) =>
              setInput(
                event.target.value,
              )
            }
          />

          <button
            type="button"
            onClick={() =>
              void run()
            }
            disabled={busy}
          >
            {busy
              ? "Generando propuestas…"
              : "Ejecutar Proposal Brain"}
          </button>
        </aside>

        <section className="proposalStudio__workspace">
          {result ? (
            <>
              <section className="proposalStudio__metrics">
                <article>
                  <span>Candidatos</span>
                  <strong>
                    {
                      result.diagnostics
                        .inputCandidates
                    }
                  </strong>
                </article>
                <article>
                  <span>Rankeados</span>
                  <strong>
                    {
                      result.diagnostics
                        .rankedCandidates
                    }
                  </strong>
                </article>
                <article>
                  <span>Bundles</span>
                  <strong>
                    {
                      result.diagnostics
                        .optimizedBundles
                    }
                  </strong>
                </article>
                <article>
                  <span>Propuestas</span>
                  <strong>
                    {
                      result.diagnostics
                        .returnedProposals
                    }
                  </strong>
                </article>
              </section>

              <section className="proposalStudio__cards">
                {result.proposals.map(
                  (
                    proposal,
                    index,
                  ) => (
                    <button
                      type="button"
                      key={proposal.id}
                      className={
                        proposal.id ===
                        selected?.id
                          ? "is-active"
                          : ""
                      }
                      onClick={() =>
                        setSelectedId(
                          proposal.id,
                        )
                      }
                    >
                      <span>
                        Propuesta{" "}
                        {index + 1}
                      </span>
                      <strong>
                        {
                          proposal.title
                        }
                      </strong>
                      <div>
                        <b>
                          {percent(
                            proposal.score,
                          )}
                        </b>
                        <small>
                          Conf.{" "}
                          {percent(
                            proposal.confidence,
                          )}
                        </small>
                      </div>
                    </button>
                  ),
                )}
              </section>

              <nav className="proposalStudio__tabs">
                {[
                  [
                    "proposal",
                    "Propuesta",
                  ],
                  [
                    "compare",
                    "Comparador",
                  ],
                  [
                    "ranking",
                    "Ranking",
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

              {tab === "proposal" &&
              selected ? (
                <section className="proposalStudio__detail">
                  <header>
                    <div>
                      <span>
                        {
                          selected.strategy
                        }
                      </span>
                      <h2>
                        {
                          selected.title
                        }
                      </h2>
                      <p>
                        {
                          selected
                            .explanation
                            .short
                        }
                      </p>
                    </div>

                    <div className="proposalStudio__scoreHero">
                      <strong>
                        {percent(
                          selected.score,
                        )}
                      </strong>
                      <span>
                        Score
                      </span>
                      <b>
                        {percent(
                          selected.confidence,
                        )}
                      </b>
                      <small>
                        Confidence
                      </small>
                    </div>
                  </header>

                  <section className="proposalStudio__products">
                    {products.map(
                      (product) => {
                        const component =
                          selected.optimizedBundle
                            ?.components
                            .find(
                              (item) =>
                                item.productId ===
                                product.id,
                            );

                        return (
                          <article
                            key={
                              product.id
                            }
                          >
                            <div className="proposalStudio__image">
                              {product.imageUrl ? (
                                <img
                                  src={
                                    product.imageUrl
                                  }
                                  alt={
                                    product.name
                                  }
                                  loading="lazy"
                                />
                              ) : (
                                <span>
                                  Sin imagen
                                </span>
                              )}
                            </div>

                            <div>
                              <span>
                                {
                                  component?.role ??
                                  "ITEM"
                                }
                              </span>
                              <h3>
                                {
                                  product.name
                                }
                              </h3>
                              <p>
                                {money(
                                  product.price,
                                )}
                              </p>
                              {component ? (
                                <small>
                                  {
                                    component.reason
                                  }
                                </small>
                              ) : null}
                            </div>
                          </article>
                        );
                      },
                    )}
                  </section>

                  <section className="proposalStudio__scoreGrid">
                    {[
                      [
                        "Diversidad",
                        selected
                          .optimizedBundle
                          ?.diversityScore ??
                          selected.diversityScore,
                      ],
                      [
                        "Compatibilidad",
                        selected
                          .optimizedBundle
                          ?.compatibilityScore ??
                          0,
                      ],
                      [
                        "Emoción",
                        selected
                          .optimizedBundle
                          ?.emotionalScore ??
                          0,
                      ],
                      [
                        "Comercial",
                        selected
                          .optimizedBundle
                          ?.commercialScore ??
                          0,
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
                            {percent(
                              value as number,
                            )}
                          </strong>
                        </article>
                      ),
                    )}
                  </section>

                  <section className="proposalStudio__explanation">
                    <h3>
                      ¿Por qué esta propuesta?
                    </h3>
                    <p>
                      {
                        selected
                          .explanation
                          .detailed
                      }
                    </p>

                    <div>
                      <article>
                        <h4>
                          Fortalezas
                        </h4>
                        <ul>
                          {selected.explanation.strengths.map(
                            (strength) => (
                              <li
                                key={
                                  strength
                                }
                              >
                                {
                                  strength
                                }
                              </li>
                            ),
                          )}
                        </ul>
                      </article>

                      <article>
                        <h4>
                          Riesgos
                        </h4>
                        <ul>
                          {selected.explanation.risks.length ? (
                            selected.explanation.risks.map(
                              (risk) => (
                                <li
                                  key={
                                    risk
                                  }
                                >
                                  {risk}
                                </li>
                              ),
                            )
                          ) : (
                            <li>
                              Sin riesgos relevantes.
                            </li>
                          )}
                        </ul>
                      </article>
                    </div>
                  </section>

                  <section className="proposalStudio__confidence">
                    <h3>
                      Confidence Engine
                    </h3>
                    <strong>
                      {
                        selected
                          .confidenceBreakdown
                          .summary
                      }
                    </strong>

                    {selected.confidenceBreakdown.factors.map(
                      (factor) => (
                        <article
                          key={
                            factor.key
                          }
                        >
                          <b
                            className={
                              factor.impact >=
                              0
                                ? "is-positive"
                                : "is-negative"
                            }
                          >
                            {factor.impact >=
                            0
                              ? "+"
                              : ""}
                            {Math.round(
                              factor.impact *
                                100,
                            )}
                            %
                          </b>
                          <div>
                            <strong>
                              {
                                factor.label
                              }
                            </strong>
                            <p>
                              {
                                factor.reason
                              }
                            </p>
                          </div>
                        </article>
                      ),
                    )}
                  </section>
                </section>
              ) : null}

              {tab === "compare" ? (
                <section className="proposalStudio__compare">
                  <table>
                    <thead>
                      <tr>
                        <th>
                          Métrica
                        </th>
                        {result.proposals.map(
                          (
                            proposal,
                            index,
                          ) => (
                            <th
                              key={
                                proposal.id
                              }
                            >
                              P
                              {index +
                                1}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {(
                        [
                          [
                            "Score",
                            (proposal: Proposal) =>
                              percent(
                                proposal.score,
                              ),
                          ],
                          [
                            "Confidence",
                            (proposal: Proposal) =>
                              percent(
                                proposal.confidence,
                              ),
                          ],
                          [
                            "Precio",
                            (proposal: Proposal) =>
                              money(
                                proposal.estimatedPrice,
                              ),
                          ],
                          [
                            "Dentro presupuesto",
                            (proposal: Proposal) =>
                              proposal.withinBudget
                                ? "Sí"
                                : "No",
                          ],
                          [
                            "Diversidad",
                            (proposal: Proposal) =>
                              percent(
                                proposal.diversityScore,
                              ),
                          ],
                          [
                            "Compatibilidad",
                            (proposal: Proposal) =>
                              percent(
                                proposal.optimizedBundle?.compatibilityScore ??
                                  0,
                              ),
                          ],
                          [
                            "Emoción",
                            (proposal: Proposal) =>
                              percent(
                                proposal.optimizedBundle?.emotionalScore ??
                                  0,
                              ),
                          ],
                          [
                            "Artículos",
                            (proposal: Proposal) =>
                              String(
                                proposal.candidateIds.length,
                              ),
                          ],
                        ] satisfies ReadonlyArray<
                          readonly [
                            string,
                            (proposal: Proposal) => string,
                          ]
                        >
                      ).map(
                        ([label, getter]) => (
                          <tr
                            key={
                              label as string
                            }
                          >
                            <th>
                              {label}
                            </th>
                            {result.proposals.map(
                              (
                                proposal,
                              ) => (
                                <td
                                  key={
                                    proposal.id
                                  }
                                >
                                  {getter(
                                    proposal,
                                  )}
                                </td>
                              ),
                            )}
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </section>
              ) : null}

              {tab === "ranking" ? (
                <section className="proposalStudio__ranking">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>
                          Producto
                        </th>
                        <th>
                          Final
                        </th>
                        <th>
                          Afinidad
                        </th>
                        <th>
                          Emoción
                        </th>
                        <th>
                          Presupuesto
                        </th>
                        <th>
                          Stock
                        </th>
                        <th>
                          Visual
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.rankedCandidates.map(
                        (
                          item,
                          index,
                        ) => (
                          <tr
                            key={
                              item
                                .candidate
                                .id
                            }
                          >
                            <td>
                              {index +
                                1}
                            </td>
                            <td>
                              <strong>
                                {
                                  item
                                    .candidate
                                    .name
                                }
                              </strong>
                            </td>
                            <td>
                              {percent(
                                item.weightedScore,
                              )}
                            </td>
                            <td>
                              {percent(
                                item.relevanceScore,
                              )}
                            </td>
                            <td>
                              {percent(
                                item.emotionalScore,
                              )}
                            </td>
                            <td>
                              {percent(
                                item.budgetScore,
                              )}
                            </td>
                            <td>
                              {percent(
                                item.stockScore,
                              )}
                            </td>
                            <td>
                              {percent(
                                item.visualQualityScore,
                              )}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </section>
              ) : null}

              {tab === "xray" ? (
                <section className="proposalStudio__xray">
                  <h2>
                    Rayos X
                  </h2>

                  <article>
                    <strong>
                      Input
                    </strong>
                    <pre>
                      {JSON.stringify(
                        result.input,
                        null,
                        2,
                      )}
                    </pre>
                  </article>

                  <article>
                    <strong>
                      Propuestas
                    </strong>
                    <pre>
                      {JSON.stringify(
                        result.proposals,
                        null,
                        2,
                      )}
                    </pre>
                  </article>

                  <article>
                    <strong>
                      Ranking completo
                    </strong>
                    <pre>
                      {JSON.stringify(
                        result.rankedCandidates,
                        null,
                        2,
                      )}
                    </pre>
                  </article>
                </section>
              ) : null}
            </>
          ) : (
            <p>
              Ejecutando Proposal Brain…
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
