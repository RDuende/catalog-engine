import { PointerEvent, useEffect, useMemo, useRef, useState } from "react";

type Placement = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  geometrySource?: "PROVIDER_IMAGE" | "AUTO" | "ADMIN";
  confidence?: number;
  calibratedAt?: string;
};

type Technique = {
  code: string;
  name: string;
  providerCode?: string;
  providerVariantCode?: string;
  providerOfficial?: boolean;
};

type Area = {
  areaId: string;
  name: string;
  providerAreaId?: string;
  providerPositionId?: string;
  markingPreviewImageUrl?: string;
  baseImageUrl?: string;
  maxWidthMm?: number;
  maxHeightMm?: number;
  placement: Placement;
  geometryStatus: "PLACEHOLDER" | "CALIBRATED";
  techniques: Technique[];
};

type GeometryResponse = {
  status: string;
  geometry: {
    productId: string;
    providerKey?: string;
    providerProductId?: string;
    commercialImageUrl?: string;
    mockupBaseImageUrl?: string;
    areas: Area[];
  };
};

type DragMode = "move" | "resize";

const API = "/api/v1";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function proxyImageUrl(productId: string, areaId: string) {
  return `${API}/marking-intelligence/products/${encodeURIComponent(productId)}/areas/${encodeURIComponent(areaId)}/image`;
}

export function MarkingGeometryAdminApp() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialProductId = searchParams.get("productId") ?? "makito:14855";
  const initialAreaId = searchParams.get("areaId") ?? undefined;
  const [productId, setProductId] = useState(initialProductId);
  const [loaded, setLoaded] = useState<GeometryResponse["geometry"]>();
  const [selectedAreaId, setSelectedAreaId] = useState<string>();
  const [placement, setPlacement] = useState<Placement>({
    x: 0.35,
    y: 0.42,
    width: 0.3,
    height: 0.08,
    rotation: 0,
    geometrySource: "ADMIN",
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    mode: DragMode;
    pointerX: number;
    pointerY: number;
    start: Placement;
  } | undefined>(undefined);

  const selectedArea = useMemo(
    () => loaded?.areas.find((area) => area.areaId === selectedAreaId),
    [loaded, selectedAreaId],
  );

  async function load(id = productId) {
    setBusy(true);
    setError(undefined);
    setMessage(undefined);
    try {
      const response = await fetch(
        `${API}/marking-intelligence/products/${encodeURIComponent(id)}/geometry`,
      );
      const json = await response.json() as GeometryResponse & { message?: string };
      if (!response.ok) throw new Error(json.message ?? `HTTP ${response.status}`);

      setLoaded(json.geometry);
      const first = json.geometry.areas[0];
      const requestedArea = json.geometry.areas.find((area) => area.areaId === initialAreaId);
      setSelectedAreaId(requestedArea?.areaId ?? first?.areaId);

      if (first) {
        setPlacement(
          first.geometryStatus === "PLACEHOLDER"
            ? {
                x: 0.35,
                y: 0.42,
                width: 0.3,
                height: 0.08,
                rotation: 0,
                geometrySource: "ADMIN",
              }
            : { ...first.placement, geometrySource: "ADMIN" },
        );
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load(initialProductId);
  }, []);

  useEffect(() => {
    if (!selectedArea) return;
    setPlacement(
      selectedArea.geometryStatus === "PLACEHOLDER"
        ? {
            x: 0.35,
            y: 0.42,
            width: 0.3,
            height: 0.08,
            rotation: 0,
            geometrySource: "ADMIN",
          }
        : { ...selectedArea.placement, geometrySource: "ADMIN" },
    );
    setMessage(undefined);
  }, [selectedAreaId]);

  function pointerDown(event: PointerEvent<HTMLDivElement>, mode: DragMode) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      mode,
      pointerX: event.clientX,
      pointerY: event.clientY,
      start: placement,
    };
  }

  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const stage = stageRef.current;
    if (!drag || !stage) return;

    const bounds = stage.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;

    const dx = (event.clientX - drag.pointerX) / bounds.width;
    const dy = (event.clientY - drag.pointerY) / bounds.height;

    if (drag.mode === "move") {
      setPlacement({
        ...drag.start,
        x: clamp(drag.start.x + dx, 0, 1 - drag.start.width),
        y: clamp(drag.start.y + dy, 0, 1 - drag.start.height),
        geometrySource: "ADMIN",
      });
    } else {
      setPlacement({
        ...drag.start,
        width: clamp(drag.start.width + dx, 0.01, 1 - drag.start.x),
        height: clamp(drag.start.height + dy, 0.01, 1 - drag.start.y),
        geometrySource: "ADMIN",
      });
    }
  }

  function pointerUp() {
    dragRef.current = undefined;
  }

  async function save() {
    if (!selectedArea || !loaded) return;
    setBusy(true);
    setError(undefined);
    setMessage(undefined);

    try {
      const response = await fetch(
        `${API}/marking-intelligence/products/${encodeURIComponent(loaded.productId)}/geometry`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            areas: [{
              areaId: selectedArea.areaId,
              placement: {
                ...placement,
                geometrySource: "ADMIN",
              },
            }],
          }),
        },
      );

      const json = await response.json() as GeometryResponse & { message?: string };
      if (!response.ok) throw new Error(json.message ?? `HTTP ${response.status}`);

      setLoaded(json.geometry);
      setMessage("Área de marcaje guardada como calibración ADMIN.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  const imageUrl =
    selectedArea && loaded
      ? proxyImageUrl(loaded.productId, selectedArea.areaId)
      : undefined;

  return (
    <main style={{ minHeight: "100vh", background: "#f5f4ef", color: "#252820", padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
      <a
        href={`/admin/products?productId=${encodeURIComponent(productId)}`}
        style={{
          position: "fixed",
          left: 18,
          bottom: 18,
          zIndex: 20,
          background: "#fff",
          border: "1px solid #d8d6ce",
          borderRadius: 999,
          padding: "9px 13px",
          color: "#252820",
          textDecoration: "none",
          fontWeight: 700,
          boxShadow: "0 8px 24px rgba(0,0,0,.08)",
        }}
      >
        ← Volver a productos
      </a>
      <div style={{ maxWidth: 1500, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 20, marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", opacity: .58 }}>RecuerdArte · Administración</div>
            <h1 style={{ margin: "6px 0 5px", fontSize: 32 }}>Editor de áreas de marcaje</h1>
            <p style={{ margin: 0, opacity: .7 }}>Calibra sobre la imagen oficial del proveedor la zona real donde debe colocarse el diseño.</p>
          </div>
          <a href="/admin" style={{ color: "inherit" }}>← Administración</a>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 360px", gap: 20 }}>
          <div style={{ background: "white", borderRadius: 18, padding: 18, boxShadow: "0 8px 28px rgba(0,0,0,.06)" }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <input
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
                placeholder="makito:14855"
                style={{ flex: 1, padding: "11px 13px", border: "1px solid #d9d8d0", borderRadius: 10, font: "inherit" }}
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => void load()}
                style={{ padding: "11px 18px", borderRadius: 10, border: 0, background: "#252820", color: "white", fontWeight: 700, cursor: "pointer" }}
              >
                Cargar producto
              </button>
            </div>

            {loaded && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                {loaded.areas.map((area) => (
                  <button
                    key={area.areaId}
                    type="button"
                    onClick={() => setSelectedAreaId(area.areaId)}
                    style={{
                      border: selectedAreaId === area.areaId ? "2px solid #252820" : "1px solid #d9d8d0",
                      background: selectedAreaId === area.areaId ? "#efeee7" : "white",
                      padding: "9px 12px",
                      borderRadius: 999,
                      cursor: "pointer",
                    }}
                  >
                    {area.name} · {area.maxWidthMm ?? "?"}×{area.maxHeightMm ?? "?"} mm
                  </button>
                ))}
              </div>
            )}

            {imageUrl && selectedArea ? (
              <div
                ref={stageRef}
                onPointerMove={pointerMove}
                onPointerUp={pointerUp}
                onPointerCancel={pointerUp}
                style={{
                  position: "relative",
                  width: "100%",
                  minHeight: 560,
                  borderRadius: 14,
                  overflow: "hidden",
                  background: "#eee",
                  userSelect: "none",
                  touchAction: "none",
                }}
              >
                <img
                  key={imageUrl}
                  src={imageUrl}
                  alt={`Imagen de marcaje ${selectedArea.name}`}
                  draggable={false}
                  style={{ display: "block", width: "100%", height: "auto", maxHeight: 760, objectFit: "contain", margin: "auto" }}
                />
                <div
                  onPointerDown={(event) => pointerDown(event, "move")}
                  style={{
                    position: "absolute",
                    left: `${placement.x * 100}%`,
                    top: `${placement.y * 100}%`,
                    width: `${placement.width * 100}%`,
                    height: `${placement.height * 100}%`,
                    border: "3px solid #e83f5b",
                    background: "rgba(232,63,91,.15)",
                    boxSizing: "border-box",
                    cursor: "move",
                    transform: `rotate(${placement.rotation ?? 0}deg)`,
                    transformOrigin: "center",
                  }}
                >
                  <div style={{ position: "absolute", left: 5, top: 5, background: "#e83f5b", color: "white", borderRadius: 6, padding: "3px 6px", fontSize: 11, fontWeight: 800 }}>
                    {selectedArea.maxWidthMm ?? "?"} × {selectedArea.maxHeightMm ?? "?"} mm
                  </div>
                  <div
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      pointerDown(event, "resize");
                    }}
                    style={{
                      position: "absolute",
                      right: -8,
                      bottom: -8,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "#e83f5b",
                      border: "3px solid white",
                      cursor: "nwse-resize",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: "center", opacity: .6 }}>Carga un producto con áreas de marcaje.</div>
            )}
          </div>

          <aside style={{ background: "white", borderRadius: 18, padding: 20, boxShadow: "0 8px 28px rgba(0,0,0,.06)", alignSelf: "start" }}>
            {selectedArea ? (
              <>
                <div style={{ fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", opacity: .55 }}>Área seleccionada</div>
                <h2 style={{ margin: "6px 0 4px" }}>{selectedArea.name}</h2>
                <div style={{ fontSize: 14, opacity: .65, marginBottom: 18 }}>
                  {selectedArea.geometryStatus} · Makito {selectedArea.providerAreaId}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
                  <label>Máx. ancho
                    <input value={`${selectedArea.maxWidthMm ?? ""} mm`} disabled style={{ width: "100%", boxSizing: "border-box", padding: 9, marginTop: 4 }} />
                  </label>
                  <label>Máx. alto
                    <input value={`${selectedArea.maxHeightMm ?? ""} mm`} disabled style={{ width: "100%", boxSizing: "border-box", padding: 9, marginTop: 4 }} />
                  </label>
                </div>

                <h3>Técnicas</h3>
                {selectedArea.techniques.map((technique) => (
                  <div key={`${technique.providerCode}-${technique.code}`} style={{ padding: "10px 0", borderBottom: "1px solid #eee" }}>
                    <strong>{technique.name}</strong>
                    <div style={{ fontSize: 12, opacity: .6 }}>
                      {technique.code} · {technique.providerCode} {technique.providerVariantCode ? `· ${technique.providerVariantCode}` : ""}
                    </div>
                  </div>
                ))}

                <h3 style={{ marginTop: 20 }}>Geometría</h3>
                {(["x", "y", "width", "height"] as const).map((field) => (
                  <label key={field} style={{ display: "block", marginBottom: 8 }}>
                    {field}
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.001"
                      value={placement[field]}
                      onChange={(event) => setPlacement({
                        ...placement,
                        [field]: Number(event.target.value),
                        geometrySource: "ADMIN",
                      })}
                      style={{ width: "100%", boxSizing: "border-box", padding: 9, marginTop: 4 }}
                    />
                  </label>
                ))}

                <label style={{ display: "block", marginBottom: 16 }}>
                  Rotación
                  <input
                    type="number"
                    step="0.5"
                    value={placement.rotation ?? 0}
                    onChange={(event) => setPlacement({
                      ...placement,
                      rotation: Number(event.target.value),
                      geometrySource: "ADMIN",
                    })}
                    style={{ width: "100%", boxSizing: "border-box", padding: 9, marginTop: 4 }}
                  />
                </label>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void save()}
                  style={{ width: "100%", padding: 13, border: 0, borderRadius: 10, background: "#4a5c3a", color: "white", fontWeight: 800, cursor: "pointer" }}
                >
                  Guardar área de marcaje
                </button>

                {message && <p style={{ color: "#376c2d", fontWeight: 700 }}>{message}</p>}
                {error && <p style={{ color: "#a72828", fontWeight: 700 }}>{error}</p>}
              </>
            ) : (
              <p>Selecciona un área.</p>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}
