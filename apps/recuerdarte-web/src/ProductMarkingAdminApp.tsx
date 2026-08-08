import { FormEvent, useEffect, useMemo, useState } from "react";

type Facet = { value: string; count: number };

type FilterOptions = {
  productBrain: {
    storedBrains: number;
    canonicalProducts: number;
    joinedProducts: number;
    ready: number;
    reviewRequired: number;
    genericObjects: number;
  };
  quickStats: {
    totalProducts: number;
    ready: number;
    reviewRequired: number;
    genericObjects: number;
    missingPrimaryImage: number;
  };
  facets?: {
    objectTypes: Facet[];
    techniques: Facet[];
    materials: Facet[];
    categories: Facet[];
    interests: Facet[];
    brainStatuses: Facet[];
    personalizations: Facet[];
  };
  objectTypes: string[];
  techniques: string[];
  materials: string[];
  categories: string[];
  interests: string[];
  brainStatuses: string[];
  personalizations: string[];
  markingStatuses: string[];
};

type ProductListItem = {
  productId?: string;
  externalId?: string;
  sku?: string;
  name: string;
  description?: string;
  images: readonly string[];
  primaryImageUrl?: string;
  objectType?: string;
  categories: readonly string[];
  materials: readonly string[];
  catalogTechniques: readonly string[];
  interests: readonly string[];
  roles?: readonly string[];
  brainStatus: string;
  classificationConfidence?: number;
  personalization: string;
  marking: {
    areas: number;
    calibrated: number;
    pending: number;
    techniques: readonly string[];
  };
};

type ProductListResponse = {
  status: string;
  total: number;
  page: number;
  limit: number;
  pages: number;
  items: ProductListItem[];
};

type Area = {
  areaId: string;
  name: string;
  providerAreaId?: string;
  providerPositionId?: string;
  maxWidthMm?: number;
  maxHeightMm?: number;
  geometryStatus: "CALIBRATED" | "PLACEHOLDER";
  techniques: Array<{
    code: string;
    name: string;
    providerCode?: string;
    providerVariantCode?: string;
    providerOfficial?: boolean;
  }>;
};

type ProductDetail = {
  status: string;
  product: Omit<ProductListItem, "marking">;
  marking?: { areas: Area[] };
};

type Filters = {
  objectType: string[];
  technique: string[];
  material: string[];
  category: string[];
  interest: string[];
  marking: string;
  brainStatus: string[];
  personalization: string[];
  imageStatus: string;
  sort: string;
};

const API = "/api/v1";
const SEP = "\u001f";

const EMPTY_FILTERS: Filters = {
  objectType: [],
  technique: [],
  material: [],
  category: [],
  interest: [],
  marking: "",
  brainStatus: [],
  personalization: [],
  imageStatus: "",
  sort: "name_asc",
};

const MARKING_LABELS: Record<string, string> = {
  WITH_AREAS: "Con áreas de marcaje",
  WITHOUT_AREAS: "Sin áreas de marcaje",
  PENDING_POSITION: "Áreas pendientes de posicionar",
  FULLY_POSITIONED: "Todas las áreas posicionadas",
  ONE_AREA: "1 área",
  TWO_AREAS: "2 áreas",
  THREE_PLUS: "3 o más áreas",
};

const BRAIN_LABELS: Record<string, string> = {
  READY: "Listo",
  REVIEW_REQUIRED: "Necesita revisión",
  UNKNOWN: "Sin clasificar",
};

const PERSONALIZATION_LABELS: Record<string, string> = {
  GENERIC_PERSONALIZABLE: "Genérico altamente personalizable",
  PERSONALIZABLE: "Personalizable",
  UNKNOWN: "Sin determinar",
};

function imgProxy(productId: string, index: number) {
  return `${API}/marking-intelligence/admin-products/${encodeURIComponent(productId)}/images/${index}`;
}

function areaImageProxy(productId: string, areaId: string) {
  return `${API}/marking-intelligence/products/${encodeURIComponent(productId)}/areas/${encodeURIComponent(areaId)}/image`;
}

function humanObjectType(value?: string) {
  if (!value) return "Sin clasificar";
  if (value === "generic_object") return "Objeto genérico";
  return value.replaceAll("_", " ");
}

function pct(value?: number) {
  if (typeof value !== "number") return "—";
  return `${Math.round(value * 100)}%`;
}

function facetOptions(
  values: readonly string[],
  facets: readonly Facet[] | undefined,
): Facet[] {
  if (facets?.length) return [...facets];
  return values.map((value) => ({ value, count: 0 }));
}

function MultiFilter(props: {
  label: string;
  values: readonly string[];
  options: readonly Facet[];
  onChange: (values: string[]) => void;
  render?: (value: string) => string;
}) {
  const selected = new Set(props.values);

  return (
    <div className="paFilter">
      <span className="paFilter__label">{props.label}</span>
      <select
        value=""
        onChange={(event) => {
          const value = event.target.value;
          if (!value || selected.has(value)) return;
          props.onChange([...props.values, value]);
        }}
      >
        <option value="">Añadir filtro…</option>
        {props.options
          .filter((item) => !selected.has(item.value))
          .map((item) => (
            <option key={item.value} value={item.value}>
              {props.render ? props.render(item.value) : item.value}
              {item.count ? ` (${item.count})` : ""}
            </option>
          ))}
      </select>
      {props.values.length > 0 && (
        <div className="paMiniChips">
          {props.values.map((value) => (
            <button
              key={value}
              type="button"
              className="paMiniChip"
              onClick={() => props.onChange(props.values.filter((item) => item !== value))}
            >
              {props.render ? props.render(value) : value} ×
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductMarkingAdminApp() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialProductId = searchParams.get("productId") ?? undefined;

  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [options, setOptions] = useState<FilterOptions>();
  const [list, setList] = useState<ProductListResponse>();
  const [detail, setDetail] = useState<ProductDetail>();
  const [selectedId, setSelectedId] = useState<string>();
  const [showMore, setShowMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();

  function setFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  async function loadOptions() {
    const response = await fetch(`${API}/marking-intelligence/admin-products/filter-options`);
    const json = await response.json() as FilterOptions & { message?: string };
    if (!response.ok) throw new Error(json.message ?? `HTTP ${response.status}`);
    setOptions(json);
  }

  async function loadList(search = q, page = 1, current = filters) {
    setBusy(true);
    setError(undefined);

    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      params.set("page", String(page));
      params.set("limit", "30");

      const entries: Array<[keyof Filters, Filters[keyof Filters]]> = [
        ["objectType", current.objectType],
        ["technique", current.technique],
        ["material", current.material],
        ["category", current.category],
        ["interest", current.interest],
        ["marking", current.marking],
        ["brainStatus", current.brainStatus],
        ["personalization", current.personalization],
        ["imageStatus", current.imageStatus],
        ["sort", current.sort],
      ];

      for (const [key, value] of entries) {
        if (Array.isArray(value)) {
          if (value.length) params.set(key, value.join(SEP));
        } else if (value) {
          params.set(key, value);
        }
      }

      const response = await fetch(
        `${API}/marking-intelligence/admin-products?${params.toString()}`,
      );
      const json = await response.json() as ProductListResponse & { message?: string };
      if (!response.ok) throw new Error(json.message ?? `HTTP ${response.status}`);
      setList(json);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  async function loadDetail(productId: string) {
    setBusy(true);
    setError(undefined);
    setNotice(undefined);

    try {
      const response = await fetch(
        `${API}/marking-intelligence/admin-products/${encodeURIComponent(productId)}`,
      );
      const json = await response.json() as ProductDetail & { message?: string };
      if (!response.ok) throw new Error(json.message ?? `HTTP ${response.status}`);
      setDetail(json);
      setSelectedId(productId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  async function setPrimaryImage(imageUrl: string) {
    const productId = detail?.product.productId;
    if (!productId) return;

    setBusy(true);
    setError(undefined);
    setNotice(undefined);

    try {
      const response = await fetch(
        `${API}/marking-intelligence/admin-products/${encodeURIComponent(productId)}/primary-image`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ primaryImageUrl: imageUrl }),
        },
      );
      const json = await response.json() as ProductDetail & { message?: string };
      if (!response.ok) throw new Error(json.message ?? `HTTP ${response.status}`);
      setDetail(json);
      setNotice("Imagen principal guardada.");
      await loadList(q, list?.page ?? 1, filters);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  function clearFilters() {
    setQ("");
    setFilters(EMPTY_FILTERS);
    void loadList("", 1, EMPTY_FILTERS);
  }

  function quickFilter(next: Partial<Filters>) {
    const merged: Filters = { ...EMPTY_FILTERS, ...next };
    setFilters(merged);
    setQ("");
    void loadList("", 1, merged);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void loadList(q, 1, filters);
  }

  useEffect(() => {
    void Promise.all([loadOptions(), loadList("", 1, EMPTY_FILTERS)])
      .then(() => {
        if (initialProductId) void loadDetail(initialProductId);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : String(cause)));
  }, []);

  const images = detail?.product.images ?? [];
  const primaryIndex = useMemo(() => {
    const current = detail?.product.primaryImageUrl;
    return current ? images.indexOf(current) : -1;
  }, [detail, images]);

  const activeCount =
    filters.objectType.length +
    filters.technique.length +
    filters.material.length +
    filters.category.length +
    filters.interest.length +
    filters.brainStatus.length +
    filters.personalization.length +
    Number(Boolean(filters.marking)) +
    Number(Boolean(filters.imageStatus)) +
    Number(Boolean(q.trim()));

  const quick = options?.quickStats;

  return (
    <main className="pa">
      <div className="paShell">
        <header className="paHeader">
          <div>
            <span className="paEyebrow">RecuerdArte · Administración</span>
            <h1>Productos y marcaje</h1>
            <p>
              Catálogo, Product Brain, imágenes, técnicas y áreas de personalización.
            </p>
          </div>
          <div className="paHeader__actions">
            <a className="paButton paButton--secondary" href="/admin">← Administración</a>
            <a className="paButton paButton--secondary" href="/admin/product-brain-studio">
              Product Brain Studio
            </a>
          </div>
        </header>

        <section className="paStats">
          <button type="button" onClick={() => quickFilter({})}>
            <span>Productos</span><strong>{quick?.totalProducts ?? "…"}</strong><small>Catálogo Makito</small>
          </button>
          <button type="button" onClick={() => quickFilter({ brainStatus: ["READY"] })}>
            <span>Listos</span><strong>{quick?.ready ?? "…"}</strong><small>Product Brain READY</small>
          </button>
          <button type="button" onClick={() => quickFilter({ brainStatus: ["REVIEW_REQUIRED"] })}>
            <span>Revisar</span><strong>{quick?.reviewRequired ?? "…"}</strong><small>Product Brain</small>
          </button>
          <button type="button" onClick={() => quickFilter({ objectType: ["generic_object"] })}>
            <span>Objeto genérico</span><strong>{quick?.genericObjects ?? "…"}</strong><small>Clasificación pendiente</small>
          </button>
          <button type="button" onClick={() => quickFilter({ imageStatus: "WITHOUT_PRIMARY" })}>
            <span>Sin imagen</span><strong>{quick?.missingPrimaryImage ?? "…"}</strong><small>Imagen principal</small>
          </button>
          <button type="button" onClick={() => quickFilter({ marking: "PENDING_POSITION", sort: "pending_desc" })}>
            <span>Marcaje</span><strong>→</strong><small>Áreas pendientes de posicionar</small>
          </button>
        </section>

        <form className="paFilters" onSubmit={submit}>
          <div className="paSearchRow">
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Buscar nombre, SKU, referencia, objeto, material, técnica o interés…"
            />
            <button className="paButton paButton--primary" disabled={busy}>Aplicar filtros</button>
            <button className="paButton paButton--secondary" type="button" onClick={clearFilters}>
              Limpiar {activeCount ? `(${activeCount})` : ""}
            </button>
          </div>

          <div className="paFilterGrid">
            <MultiFilter
              label="Tipo de objeto"
              values={filters.objectType}
              options={facetOptions(options?.objectTypes ?? [], options?.facets?.objectTypes)}
              onChange={(value) => setFilter("objectType", value)}
              render={humanObjectType}
            />
            <MultiFilter
              label="Técnica"
              values={filters.technique}
              options={facetOptions(options?.techniques ?? [], options?.facets?.techniques)}
              onChange={(value) => setFilter("technique", value)}
            />
            <MultiFilter
              label="Material"
              values={filters.material}
              options={facetOptions(options?.materials ?? [], options?.facets?.materials)}
              onChange={(value) => setFilter("material", value)}
            />
            <label className="paFilter">
              <span className="paFilter__label">Estado de marcaje</span>
              <select value={filters.marking} onChange={(e) => setFilter("marking", e.target.value)}>
                <option value="">Todos</option>
                {(options?.markingStatuses ?? []).map((value) => (
                  <option key={value} value={value}>{MARKING_LABELS[value] ?? value}</option>
                ))}
              </select>
            </label>
            <button
              className="paButton paButton--more"
              type="button"
              onClick={() => setShowMore((value) => !value)}
            >
              {showMore ? "Menos filtros" : "Más filtros"}
            </button>
          </div>

          {showMore && (
            <div className="paFilterGrid paFilterGrid--more">
              <MultiFilter
                label="Categoría"
                values={filters.category}
                options={facetOptions(options?.categories ?? [], options?.facets?.categories)}
                onChange={(value) => setFilter("category", value)}
              />
              <MultiFilter
                label="Interés / temática"
                values={filters.interest}
                options={facetOptions(options?.interests ?? [], options?.facets?.interests)}
                onChange={(value) => setFilter("interest", value)}
              />
              <MultiFilter
                label="Product Brain"
                values={filters.brainStatus}
                options={facetOptions(options?.brainStatuses ?? [], options?.facets?.brainStatuses)}
                onChange={(value) => setFilter("brainStatus", value)}
                render={(value) => BRAIN_LABELS[value] ?? value}
              />
              <MultiFilter
                label="Personalización"
                values={filters.personalization}
                options={facetOptions(options?.personalizations ?? [], options?.facets?.personalizations)}
                onChange={(value) => setFilter("personalization", value)}
                render={(value) => PERSONALIZATION_LABELS[value] ?? value}
              />
              <label className="paFilter">
                <span className="paFilter__label">Imagen principal</span>
                <select value={filters.imageStatus} onChange={(e) => setFilter("imageStatus", e.target.value)}>
                  <option value="">Todas</option>
                  <option value="WITH_PRIMARY">Con imagen principal</option>
                  <option value="WITHOUT_PRIMARY">Sin imagen principal</option>
                </select>
              </label>
              <label className="paFilter">
                <span className="paFilter__label">Ordenar</span>
                <select value={filters.sort} onChange={(e) => setFilter("sort", e.target.value)}>
                  <option value="name_asc">Nombre A–Z</option>
                  <option value="name_desc">Nombre Z–A</option>
                  <option value="sku_asc">Referencia</option>
                  <option value="areas_desc">Más áreas de marcaje</option>
                  <option value="pending_desc">Más áreas pendientes</option>
                </select>
              </label>
            </div>
          )}
        </form>

        <div className={`paWorkspace ${detail ? "paWorkspace--detail" : ""}`}>
          <section className="paListPanel">
            <div className="paListHeader">
              <strong>{list?.total ?? 0} productos</strong>
              <span>Página {list?.page ?? 1} / {list?.pages ?? 1}</span>
            </div>

            <div className="paProductList">
              {list?.items.map((product) => {
                const id = product.productId;
                const imageIndex =
                  product.primaryImageUrl
                    ? Math.max(0, product.images.indexOf(product.primaryImageUrl))
                    : 0;

                return (
                  <button
                    className={`paProduct ${selectedId === id ? "is-selected" : ""}`}
                    type="button"
                    key={id ?? `${product.sku}-${product.name}`}
                    disabled={!id}
                    onClick={() => id && void loadDetail(id)}
                  >
                    <div className="paProduct__image">
                      {id && product.images.length > 0 ? (
                        <img src={imgProxy(id, imageIndex)} alt={product.name} />
                      ) : <span>Sin imagen</span>}
                    </div>

                    <div className="paProduct__body">
                      <div className="paProduct__top">
                        <strong>{product.name}</strong>
                        <span>{pct(product.classificationConfidence)}</span>
                      </div>
                      <small>Ref. {product.sku ?? product.externalId ?? "—"} · Makito</small>
                      <div className="paProduct__object">
                        {humanObjectType(product.objectType)}
                      </div>
                      <div className="paBadges">
                        <span className={`paBadge ${product.brainStatus === "READY" ? "paBadge--ok" : "paBadge--warn"}`}>
                          {BRAIN_LABELS[product.brainStatus] ?? product.brainStatus}
                        </span>
                        <span className="paBadge">{product.marking.areas} áreas</span>
                        {product.marking.pending > 0 ? (
                          <span className="paBadge paBadge--warn">
                            {product.marking.pending} pendiente{product.marking.pending === 1 ? "" : "s"}
                          </span>
                        ) : product.marking.areas > 0 ? (
                          <span className="paBadge paBadge--ok">Posicionadas</span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {list && list.pages > 1 && (
              <div className="paPager">
                <button
                  type="button"
                  disabled={busy || list.page <= 1}
                  onClick={() => void loadList(q, list.page - 1, filters)}
                >
                  ← Anterior
                </button>
                <span>{list.page} / {list.pages}</span>
                <button
                  type="button"
                  disabled={busy || list.page >= list.pages}
                  onClick={() => void loadList(q, list.page + 1, filters)}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </section>

          {detail ? (
            <section className="paDetail">
              <article className="paCard">
                <div className="paDetailHeader">
                  <div>
                    <span className="paEyebrow">Ficha administrativa</span>
                    <h2>{detail.product.name}</h2>
                    <p>SKU {detail.product.sku ?? "—"} · Makito ID {detail.product.externalId ?? "—"}</p>
                  </div>
                  <div className="paDetailHeader__actions">
                    <a
                      className="paButton paButton--secondary"
                      href={`/admin/product-brain-studio?productId=${encodeURIComponent(detail.product.sku ?? detail.product.externalId ?? detail.product.productId ?? "")}`}
                    >
                      Editar Product Brain
                    </a>
                    <button
                      className="paButton paButton--secondary"
                      type="button"
                      onClick={() => { setDetail(undefined); setSelectedId(undefined); }}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>

                <div className="paInfoGrid">
                  <div><span>Objeto</span><strong>{humanObjectType(detail.product.objectType)}</strong></div>
                  <div><span>Product Brain</span><strong>{BRAIN_LABELS[detail.product.brainStatus] ?? detail.product.brainStatus}</strong></div>
                  <div><span>Confianza</span><strong>{pct(detail.product.classificationConfidence)}</strong></div>
                  <div><span>Personalización</span><strong>{PERSONALIZATION_LABELS[detail.product.personalization] ?? detail.product.personalization}</strong></div>
                </div>

                <div className="paMetadata">
                  {detail.product.materials.length > 0 && (
                    <div><strong>Materiales:</strong> {detail.product.materials.join(" · ")}</div>
                  )}
                  {detail.product.interests.length > 0 && (
                    <div><strong>Intereses:</strong> {detail.product.interests.join(" · ")}</div>
                  )}
                  {detail.product.categories.length > 0 && (
                    <details>
                      <summary>Categorías ({detail.product.categories.length})</summary>
                      <div>{detail.product.categories.join(" · ")}</div>
                    </details>
                  )}
                </div>

                <div className="paSectionTitle">
                  <div>
                    <h3>Imagen principal</h3>
                    <p>Se elige independientemente del área de marcaje.</p>
                  </div>
                </div>

                {images.length > 0 ? (
                  <div className="paGallery">
                    {images.map((url, index) => {
                      const active = index === primaryIndex;
                      return (
                        <button
                          type="button"
                          className={`paGalleryItem ${active ? "is-primary" : ""}`}
                          key={`${url}-${index}`}
                          onClick={() => void setPrimaryImage(url)}
                        >
                          <img
                            src={imgProxy(detail.product.productId!, index)}
                            alt={`Imagen ${index + 1}`}
                          />
                          {active && <span>★ Principal</span>}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="paEmpty">Este producto no tiene imágenes disponibles.</div>
                )}
              </article>

              <article className="paCard">
                <div className="paSectionTitle">
                  <div>
                    <h3>Marcaje y personalización</h3>
                    <p>Técnicas, medidas máximas y posición visual de cada área.</p>
                  </div>
                </div>

                {detail.marking?.areas.length ? (
                  <div className="paAreas">
                    {detail.marking.areas.map((area) => (
                      <div className="paArea" key={area.areaId}>
                        <div className="paArea__image">
                          <img
                            src={areaImageProxy(detail.product.productId!, area.areaId)}
                            alt={`Marcaje ${area.name}`}
                          />
                        </div>
                        <div className="paArea__body">
                          <div className="paArea__title">
                            <strong>{area.name}</strong>
                            <span className={`paBadge ${area.geometryStatus === "CALIBRATED" ? "paBadge--ok" : "paBadge--warn"}`}>
                              {area.geometryStatus === "CALIBRATED"
                                ? "Área posicionada"
                                : "Área pendiente de posicionar"}
                            </span>
                          </div>
                          <p>
                            Máximo: <strong>{area.maxWidthMm ?? "?"} × {area.maxHeightMm ?? "?"} mm</strong>
                          </p>
                          <div className="paTechniques">
                            {area.techniques.map((technique) => (
                              <span key={`${technique.providerCode}-${technique.code}`}>
                                <strong>{technique.name}</strong>
                                {technique.providerVariantCode ? ` · ${technique.providerVariantCode}` : ""}
                                {technique.providerOfficial ? " · oficial" : ""}
                              </span>
                            ))}
                          </div>
                        </div>
                        <a
                          className="paButton paButton--primary"
                          href={`/admin/marking-geometry?productId=${encodeURIComponent(detail.product.productId!)}&areaId=${encodeURIComponent(area.areaId)}`}
                        >
                          {area.geometryStatus === "CALIBRATED" ? "Revisar posición →" : "Posicionar área →"}
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="paEmpty">
                    Este producto no tiene áreas de marcaje importadas.
                  </div>
                )}
              </article>

              {notice && <div className="paNotice">{notice}</div>}
            </section>
          ) : (
            <section className="paWelcome">
              <strong>Selecciona un producto</strong>
              <p>
                Aquí podrás revisar su clasificación, elegir la imagen principal
                y administrar todas sus áreas y técnicas de marcaje.
              </p>
            </section>
          )}
        </div>

        {busy && <div className="paBusy">Actualizando catálogo…</div>}
        {error && <div className="paError">{error}</div>}
      </div>
    </main>
  );
}
