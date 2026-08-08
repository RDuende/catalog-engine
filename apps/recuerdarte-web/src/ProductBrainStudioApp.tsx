import {
  useEffect,
  useMemo,
  useState,
} from "react";

interface ProductSummary {
  readonly id: string;
  readonly sku?: string;
  readonly name: string;
  readonly category?: string;
  readonly provider?: string;
  readonly price?: number;
  readonly canonicalInterests:
    readonly string[];
  readonly materials:
    readonly string[];
  readonly techniques:
    readonly string[];
  readonly roles:
    readonly string[];
  readonly images:
    readonly string[];
  readonly primaryImage?: string;
}

interface SearchResult {
  readonly total: number;
  readonly items:
    readonly ProductSummary[];
}

interface Warning {
  readonly code: string;
  readonly severity: string;
  readonly message: string;
  readonly evidence:
    readonly string[];
}

interface Detail {
  readonly product:
    ProductSummary & {
      readonly raw:
        Readonly<Record<string, unknown>>;
      readonly productBrain?:
        Readonly<Record<string, unknown>>;
    };
  readonly knowledgeProfile:
    unknown;
  readonly enrichment:
    unknown;
  readonly warnings:
    readonly Warning[];
  readonly imageResolution?: {
    readonly selected: readonly {
      readonly publicUrl: string;
      readonly kind: string;
      readonly score: number;
    }[];
    readonly all: readonly {
      readonly publicUrl: string;
      readonly kind: string;
      readonly selected: boolean;
      readonly reason: string;
    }[];
    readonly diagnostics: {
      readonly totalCandidates: number;
      readonly selectedCount: number;
      readonly discardedCount: number;
      readonly duplicateCount: number;
      readonly thumbnailCount: number;
      readonly previewCount: number;
      readonly iconCount: number;
    };
  };
  readonly xray:
    readonly {
      readonly stage: string;
      readonly status:
        "PASS" | "WARNING";
      readonly summary: string;
      readonly output: unknown;
    }[];
}

interface Stats {
  readonly generatedAt: string;
  readonly snapshotPath: string;
  readonly totalProducts: number;
  readonly withInterests: number;
  readonly withoutInterests: number;
  readonly withMaterials: number;
  readonly withTechniques: number;
  readonly withRoles: number;
  readonly warningCount: number;
  readonly coveragePercent: number;
  readonly topInterests:
    readonly {
      readonly id: string;
      readonly count: number;
    }[];
  readonly topMaterials:
    readonly {
      readonly id: string;
      readonly count: number;
    }[];
  readonly topTechniques:
    readonly {
      readonly id: string;
      readonly count: number;
    }[];
}

function downloadJson(
  filename: string,
  value: unknown,
): void {
  const blob = new Blob(
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

function stamp(): string {
  return new Date()
    .toISOString()
    .replace(/[:.]/gu, "-");
}

function productImageUrl(
  productId: string,
  imageIndex: number,
): string {
  return (
    `/api/v1/product-brain-studio/products/` +
    `${encodeURIComponent(productId)}/images/${imageIndex}`
  );
}

export function ProductBrainStudioApp() {
  const initialProductId =
    new URLSearchParams(window.location.search)
      .get("productId") ??
    "";

  const [query, setQuery] =
    useState(initialProductId);
  const [warningsOnly, setWarningsOnly] =
    useState(false);
  const [orphanOnly, setOrphanOnly] =
    useState(false);
  const [search, setSearch] =
    useState<SearchResult>({
      total: 0,
      items: [],
    });
  const [stats, setStats] =
    useState<Stats>();
  const [selectedId, setSelectedId] =
    useState<string>();
  const [detail, setDetail] =
    useState<Detail>();
  const [selectedImageIndex, setSelectedImageIndex] =
    useState(0);
  const [imageFailed, setImageFailed] =
    useState(false);
  const [tab, setTab] =
    useState<
      "profile" |
      "evidence" |
      "xray" |
      "raw"
    >("profile");
  const [busy, setBusy] =
    useState(false);
  const [error, setError] =
    useState<string>();

  const selected =
    useMemo(
      () =>
        search.items.find(
          (item) =>
            item.id === selectedId,
        ),
      [search.items, selectedId],
    );

  async function loadStats(): Promise<void> {
    const response =
      await fetch(
        "/api/v1/product-brain-studio/stats",
      );

    if (!response.ok) {
      throw new Error(
        `Estadísticas HTTP ${response.status}`,
      );
    }

    setStats(
      await response.json() as Stats,
    );
  }

  async function runSearch(): Promise<void> {
    setBusy(true);
    setError(undefined);

    try {
      const params =
        new URLSearchParams();

      if (query.trim()) {
        params.set(
          "q",
          query.trim(),
        );
      }

      if (warningsOnly) {
        params.set(
          "warningsOnly",
          "true",
        );
      }

      if (orphanOnly) {
        params.set(
          "orphanOnly",
          "true",
        );
      }

      params.set("limit", "100");

      const response =
        await fetch(
          `/api/v1/product-brain-studio/products?${params}`,
        );

      if (!response.ok) {
        throw new Error(
          `Búsqueda HTTP ${response.status}`,
        );
      }

      const result =
        await response.json() as
          SearchResult;

      setSearch(result);

      if (
        result.items.length > 0 &&
        !result.items.some(
          (item) =>
            item.id === selectedId,
        )
      ) {
        setSelectedId(
          result.items[0]?.id,
        );
      }
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

  async function loadDetail(
    productId: string,
  ): Promise<void> {
    setBusy(true);
    setError(undefined);

    try {
      const response =
        await fetch(
          `/api/v1/product-brain-studio/products/${encodeURIComponent(productId)}`,
        );

      if (!response.ok) {
        const payload =
          await response.json() as {
            error?: string;
          };

        throw new Error(
          payload.error ??
          `Detalle HTTP ${response.status}`,
        );
      }

      const loaded =
        await response.json() as Detail;

      setDetail(loaded);
      const primaryIndex =
        loaded.product.primaryImage
          ? Math.max(
              0,
              loaded.product.images.indexOf(
                loaded.product.primaryImage,
              ),
            )
          : 0;

      setSelectedImageIndex(
        primaryIndex,
      );
      setImageFailed(false);
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
    if (!initialProductId) return;

    setSelectedId(initialProductId);
    void loadDetail(initialProductId);
  }, []);

  useEffect(() => {
    void Promise.all([
      loadStats(),
      runSearch(),
    ]).catch((reason: unknown) => {
      setError(
        reason instanceof Error
          ? reason.message
          : String(reason),
      );
    });
  }, []);

  useEffect(() => {
    if (selectedId) {
      void loadDetail(selectedId);
    }
  }, [selectedId]);

  async function copyDebug(): Promise<void> {
    await navigator.clipboard.writeText(
      JSON.stringify(
        {
          exportedAt:
            new Date().toISOString(),
          query,
          warningsOnly,
          orphanOnly,
          stats,
          selected,
          detail,
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

  function exportDebug(): void {
    downloadJson(
      `product-brain-studio-${selectedId ?? "overview"}-${stamp()}.json`,
      {
        exportedAt:
          new Date().toISOString(),
        query,
        warningsOnly,
        orphanOnly,
        stats,
        search,
        selected,
        detail,
        url:
          window.location.href,
        userAgent:
          navigator.userAgent,
      },
    );
  }

  return (
    <main className="pbs">
      <header className="pbsHeader">
        <div>
          <p>
            RecuerdArte · Catálogo
          </p>
          <h1>
            Product Brain Studio
          </h1>
          <span>
            Explora, explica y depura cómo entiende Rai cada producto.
          </span>
        </div>

        <div className="pbsHeader__actions">
          <button
            type="button"
            onClick={() =>
              void copyDebug()
            }
          >
            Copiar para ChatGPT
          </button>
          <button
            type="button"
            onClick={exportDebug}
          >
            Exportar diagnóstico
          </button>
          <a href="/admin/tools">
            Consola de ingeniería
          </a>
        </div>
      </header>

      {error ? (
        <div className="pbsError">
          {error}
        </div>
      ) : null}

      {stats ? (
        <section className="pbsStats">
          <article>
            <span>Productos</span>
            <strong>
              {stats.totalProducts}
            </strong>
          </article>
          <article>
            <span>Cobertura</span>
            <strong>
              {
                stats.coveragePercent
              }
              %
            </strong>
          </article>
          <article>
            <span>Con intereses</span>
            <strong>
              {stats.withInterests}
            </strong>
          </article>
          <article>
            <span>Huérfanos</span>
            <strong>
              {
                stats.withoutInterests
              }
            </strong>
          </article>
          <article>
            <span>Advertencias</span>
            <strong>
              {stats.warningCount}
            </strong>
          </article>
        </section>
      ) : null}

      <section className="pbsSearch">
        <input
          value={query}
          onChange={(event) =>
            setQuery(
              event.target.value,
            )
          }
          onKeyDown={(event) => {
            if (
              event.key === "Enter"
            ) {
              void runSearch();
            }
          }}
          placeholder="Buscar por SKU, nombre, interés, material, técnica…"
        />
        <label>
          <input
            type="checkbox"
            checked={warningsOnly}
            onChange={(event) =>
              setWarningsOnly(
                event.target.checked,
              )
            }
          />
          Solo advertencias
        </label>
        <label>
          <input
            type="checkbox"
            checked={orphanOnly}
            onChange={(event) =>
              setOrphanOnly(
                event.target.checked,
              )
            }
          />
          Solo huérfanos
        </label>
        <button
          type="button"
          onClick={() =>
            void runSearch()
          }
          disabled={busy}
        >
          {busy
            ? "Analizando…"
            : "Buscar"}
        </button>
      </section>

      <div className="pbsLayout">
        <aside className="pbsResults">
          <header>
            <strong>
              {search.total} resultados
            </strong>
          </header>

          {search.items.map(
            (product) => (
              <button
                type="button"
                key={product.id}
                className={
                  product.id ===
                  selectedId
                    ? "is-active"
                    : ""
                }
                onClick={() =>
                  setSelectedId(
                    product.id,
                  )
                }
              >
                <span>
                  {product.sku ??
                    product.id}
                </span>
                <strong>
                  {product.name}
                </strong>
                <small>
                  {
                    product
                      .canonicalInterests
                      .slice(0, 3)
                      .join(" · ") ||
                    "sin intereses"
                  }
                </small>
              </button>
            ),
          )}
        </aside>

        <section className="pbsDetail">
          {detail ? (
            <>
              <header className="pbsProductHeader">
                <div>
                  <p>
                    {
                      detail.product
                        .sku ??
                      detail.product.id
                    }
                  </p>
                  <h2>
                    {
                      detail.product
                        .name
                    }
                  </h2>
                  <span>
                    {
                      detail.product
                        .category ??
                      "Sin categoría"
                    }
                    {" · "}
                    {
                      detail.product
                        .provider ??
                      "Proveedor desconocido"
                    }
                  </span>
                </div>

                <div>
                  <strong>
                    {typeof detail
                      .product.price ===
                    "number"
                      ? `${detail.product.price.toFixed(2)} €`
                      : "Precio desconocido"}
                  </strong>
                  <small>
                    {
                      detail.warnings
                        .length
                    }{" "}
                    observaciones
                  </small>
                </div>
              </header>

              <section className="pbsGallery">
                <div className="pbsGallery__main">
                  {(detail.imageResolution?.diagnostics.selectedCount ?? detail.product.images.length) > 0 &&
                  !imageFailed ? (
                    <img
                      src={productImageUrl(
                        detail.product.id,
                        selectedImageIndex,
                      )}
                      alt={detail.product.name}
                      loading="eager"
                      onError={() =>
                        setImageFailed(true)
                      }
                    />
                  ) : (
                    <div className="pbsGallery__empty">
                      <strong>
                        Imagen no disponible
                      </strong>
                      <span>
                        No se encontró una copia local ni una URL accesible.
                      </span>
                    </div>
                  )}
                </div>

                {(detail.imageResolution?.diagnostics.selectedCount ?? detail.product.images.length) > 1 ? (
                  <div className="pbsGallery__thumbs">
                    {Array.from({
                      length:
                        detail.imageResolution?.diagnostics.selectedCount ??
                        detail.product.images.length,
                    }).map((_image, index) => (
                        <button
                          type="button"
                          key={`${detail.product.id}-${index}`}
                          className={
                            index === selectedImageIndex
                              ? "is-active"
                              : ""
                          }
                          onClick={() => {
                            setSelectedImageIndex(index);
                            setImageFailed(false);
                          }}
                          title={`Imagen ${index + 1}`}
                        >
                          <img
                            src={productImageUrl(
                              detail.product.id,
                              index,
                            )}
                            alt={`${detail.product.name} ${index + 1}`}
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.style.opacity =
                                "0.25";
                            }}
                          />
                        </button>
                      ),
                    )}
                  </div>
                ) : null}
              </section>

              <nav className="pbsTabs">
                {[
                  ["profile", "Perfil IA"],
                  [
                    "evidence",
                    "Evidencias",
                  ],
                  ["xray", "Rayos X"],
                  ["raw", "JSON"],
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
                          key as
                            typeof tab,
                        )
                      }
                    >
                      {label}
                    </button>
                  ),
                )}
              </nav>

              {tab === "profile" ? (
                <div className="pbsProfileGrid">
                  <section>
                    <h3>Intereses</h3>
                    <div className="pbsChips">
                      {detail.product
                        .canonicalInterests
                        .length
                        ? detail.product
                            .canonicalInterests
                            .map(
                              (item) => (
                                <span
                                  key={
                                    item
                                  }
                                >
                                  {
                                    item
                                  }
                                </span>
                              ),
                            )
                        : (
                          <em>
                            Sin intereses
                          </em>
                        )}
                    </div>
                  </section>

                  <section>
                    <h3>Materiales</h3>
                    <div className="pbsChips">
                      {detail.product
                        .materials
                        .map(
                          (item) => (
                            <span
                              key={item}
                            >
                              {item}
                            </span>
                          ),
                        )}
                    </div>
                  </section>

                  <section>
                    <h3>Técnicas</h3>
                    <div className="pbsChips">
                      {detail.product
                        .techniques
                        .map(
                          (item) => (
                            <span
                              key={item}
                            >
                              {item}
                            </span>
                          ),
                        )}
                    </div>
                  </section>

                  <section>
                    <h3>Roles</h3>
                    <div className="pbsChips">
                      {detail.product
                        .roles
                        .map(
                          (item) => (
                            <span
                              key={item}
                            >
                              {item}
                            </span>
                          ),
                        )}
                    </div>
                  </section>

                  <section className="pbsWarnings">
                    <h3>
                      Control de calidad
                    </h3>
                    {detail.warnings
                      .length ? (
                      detail.warnings.map(
                        (
                          warning,
                          index,
                        ) => (
                          <article
                            key={`${warning.code}-${index}`}
                            className={
                              warning.severity
                            }
                          >
                            <strong>
                              {
                                warning.code
                              }
                            </strong>
                            <p>
                              {
                                warning.message
                              }
                            </p>
                          </article>
                        ),
                      )
                    ) : (
                      <p>
                        No se han detectado observaciones.
                      </p>
                    )}
                  </section>
                </div>
              ) : null}

              {tab === "evidence" ? (
                <div className="pbsCodeView">
                  <h3>
                    Knowledge Brain
                  </h3>
                  <pre>
                    {JSON.stringify(
                      detail
                        .knowledgeProfile,
                      null,
                      2,
                    )}
                  </pre>
                  <h3>
                    Catalog Enrichment
                  </h3>
                  <pre>
                    {JSON.stringify(
                      detail.enrichment,
                      null,
                      2,
                    )}
                  </pre>
                </div>
              ) : null}

              {tab === "xray" ? (
                <>
                  {detail.imageResolution ? (
                    <section className="pbsImageDiagnostics">
                      <h3>Resolución de imágenes</h3>
                      <div>
                        <span>Encontradas <strong>{detail.imageResolution.diagnostics.totalCandidates}</strong></span>
                        <span>Usadas <strong>{detail.imageResolution.diagnostics.selectedCount}</strong></span>
                        <span>Miniaturas <strong>{detail.imageResolution.diagnostics.thumbnailCount}</strong></span>
                        <span>Duplicadas <strong>{detail.imageResolution.diagnostics.duplicateCount}</strong></span>
                      </div>
                      <table>
                        <thead>
                          <tr>
                            <th>Tipo</th>
                            <th>Estado</th>
                            <th>Motivo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail.imageResolution.all.map((image, index) => (
                            <tr key={`${image.publicUrl}-${index}`}>
                              <td>{image.kind}</td>
                              <td>{image.selected ? "Usada" : "Descartada"}</td>
                              <td>{image.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </section>
                  ) : null}
                  <div className="pbsXray">
                  {detail.xray.map(
                    (stage, index) => (
                      <article
                        key={
                          stage.stage
                        }
                      >
                        <div>
                          <span>
                            {index + 1}
                          </span>
                          <i />
                        </div>
                        <section>
                          <header>
                            <h3>
                              {
                                stage.stage
                              }
                            </h3>
                            <b
                              className={
                                stage.status
                              }
                            >
                              {
                                stage.status
                              }
                            </b>
                          </header>
                          <p>
                            {
                              stage.summary
                            }
                          </p>
                          <details>
                            <summary>
                              Ver salida
                            </summary>
                            <pre>
                              {JSON.stringify(
                                stage.output,
                                null,
                                2,
                              )}
                            </pre>
                          </details>
                        </section>
                      </article>
                    ),
                  )}
                  </div>
                </>
              ) : null}
              {tab === "raw" ? (
                <div className="pbsCodeView">
                  <pre>
                    {JSON.stringify(
                      detail.product.raw,
                      null,
                      2,
                    )}
                  </pre>
                </div>
              ) : null}
            </>
          ) : (
            <div className="pbsEmpty">
              Selecciona un producto.
            </div>
          )}
        </section>

        <aside className="pbsCoverage">
          <h2>Cobertura</h2>

          <section>
            <h3>
              Intereses principales
            </h3>
            {stats?.topInterests
              .slice(0, 12)
              .map((item) => (
                <div key={item.id}>
                  <span>
                    {item.id}
                  </span>
                  <progress
                    max={
                      stats
                        .topInterests[0]
                        ?.count ?? 1
                    }
                    value={
                      item.count
                    }
                  />
                  <b>
                    {item.count}
                  </b>
                </div>
              ))}
          </section>

          <section>
            <h3>
              Materiales
            </h3>
            {stats?.topMaterials
              .slice(0, 8)
              .map((item) => (
                <div key={item.id}>
                  <span>
                    {item.id}
                  </span>
                  <b>
                    {item.count}
                  </b>
                </div>
              ))}
          </section>

          <small>
            Snapshot:
            <br />
            {stats?.snapshotPath}
          </small>
        </aside>
      </div>
    </main>
  );
}
