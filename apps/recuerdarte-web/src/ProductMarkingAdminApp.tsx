import { FormEvent, useEffect, useMemo, useState } from "react";

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
  brainStatus: string;
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

type FilterOptions = {
  objectTypes: string[];
  techniques: string[];
  materials: string[];
  categories: string[];
  interests: string[];
  brainStatuses: string[];
  personalizations: string[];
  markingStatuses: string[];
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
  product: {
    productId?: string;
    externalId?: string;
    sku?: string;
    name: string;
    description?: string;
    primaryImageUrl?: string;
    images: readonly string[];
    objectType?: string;
    categories: readonly string[];
    materials: readonly string[];
    catalogTechniques: readonly string[];
    interests: readonly string[];
    brainStatus: string;
    personalization: string;
  };
  marking?: { areas: Area[] };
};

type Filters = {
  objectType: string;
  technique: string;
  material: string;
  category: string;
  interest: string;
  marking: string;
  brainStatus: string;
  personalization: string;
  imageStatus: string;
  sort: string;
};

const EMPTY_FILTERS: Filters = {
  objectType: "",
  technique: "",
  material: "",
  category: "",
  interest: "",
  marking: "",
  brainStatus: "",
  personalization: "",
  imageStatus: "",
  sort: "name_asc",
};

const API = "/api/v1";

function imgProxy(productId: string, index: number) {
  return `${API}/marking-intelligence/admin-products/${encodeURIComponent(productId)}/images/${index}`;
}

function areaImageProxy(productId: string, areaId: string) {
  return `${API}/marking-intelligence/products/${encodeURIComponent(productId)}/areas/${encodeURIComponent(areaId)}/image`;
}

function labelMarking(value: string) {
  const map: Record<string, string> = {
    WITH_AREAS: "Con áreas de marcaje",
    WITHOUT_AREAS: "Sin áreas de marcaje",
    PENDING_POSITION: "Área pendiente de posicionar",
    FULLY_POSITIONED: "Todas las áreas posicionadas",
    ONE_AREA: "1 área",
    TWO_AREAS: "2 áreas",
    THREE_PLUS: "3 o más áreas",
  };
  return map[value] ?? value;
}

function labelBrain(value: string) {
  const map: Record<string, string> = {
    READY: "Listo",
    REVIEW_REQUIRED: "Necesita revisión",
    UNKNOWN: "Sin clasificar",
  };
  return map[value] ?? value;
}

function labelPersonalization(value: string) {
  const map: Record<string, string> = {
    GENERIC_PERSONALIZABLE: "Genérico altamente personalizable",
    PERSONALIZABLE: "Personalizable",
    UNKNOWN: "Sin determinar",
  };
  return map[value] ?? value;
}

function FilterSelect(props: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  render?: (value: string) => string;
}) {
  return (
    <label style={{ display: "grid", gap: 4, minWidth: 160 }}>
      <span style={{ fontSize: 11, fontWeight: 800, opacity: .58, textTransform: "uppercase", letterSpacing: ".06em" }}>
        {props.label}
      </span>
      <select
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        style={{ padding: "9px 10px", borderRadius: 9, border: "1px solid #d8d6ce", background: "white", font: "inherit", maxWidth: 260 }}
      >
        <option value="">Todos</option>
        {props.options.map((option) => (
          <option key={option} value={option}>{props.render ? props.render(option) : option}</option>
        ))}
      </select>
    </label>
  );
}

export function ProductMarkingAdminApp() {
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [options, setOptions] = useState<FilterOptions>();
  const [showMore, setShowMore] = useState(false);
  const [list, setList] = useState<ProductListResponse>();
  const [detail, setDetail] = useState<ProductDetail>();
  const [selectedId, setSelectedId] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();

  function setFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  async function loadOptions() {
    try {
      const response = await fetch(`${API}/marking-intelligence/admin-products/filter-options`);
      const json = await response.json() as FilterOptions & { message?: string };
      if (!response.ok) throw new Error(json.message ?? `HTTP ${response.status}`);
      setOptions(json);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  async function loadList(search = q, page = 1, state = filters) {
    setBusy(true);
    setError(undefined);

    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      params.set("page", String(page));
      params.set("limit", "30");

      for (const [key, value] of Object.entries(state)) {
        if (value) params.set(key, value);
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

  function submit(event: FormEvent) {
    event.preventDefault();
    void loadList(q, 1, filters);
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setQ("");
    void loadList("", 1, EMPTY_FILTERS);
  }

  useEffect(() => {
    void Promise.all([loadOptions(), loadList("", 1, EMPTY_FILTERS)]);
  }, []);

  const selectedImages = detail?.product.images ?? [];
  const currentPrimaryIndex = useMemo(() => {
    const current = detail?.product.primaryImageUrl;
    return current ? selectedImages.indexOf(current) : -1;
  }, [detail, selectedImages]);

  const activeFilters = [
    q ? `Búsqueda: ${q}` : "",
    filters.objectType ? `Objeto: ${filters.objectType}` : "",
    filters.technique ? `Técnica: ${filters.technique}` : "",
    filters.material ? `Material: ${filters.material}` : "",
    filters.category ? `Categoría: ${filters.category}` : "",
    filters.interest ? `Interés: ${filters.interest}` : "",
    filters.marking ? labelMarking(filters.marking) : "",
    filters.brainStatus ? `Product Brain: ${labelBrain(filters.brainStatus)}` : "",
    filters.personalization ? labelPersonalization(filters.personalization) : "",
    filters.imageStatus ? (filters.imageStatus === "WITH_PRIMARY" ? "Con imagen principal" : "Sin imagen principal") : "",
  ].filter(Boolean);

  return (
    <main style={{ minHeight: "100vh", background: "#f4f3ee", color: "#252820", fontFamily: "Inter,system-ui,sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 1580, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 18, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", opacity: .55 }}>
              RecuerdArte · Administración
            </div>
            <h1 style={{ margin: "5px 0", fontSize: 34 }}>Productos y marcaje</h1>
            <p style={{ margin: 0, opacity: .68 }}>
              Catálogo, Product Brain, imagen principal, técnicas y áreas de personalización.
            </p>
          </div>
          <a href="/admin" style={{ color: "inherit", fontWeight: 700 }}>← Administración</a>
        </header>

        <form
          onSubmit={submit}
          style={{ background: "white", padding: 16, borderRadius: 18, marginBottom: 16, boxShadow: "0 8px 28px rgba(0,0,0,.04)" }}
        >
          <div style={{ display: "flex", gap: 8, marginBottom: 13 }}>
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Buscar nombre, SKU, objeto, material, técnica, interés..."
              style={{ flex: 1, padding: "11px 13px", borderRadius: 10, border: "1px solid #d7d6cf", font: "inherit" }}
            />
            <button type="submit" disabled={busy} style={{ border: 0, borderRadius: 10, background: "#252820", color: "white", padding: "0 18px", fontWeight: 800 }}>
              Aplicar
            </button>
            <button type="button" onClick={clearFilters} style={{ border: "1px solid #d7d6cf", borderRadius: 10, background: "white", padding: "0 14px", fontWeight: 700 }}>
              Limpiar
            </button>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "end", flexWrap: "wrap" }}>
            <FilterSelect label="Tipo de objeto" value={filters.objectType} options={options?.objectTypes ?? []} onChange={(value) => setFilter("objectType", value)} />
            <FilterSelect label="Técnica" value={filters.technique} options={options?.techniques ?? []} onChange={(value) => setFilter("technique", value)} />
            <FilterSelect label="Material" value={filters.material} options={options?.materials ?? []} onChange={(value) => setFilter("material", value)} />
            <FilterSelect label="Estado marcaje" value={filters.marking} options={options?.markingStatuses ?? []} render={labelMarking} onChange={(value) => setFilter("marking", value)} />

            <button
              type="button"
              onClick={() => setShowMore((value) => !value)}
              style={{ padding: "9px 13px", borderRadius: 9, border: "1px solid #d8d6ce", background: "#f5f4ef", fontWeight: 800 }}
            >
              {showMore ? "Menos filtros" : "Más filtros"}
            </button>
          </div>

          {showMore && (
            <div style={{ display: "flex", gap: 10, alignItems: "end", flexWrap: "wrap", marginTop: 12, paddingTop: 12, borderTop: "1px solid #eee" }}>
              <FilterSelect label="Categoría" value={filters.category} options={options?.categories ?? []} onChange={(value) => setFilter("category", value)} />
              <FilterSelect label="Interés / temática" value={filters.interest} options={options?.interests ?? []} onChange={(value) => setFilter("interest", value)} />
              <FilterSelect label="Product Brain" value={filters.brainStatus} options={options?.brainStatuses ?? []} render={labelBrain} onChange={(value) => setFilter("brainStatus", value)} />
              <FilterSelect label="Personalización" value={filters.personalization} options={options?.personalizations ?? []} render={labelPersonalization} onChange={(value) => setFilter("personalization", value)} />
              <FilterSelect label="Imagen principal" value={filters.imageStatus} options={["WITH_PRIMARY", "WITHOUT_PRIMARY"]} render={(value) => value === "WITH_PRIMARY" ? "Con imagen principal" : "Sin imagen principal"} onChange={(value) => setFilter("imageStatus", value)} />
              <FilterSelect label="Ordenar" value={filters.sort} options={["name_asc", "name_desc", "sku_asc", "areas_desc", "pending_desc"]} render={(value) => ({
                name_asc: "Nombre A-Z",
                name_desc: "Nombre Z-A",
                sku_asc: "Referencia",
                areas_desc: "Más áreas de marcaje",
                pending_desc: "Más áreas pendientes",
              }[value] ?? value)} onChange={(value) => setFilter("sort", value)} />
            </div>
          )}

          {activeFilters.length > 0 && (
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 13 }}>
              {activeFilters.map((filter) => (
                <span key={filter} style={{ background: "#edf0e9", color: "#4a5c3a", borderRadius: 999, padding: "5px 9px", fontSize: 12, fontWeight: 700 }}>
                  {filter}
                </span>
              ))}
            </div>
          )}
        </form>

        <div style={{ display: "grid", gridTemplateColumns: detail ? "430px minmax(0,1fr)" : "1fr", gap: 20 }}>
          <section style={{ background: "white", borderRadius: 18, padding: 16, boxShadow: "0 8px 28px rgba(0,0,0,.05)", minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, opacity: .65, marginBottom: 10 }}>
              <strong>{list?.total ?? 0} productos</strong>
              <span>Página {list?.page ?? 1} / {list?.pages ?? 1}</span>
            </div>

            <div style={{ display: "grid", gap: 8, maxHeight: "calc(100vh - 340px)", overflow: "auto", paddingRight: 3 }}>
              {list?.items.map((product) => {
                const id = product.productId;
                const index = product.primaryImageUrl ? product.images.indexOf(product.primaryImageUrl) : 0;

                return (
                  <button
                    type="button"
                    key={id ?? `${product.sku}-${product.name}`}
                    disabled={!id}
                    onClick={() => id && void loadDetail(id)}
                    style={{
                      width: "100%",
                      display: "grid",
                      gridTemplateColumns: "76px minmax(0,1fr)",
                      gap: 12,
                      alignItems: "center",
                      textAlign: "left",
                      border: selectedId === id ? "2px solid #4a5c3a" : "1px solid #e3e1da",
                      background: selectedId === id ? "#f1f4ed" : "white",
                      borderRadius: 13,
                      padding: 9,
                      cursor: id ? "pointer" : "default",
                    }}
                  >
                    <div style={{ width: 76, height: 76, borderRadius: 10, overflow: "hidden", background: "#eee" }}>
                      {id && product.images.length ? (
                        <img src={imgProxy(id, Math.max(0, index))} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      ) : null}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ display: "block", fontSize: 15 }}>{product.name}</strong>
                      <span style={{ fontSize: 12, opacity: .6 }}>Ref. {product.sku ?? product.externalId ?? "—"} · Makito</span>
                      {product.objectType && <div style={{ fontSize: 12, marginTop: 3 }}>Objeto: <strong>{product.objectType}</strong></div>}
                      <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap", fontSize: 11 }}>
                        <span style={{ padding: "3px 7px", borderRadius: 999, background: "#efeee7" }}>{product.marking.areas} áreas</span>
                        {product.marking.pending > 0 ? (
                          <span style={{ padding: "3px 7px", borderRadius: 999, background: "#fff1d6", color: "#8b5c00" }}>
                            {product.marking.pending} pendiente{product.marking.pending === 1 ? "" : "s"} de posicionar
                          </span>
                        ) : product.marking.areas > 0 ? (
                          <span style={{ padding: "3px 7px", borderRadius: 999, background: "#e8f3e5", color: "#376c2d" }}>
                            Áreas posicionadas
                          </span>
                        ) : null}
                        <span style={{ padding: "3px 7px", borderRadius: 999, background: product.brainStatus === "READY" ? "#e8f3e5" : "#f3eeee" }}>
                          {labelBrain(product.brainStatus)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {list && list.pages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                <button type="button" disabled={busy || list.page <= 1} onClick={() => void loadList(q, list.page - 1, filters)}>← Anterior</button>
                <button type="button" disabled={busy || list.page >= list.pages} onClick={() => void loadList(q, list.page + 1, filters)}>Siguiente →</button>
              </div>
            )}
          </section>

          {detail && (
            <section style={{ display: "grid", gap: 18, minWidth: 0 }}>
              <article style={{ background: "white", borderRadius: 18, padding: 20, boxShadow: "0 8px 28px rgba(0,0,0,.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "start" }}>
                  <div>
                    <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".11em", opacity: .5 }}>Ficha de producto</div>
                    <h2 style={{ margin: "5px 0 3px", fontSize: 28 }}>{detail.product.name}</h2>
                    <div style={{ opacity: .62 }}>SKU {detail.product.sku ?? "—"} · Makito ID {detail.product.externalId ?? "—"}</div>
                  </div>
                  <button type="button" onClick={() => { setDetail(undefined); setSelectedId(undefined); }}>Cerrar ficha</button>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                  {detail.product.objectType && <span style={{ background: "#efeee7", borderRadius: 999, padding: "5px 9px" }}>Objeto: {detail.product.objectType}</span>}
                  <span style={{ background: "#efeee7", borderRadius: 999, padding: "5px 9px" }}>Product Brain: {labelBrain(detail.product.brainStatus)}</span>
                  <span style={{ background: "#efeee7", borderRadius: 999, padding: "5px 9px" }}>{labelPersonalization(detail.product.personalization)}</span>
                  {detail.product.materials.slice(0, 4).map((value) => <span key={value} style={{ background: "#efeee7", borderRadius: 999, padding: "5px 9px" }}>{value}</span>)}
                </div>

                <h3 style={{ marginTop: 24 }}>Imagen principal</h3>
                <p style={{ opacity: .65, marginTop: -7 }}>Selecciona independientemente la imagen comercial que debe representar el producto.</p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 12 }}>
                  {selectedImages.map((url, index) => {
                    const active = index === currentPrimaryIndex;
                    return (
                      <button
                        type="button"
                        key={`${url}-${index}`}
                        onClick={() => void setPrimaryImage(url)}
                        style={{ position: "relative", border: active ? "3px solid #4a5c3a" : "1px solid #ddd", borderRadius: 12, padding: 7, background: "white", cursor: "pointer" }}
                      >
                        <img src={imgProxy(detail.product.productId!, index)} alt={`Imagen ${index + 1}`} style={{ width: "100%", aspectRatio: "1/1", objectFit: "contain", display: "block" }} />
                        {active && <span style={{ position: "absolute", left: 7, top: 7, padding: "4px 7px", borderRadius: 999, background: "#4a5c3a", color: "white", fontSize: 11, fontWeight: 800 }}>★ Principal</span>}
                      </button>
                    );
                  })}
                </div>
              </article>

              <article style={{ background: "white", borderRadius: 18, padding: 20, boxShadow: "0 8px 28px rgba(0,0,0,.05)" }}>
                <h3 style={{ fontSize: 22, margin: "0 0 4px" }}>Marcaje y personalización</h3>
                <p style={{ opacity: .65, marginTop: 0 }}>Áreas oficiales del proveedor, técnica disponible y tamaño máximo de impresión.</p>

                {detail.marking?.areas.length ? (
                  <div style={{ display: "grid", gap: 14 }}>
                    {detail.marking.areas.map((area) => (
                      <div key={area.areaId} style={{ display: "grid", gridTemplateColumns: "180px minmax(0,1fr) auto", gap: 16, border: "1px solid #e2e0d9", borderRadius: 14, padding: 12, alignItems: "center" }}>
                        <div style={{ width: 180, height: 130, borderRadius: 10, overflow: "hidden", background: "#eee" }}>
                          <img src={areaImageProxy(detail.product.productId!, area.areaId)} alt={`Marcaje ${area.name}`} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        </div>

                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <strong style={{ fontSize: 18 }}>{area.name}</strong>
                            <span style={{
                              fontSize: 11,
                              borderRadius: 999,
                              padding: "4px 8px",
                              background: area.geometryStatus === "CALIBRATED" ? "#e7f2e4" : "#fff1d6",
                              color: area.geometryStatus === "CALIBRATED" ? "#376c2d" : "#8b5c00",
                            }}>
                              {area.geometryStatus === "CALIBRATED" ? "Área posicionada" : "Área pendiente de posicionar"}
                            </span>
                          </div>

                          <div style={{ marginTop: 5, fontSize: 14 }}>Máximo: <strong>{area.maxWidthMm ?? "?"} × {area.maxHeightMm ?? "?"} mm</strong></div>
                          <div style={{ marginTop: 8 }}>
                            {area.techniques.map((technique) => (
                              <div key={`${technique.providerCode}-${technique.code}`} style={{ marginBottom: 4 }}>
                                <strong>{technique.name}</strong>
                                <span style={{ marginLeft: 7, fontSize: 12, opacity: .55 }}>
                                  {technique.providerVariantCode ? `${technique.providerVariantCode} · ` : ""}
                                  {technique.providerCode ?? technique.code}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <a
                          href={`/admin/marking-geometry?productId=${encodeURIComponent(detail.product.productId!)}&areaId=${encodeURIComponent(area.areaId)}`}
                          style={{ textDecoration: "none", background: "#252820", color: "white", borderRadius: 10, padding: "11px 14px", fontWeight: 800, whiteSpace: "nowrap" }}
                        >
                          Posicionar área →
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: 24, borderRadius: 12, background: "#f4f3ee" }}>Este producto no tiene áreas de marcaje importadas.</div>
                )}
              </article>

              {notice && <div style={{ color: "#376c2d", fontWeight: 700 }}>{notice}</div>}
            </section>
          )}
        </div>

        {error && <div style={{ marginTop: 15, color: "#a72828", fontWeight: 700 }}>{error}</div>}
      </div>
    </main>
  );
}
