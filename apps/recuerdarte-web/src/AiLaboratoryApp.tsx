import { FormEvent, useMemo, useState } from "react";

type ProductBrain = {
  readonly objectType?: string;
  readonly giftRoles?: readonly string[];
  readonly interests?: readonly string[];
  readonly occasions?: readonly string[];
  readonly materials?: readonly string[];
  readonly personalization?: readonly string[];
};

type Product = {
  readonly id?: string;
  readonly sku?: string;
  readonly name?: string;
  readonly imageUrl?: string;
  readonly active?: boolean;
  readonly price?: number;
  readonly stock?: number;
  readonly tags?: readonly string[];
  readonly interests?: readonly string[];
  readonly occasions?: readonly string[];
  readonly media?: readonly {
    readonly url?: string;
    readonly is_primary?: boolean;
  }[];
  readonly productBrain?: ProductBrain;
};

type Recommendation = {
  readonly product?: Product;
  readonly score?: number;
  readonly reasons?: readonly string[];
  readonly warnings?: readonly string[];
  readonly breakdown?: Readonly<Record<string, number>>;
};

type Stage = {
  readonly id: string;
  readonly label: string;
  readonly status: string;
  readonly durationMs: number;
  readonly summary: string;
  readonly input?: unknown;
  readonly output?: unknown;
};

type Trace = {
  readonly id: string;
  readonly createdAt: string;
  readonly giftProfile: Readonly<Record<string, unknown>>;
  readonly recommendations: readonly Recommendation[];
  readonly stages: readonly Stage[];
  readonly totals: {
    readonly durationMs: number;
    readonly recommendations: number;
    readonly warnings: number;
  };
};

type ExecutedScenario = {
  readonly message: string;
  readonly age?: number;
  readonly budget?: number;
};

type DiagnosticBundle = {
  readonly format: "RECUERDARTE_DIAGNOSTIC_V1";
  readonly exportedAt: string;
  readonly scenario: ExecutedScenario;
  readonly environment: {
    readonly location: string;
    readonly userAgent: string;
    readonly language: string;
    readonly platform: string;
    readonly viewport: {
      readonly width: number;
      readonly height: number;
      readonly devicePixelRatio: number;
    };
  };
  readonly trace: Trace;
};

type FunnelItem = {
  readonly label: string;
  readonly value: number | string;
  readonly detail?: string;
  readonly status: "ok" | "warning" | "empty";
};

function image(product: Product | undefined): string | undefined {
  return (
    product?.imageUrl ??
    product?.media?.find((item) => item.is_primary)?.url ??
    product?.media?.[0]?.url
  );
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function findNumber(value: unknown, keys: readonly string[]): number | undefined {
  if (!isRecord(value)) return undefined;

  for (const key of keys) {
    const current = value[key];
    if (typeof current === "number" && Number.isFinite(current)) return current;
  }

  for (const nested of Object.values(value)) {
    const found = findNumber(nested, keys);
    if (found !== undefined) return found;
  }

  return undefined;
}

function findArrayLength(value: unknown, keys: readonly string[]): number | undefined {
  if (!isRecord(value)) return undefined;

  for (const key of keys) {
    const current = value[key];
    if (Array.isArray(current)) return current.length;
  }

  for (const nested of Object.values(value)) {
    const found = findArrayLength(nested, keys);
    if (found !== undefined) return found;
  }

  return undefined;
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (isRecord(value)) return JSON.stringify(value);
  return String(value);
}

function pretty(value: unknown): string {
  return JSON.stringify(value ?? null, null, 2);
}

function scoreEntries(item: Recommendation): readonly [string, number][] {
  return Object.entries(item.breakdown ?? {})
    .filter((entry): entry is [string, number] => typeof entry[1] === "number")
    .sort((left, right) => right[1] - left[1]);
}

function stageByTerms(
  stages: readonly Stage[],
  terms: readonly string[],
): Stage | undefined {
  return stages.find((stage) => {
    const text = `${stage.id} ${stage.label}`.toLowerCase();
    return terms.some((term) => text.includes(term));
  });
}

function buildFunnel(trace: Trace): readonly FunnelItem[] {
  const catalogStage = stageByTerms(trace.stages, [
    "catalog",
    "catálogo",
    "ranking",
    "búsqueda",
  ]);
  const contextStage = stageByTerms(trace.stages, [
    "context",
    "contexto",
  ]);
  const proposalStage = stageByTerms(trace.stages, [
    "proposal",
    "propuesta",
    "semilla",
  ]);

  const total =
    findNumber(catalogStage?.output, [
      "totalProducts",
      "catalogSize",
      "total",
      "scanned",
      "products",
    ]) ??
    findArrayLength(catalogStage?.input, ["products", "catalog", "items"]);

  const candidates =
    findNumber(catalogStage?.output, [
      "candidateCount",
      "candidates",
      "matched",
      "eligible",
    ]) ??
    findArrayLength(catalogStage?.output, ["candidates", "matchedProducts", "eligibleProducts"]);

  const ranked =
    findNumber(catalogStage?.output, [
      "rankedCount",
      "selectedCount",
      "recommendations",
      "results",
    ]) ??
    findArrayLength(catalogStage?.output, ["recommendations", "ranked", "selected"]) ??
    trace.recommendations.length;

  const interests =
    Array.isArray(trace.giftProfile.interests)
      ? trace.giftProfile.interests.length
      : trace.giftProfile.interests
        ? 1
        : 0;

  return Object.freeze([
    {
      label: "Perfil utilizable",
      value: Object.keys(trace.giftProfile).filter(
        (key) => trace.giftProfile[key] !== undefined && trace.giftProfile[key] !== "",
      ).length,
      detail: `${interests} intereses detectados`,
      status: Object.keys(trace.giftProfile).length ? "ok" : "empty",
    },
    {
      label: "Contexto de consulta",
      value: contextStage?.status ?? "NO DISPONIBLE",
      detail: contextStage?.summary,
      status: contextStage?.status.toLowerCase() === "completed" ? "ok" : "warning",
    },
    {
      label: "Productos examinados",
      value: total ?? "NO EXPUESTO",
      detail: total === undefined ? "El backend no informa todavía del tamaño del catálogo." : undefined,
      status: total === undefined ? "warning" : total > 0 ? "ok" : "empty",
    },
    {
      label: "Candidatos",
      value: candidates ?? "NO EXPUESTO",
      detail: candidates === undefined ? "No hay contador intermedio en la traza." : undefined,
      status: candidates === undefined ? "warning" : candidates > 0 ? "ok" : "empty",
    },
    {
      label: "Productos rankeados",
      value: ranked,
      detail: catalogStage?.summary,
      status: ranked > 0 ? "ok" : "empty",
    },
    {
      label: "Semillas de propuesta",
      value:
        findNumber(proposalStage?.output, ["count", "seeds", "proposals"]) ??
        findArrayLength(proposalStage?.output, ["seeds", "proposals", "items"]) ??
        0,
      detail: proposalStage?.summary,
      status: proposalStage?.status.toLowerCase() === "completed" ? "ok" : "empty",
    },
  ]);
}

async function copyJson(value: unknown): Promise<void> {
  await navigator.clipboard.writeText(pretty(value));
}


function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;

  for (const byte of data) {
    crc ^= byte;

    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function uint16(value: number): Uint8Array {
  return new Uint8Array([value & 0xff, (value >>> 8) & 0xff]);
}

function uint32(value: number): Uint8Array {
  return new Uint8Array([
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  ]);
}

function concatBytes(parts: readonly Uint8Array[]): Uint8Array {
  const size = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(size);
  let offset = 0;

  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }

  return output;
}

function dosDateTime(date: Date): { readonly date: number; readonly time: number } {
  const year = Math.max(1980, date.getFullYear());
  return {
    date:
      ((year - 1980) << 9) |
      ((date.getMonth() + 1) << 5) |
      date.getDate(),
    time:
      (date.getHours() << 11) |
      (date.getMinutes() << 5) |
      Math.floor(date.getSeconds() / 2),
  };
}

function zipStored(
  entries: readonly {
    readonly name: string;
    readonly content: Uint8Array;
  }[],
): Blob {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  const stamp = dosDateTime(new Date());
  let offset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const checksum = crc32(entry.content);

    const local = concatBytes([
      uint32(0x04034b50),
      uint16(20),
      uint16(0x0800),
      uint16(0),
      uint16(stamp.time),
      uint16(stamp.date),
      uint32(checksum),
      uint32(entry.content.length),
      uint32(entry.content.length),
      uint16(name.length),
      uint16(0),
      name,
      entry.content,
    ]);

    localParts.push(local);

    centralParts.push(
      concatBytes([
        uint32(0x02014b50),
        uint16(20),
        uint16(20),
        uint16(0x0800),
        uint16(0),
        uint16(stamp.time),
        uint16(stamp.date),
        uint32(checksum),
        uint32(entry.content.length),
        uint32(entry.content.length),
        uint16(name.length),
        uint16(0),
        uint16(0),
        uint16(0),
        uint16(0),
        uint32(0),
        uint32(offset),
        name,
      ]),
    );

    offset += local.length;
  }

  const localData = concatBytes(localParts);
  const centralData = concatBytes(centralParts);
  const end = concatBytes([
    uint32(0x06054b50),
    uint16(0),
    uint16(0),
    uint16(entries.length),
    uint16(entries.length),
    uint32(centralData.length),
    uint32(localData.length),
    uint16(0),
  ]);

  const toArrayBuffer = (value: Uint8Array): ArrayBuffer => {
    const copy = new Uint8Array(value.byteLength);
    copy.set(value);
    return copy.buffer;
  };

  return new Blob(
    [
      toArrayBuffer(localData),
      toArrayBuffer(centralData),
      toArrayBuffer(end),
    ],
    {
      type: "application/zip",
    },
  );
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function dataUrlBytes(dataUrl: string): Uint8Array {
  const encoded = dataUrl.split(",", 2)[1] ?? "";
  const binary = window.atob(encoded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function environmentSnapshot(): DiagnosticBundle["environment"] {
  return Object.freeze({
    location: window.location.href,
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    viewport: Object.freeze({
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
    }),
  });
}

function diagnosticMarkdown(bundle: DiagnosticBundle): string {
  const rankingStage = stageByTerms(bundle.trace.stages, [
    "catalog",
    "catálogo",
    "ranking",
    "búsqueda",
  ]);

  return [
    "# Diagnóstico RecuerdArte",
    "",
    `- Exportado: ${bundle.exportedAt}`,
    `- Trace ID: ${bundle.trace.id}`,
    `- Duración: ${bundle.trace.totals.durationMs} ms`,
    `- Resultados: ${bundle.trace.recommendations.length}`,
    "",
    "## Escenario",
    "",
    bundle.scenario.message,
    "",
    `Edad manual: ${bundle.scenario.age ?? "no indicada"}`,
    `Presupuesto manual: ${bundle.scenario.budget ?? "no indicado"}`,
    "",
    "## Resultado observado",
    "",
    bundle.trace.recommendations.length
      ? `Se obtuvieron ${bundle.trace.recommendations.length} recomendaciones.`
      : "No se obtuvo ninguna recomendación.",
    "",
    "## Gift Profile",
    "",
    "```json",
    pretty(bundle.trace.giftProfile),
    "```",
    "",
    "## Búsqueda y ranking",
    "",
    "```json",
    pretty(rankingStage ?? null),
    "```",
    "",
    "## Etapas",
    "",
    "```json",
    pretty(bundle.trace.stages),
    "```",
    "",
    "## Recomendaciones",
    "",
    "```json",
    pretty(bundle.trace.recommendations),
    "```",
    "",
    "## Entorno",
    "",
    "```json",
    pretty(bundle.environment),
    "```",
  ].join("\n");
}

async function captureCurrentScreen(): Promise<string> {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    throw new Error("Este navegador no permite capturar la pantalla.");
  }

  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: false,
  });

  try {
    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    await video.play();

    await new Promise<void>((resolve) =>
      window.setTimeout(resolve, 250),
    );

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("No se pudo preparar la captura.");
    }

    context.drawImage(video, 0, 0);
    return canvas.toDataURL("image/png");
  } finally {
    for (const track of stream.getTracks()) track.stop();
  }
}

export function AiLaboratoryApp() {
  const [message, setMessage] = useState(
    "Es para mi hermano, le encanta el fútbol y cumple 14 años. Presupuesto 45 €.",
  );
  const [budget, setBudget] = useState("45");
  const [age, setAge] = useState("14");
  const [trace, setTrace] = useState<Trace>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [executedMessage, setExecutedMessage] = useState<string>();
  const [selectedStageId, setSelectedStageId] = useState<string>();
  const [selectedProductId, setSelectedProductId] = useState<string>();
  const [copied, setCopied] = useState("");
  const [executedScenario, setExecutedScenario] =
    useState<ExecutedScenario>();
  const [screenshot, setScreenshot] = useState<string>();
  const [exporting, setExporting] = useState(false);

  const recommendations = useMemo(
    () => trace?.recommendations ?? [],
    [trace],
  );

  const funnel = useMemo(
    () => (trace ? buildFunnel(trace) : []),
    [trace],
  );

  const selectedStage = useMemo(
    () =>
      trace?.stages.find((stage) => stage.id === selectedStageId) ??
      trace?.stages[0],
    [trace, selectedStageId],
  );

  const selectedProduct = useMemo(
    () =>
      recommendations.find(
        (item) => item.product?.id === selectedProductId,
      ) ?? recommendations[0],
    [recommendations, selectedProductId],
  );

  function beginNewScenario(nextMessage: string): void {
    const startsAnotherScenario =
      executedMessage !== undefined && nextMessage !== executedMessage;

    if (startsAnotherScenario) {
      setAge("");
      setBudget("");
      setTrace(undefined);
      setError("");
      setExecutedMessage(undefined);
      setSelectedStageId(undefined);
      setSelectedProductId(undefined);
      setExecutedScenario(undefined);
      setScreenshot(undefined);
    }

    setMessage(nextMessage);
  }

  function invalidateResult(): void {
    setTrace(undefined);
    setSelectedStageId(undefined);
    setSelectedProductId(undefined);
  }

  function resetScenario(): void {
    setMessage("");
    setAge("");
    setBudget("");
    setTrace(undefined);
    setError("");
    setExecutedMessage(undefined);
    setSelectedStageId(undefined);
    setSelectedProductId(undefined);
    setExecutedScenario(undefined);
    setScreenshot(undefined);
  }

  async function run(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/v1/ai-lab/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message,
          budget: budget ? Number(budget) : undefined,
          age: age ? Number(age) : undefined,
          limit: 12,
        }),
      });

      if (!response.ok) {
        throw new Error(
          ((await response.json()) as { message?: string }).message ??
            "No se pudo ejecutar el laboratorio.",
        );
      }

      const nextTrace = (await response.json()) as Trace;
      setTrace(nextTrace);
      setExecutedMessage(message);
      setSelectedStageId(nextTrace.stages[0]?.id);
      setSelectedProductId(nextTrace.recommendations[0]?.product?.id);
      setExecutedScenario(
        Object.freeze({
          message,
          ...(age ? { age: Number(age) } : {}),
          ...(budget ? { budget: Number(budget) } : {}),
        }),
      );
      setScreenshot(undefined);
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Error desconocido",
      );
    } finally {
      setBusy(false);
    }
  }

  async function copy(name: string, value: unknown): Promise<void> {
    try {
      await copyJson(value);
      setCopied(name);
      window.setTimeout(() => setCopied(""), 1600);
    } catch {
      setError("El navegador no permitió copiar el JSON.");
    }
  }

  function buildDiagnostic(): DiagnosticBundle {
    if (!trace || !executedScenario) {
      throw new Error("Ejecuta primero una simulación.");
    }

    return Object.freeze({
      format: "RECUERDARTE_DIAGNOSTIC_V1",
      exportedAt: new Date().toISOString(),
      scenario: executedScenario,
      environment: environmentSnapshot(),
      trace,
    });
  }

  async function exportDiagnostic(): Promise<void> {
    setExporting(true);
    setError("");

    try {
      const bundle = buildDiagnostic();
      const encoder = new TextEncoder();
      const timestamp = bundle.exportedAt
        .replaceAll(":", "-")
        .replace(/\.\d{3}Z$/u, "Z");

      const entries: {
        name: string;
        content: Uint8Array;
      }[] = [
        {
          name: "summary.json",
          content: encoder.encode(
            pretty({
              format: bundle.format,
              exportedAt: bundle.exportedAt,
              traceId: bundle.trace.id,
              durationMs: bundle.trace.totals.durationMs,
              recommendations:
                bundle.trace.recommendations.length,
              warnings: bundle.trace.totals.warnings,
            }),
          ),
        },
        {
          name: "scenario.json",
          content: encoder.encode(pretty(bundle.scenario)),
        },
        {
          name: "environment.json",
          content: encoder.encode(pretty(bundle.environment)),
        },
        {
          name: "gift-profile.json",
          content: encoder.encode(
            pretty(bundle.trace.giftProfile),
          ),
        },
        {
          name: "stages.json",
          content: encoder.encode(
            pretty(bundle.trace.stages),
          ),
        },
        {
          name: "recommendations.json",
          content: encoder.encode(
            pretty(bundle.trace.recommendations),
          ),
        },
        {
          name: "trace.json",
          content: encoder.encode(pretty(bundle.trace)),
        },
        {
          name: "diagnostic.md",
          content: encoder.encode(diagnosticMarkdown(bundle)),
        },
      ];

      if (screenshot) {
        entries.push({
          name: "screenshots/ai-lab.png",
          content: dataUrlBytes(screenshot),
        });
      }

      downloadBlob(
        zipStored(entries),
        `recuerdarte-diagnostic-${timestamp}.zip`,
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo exportar el diagnóstico.",
      );
    } finally {
      setExporting(false);
    }
  }

  async function copyDiagnosticMarkdown(): Promise<void> {
    try {
      const bundle = buildDiagnostic();
      await navigator.clipboard.writeText(
        diagnosticMarkdown(bundle),
      );
      setCopied("diagnostic-markdown");
      window.setTimeout(() => setCopied(""), 1600);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo copiar el diagnóstico.",
      );
    }
  }

  async function captureDiagnosticScreen(): Promise<void> {
    setError("");

    try {
      setScreenshot(await captureCurrentScreen());
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo capturar la pantalla.",
      );
    }
  }

  function replayScenario(): void {
    if (!executedScenario) return;

    setMessage(executedScenario.message);
    setAge(
      executedScenario.age !== undefined
        ? String(executedScenario.age)
        : "",
    );
    setBudget(
      executedScenario.budget !== undefined
        ? String(executedScenario.budget)
        : "",
    );
    setTrace(undefined);
    setExecutedMessage(undefined);
    setSelectedStageId(undefined);
    setSelectedProductId(undefined);
    setScreenshot(undefined);
    setError("");
  }

  return (
    <main className="intelligenceShell">
      <header className="intelligenceHeader">
        <a href="/admin">← Administración</a>
        <div>
          <small>INTELLIGENCE DEBUG CENTER</small>
          <h1>Observa cómo razona Rai.</h1>
          <p>
            Simula un caso, inspecciona cada etapa y localiza exactamente dónde
            se pierden los productos.
          </p>
        </div>
        <a href="/admin/intelligence-center">Centro de Inteligencia →</a>
      </header>

      <section className="labGrid">
        <form className="labScenario" onSubmit={run}>
          <small>ESCENARIO</small>
          <h2>Describe el regalo</h2>
          <textarea
            value={message}
            onChange={(event) => beginNewScenario(event.target.value)}
            rows={8}
          />
          <div className="labFields">
            <label>
              Edad
              <input
                value={age}
                onChange={(event) => {
                  setAge(event.target.value);
                  invalidateResult();
                }}
                inputMode="numeric"
              />
            </label>
            <label>
              Presupuesto
              <input
                value={budget}
                onChange={(event) => {
                  setBudget(event.target.value);
                  invalidateResult();
                }}
                inputMode="decimal"
              />
            </label>
          </div>
          <button disabled={busy || !message.trim()}>
            {busy ? "Analizando…" : "Ejecutar simulación"}
          </button>
          <button type="button" disabled={busy} onClick={resetScenario}>
            Nueva simulación
          </button>
          {error && <p className="intelligenceError">{error}</p>}
        </form>

        <section className="labResult">
          <div className="panelTitle">
            <div>
              <small>RESULTADO</small>
              <h2>Gift Profile y Journey</h2>
            </div>
            {trace && <span>{trace.totals.durationMs} ms</span>}
          </div>

          {trace ? (
            <>
              <div className="profileGrid">
                {Object.entries(trace.giftProfile)
                  .filter(
                    ([, value]) =>
                      value !== undefined &&
                      value !== "" &&
                      (!Array.isArray(value) || value.length),
                  )
                  .map(([key, value]) => (
                    <article key={key}>
                      <span>{key}</span>
                      <strong>{formatValue(value)}</strong>
                    </article>
                  ))}
              </div>

              <div className="stageStrip">
                {trace.stages.map((stage, index) => (
                  <button
                    type="button"
                    key={stage.id}
                    className={
                      selectedStage?.id === stage.id ? "is-selected" : ""
                    }
                    onClick={() => setSelectedStageId(stage.id)}
                  >
                    <i>{index + 1}</i>
                    <div>
                      <strong>{stage.label}</strong>
                      <span>{stage.summary}</span>
                    </div>
                    <b
                      className={`stageStatus stageStatus--${stage.status.toLowerCase()}`}
                    >
                      {stage.status}
                    </b>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="emptyIntelligence">
              Ejecuta un escenario para ver el perfil y las etapas internas.
            </div>
          )}
        </section>
      </section>

      {trace && (
        <>
          <section className="debugPanel diagnosticActions">
            <div className="panelTitle">
              <div>
                <small>PAQUETE DE DIAGNÓSTICO</small>
                <h2>Exporta todo el caso con un clic</h2>
              </div>
              <span>{screenshot ? "Captura incluida" : "Sin captura"}</span>
            </div>

            <div className="diagnosticActionGrid">
              <button
                type="button"
                onClick={() => void exportDiagnostic()}
                disabled={exporting}
              >
                <b>📦</b>
                <span>
                  <strong>
                    {exporting
                      ? "Preparando ZIP…"
                      : "Exportar diagnóstico"}
                  </strong>
                  <small>
                    JSON, Markdown, entorno, traza y captura
                  </small>
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  void copyDiagnosticMarkdown()
                }
              >
                <b>📋</b>
                <span>
                  <strong>
                    {copied === "diagnostic-markdown"
                      ? "Diagnóstico copiado"
                      : "Copiar para ChatGPT"}
                  </strong>
                  <small>
                    Markdown listo para pegar en el chat
                  </small>
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  void captureDiagnosticScreen()
                }
              >
                <b>📸</b>
                <span>
                  <strong>
                    {screenshot
                      ? "Actualizar captura"
                      : "Capturar pantalla"}
                  </strong>
                  <small>
                    El navegador te pedirá elegir la pestaña
                  </small>
                </span>
              </button>

              <button
                type="button"
                onClick={replayScenario}
              >
                <b>🔁</b>
                <span>
                  <strong>Reproducir caso</strong>
                  <small>
                    Restaura el escenario y limpia el resultado
                  </small>
                </span>
              </button>
            </div>

            {screenshot && (
              <div className="diagnosticScreenshot">
                <img
                  src={screenshot}
                  alt="Captura incluida en el diagnóstico"
                />
                <button
                  type="button"
                  onClick={() => setScreenshot(undefined)}
                >
                  Quitar captura
                </button>
              </div>
            )}
          </section>

          <section className="debugPanel">
            <div className="panelTitle">
              <div>
                <small>EMBUDO DEL CATÁLOGO</small>
                <h2>Dónde se reducen los candidatos</h2>
              </div>
              <span>{recommendations.length} resultados finales</span>
            </div>

            <div className="catalogFunnel">
              {funnel.map((item, index) => (
                <article key={item.label} className={`funnel--${item.status}`}>
                  <i>{index + 1}</i>
                  <div>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                    {item.detail && <small>{item.detail}</small>}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="debugColumns">
            <article className="debugPanel">
              <div className="panelTitle">
                <div>
                  <small>ETAPA SELECCIONADA</small>
                  <h2>{selectedStage?.label ?? "Etapa"}</h2>
                </div>
                {selectedStage && <span>{selectedStage.durationMs} ms</span>}
              </div>

              {selectedStage && (
                <>
                  <p className="debugSummary">{selectedStage.summary}</p>
                  <div className="debugJsonGrid">
                    <section>
                      <header>
                        <strong>INPUT</strong>
                        <button
                          type="button"
                          onClick={() => void copy("input", selectedStage.input)}
                        >
                          {copied === "input" ? "Copiado" : "Copiar"}
                        </button>
                      </header>
                      <pre>{pretty(selectedStage.input)}</pre>
                    </section>
                    <section>
                      <header>
                        <strong>OUTPUT</strong>
                        <button
                          type="button"
                          onClick={() =>
                            void copy("output", selectedStage.output)
                          }
                        >
                          {copied === "output" ? "Copiado" : "Copiar"}
                        </button>
                      </header>
                      <pre>{pretty(selectedStage.output)}</pre>
                    </section>
                  </div>
                </>
              )}
            </article>

            <article className="debugPanel">
              <div className="panelTitle">
                <div>
                  <small>TIMELINE</small>
                  <h2>Coste de cada etapa</h2>
                </div>
                <span>{trace.totals.durationMs} ms total</span>
              </div>

              <div className="debugTimeline">
                {trace.stages.map((stage) => {
                  const width =
                    trace.totals.durationMs > 0
                      ? Math.max(
                          3,
                          (stage.durationMs / trace.totals.durationMs) * 100,
                        )
                      : 3;

                  return (
                    <article key={stage.id}>
                      <div>
                        <strong>{stage.label}</strong>
                        <span>{stage.durationMs} ms</span>
                      </div>
                      <i>
                        <b style={{ width: `${width}%` }} />
                      </i>
                    </article>
                  );
                })}
              </div>
            </article>
          </section>
        </>
      )}

      <section className="recommendationPanel">
        <div className="panelTitle">
          <div>
            <small>RANKING Y EXPLICABILIDAD</small>
            <h2>Productos recomendados</h2>
          </div>
          <span>{recommendations.length} resultados</span>
        </div>

        {trace && recommendations.length === 0 && (
          <div className="zeroResultsDiagnostic">
            <strong>No ha llegado ningún producto al ranking final.</strong>
            <p>
              Abre la etapa <b>Búsqueda y ranking de catálogo</b> para revisar
              su input y output. El embudo indica qué contadores no está
              exponiendo todavía el backend.
            </p>
          </div>
        )}

        <div className="labRecommendationGrid">
          {recommendations.map((item, index) => (
            <button
              type="button"
              key={item.product?.id ?? index}
              className={
                selectedProduct?.product?.id === item.product?.id
                  ? "is-selected"
                  : ""
              }
              onClick={() => setSelectedProductId(item.product?.id)}
            >
              <div className="labProductImage">
                {image(item.product) ? (
                  <img src={image(item.product)} alt="" />
                ) : (
                  <span>RA</span>
                )}
                <b>#{index + 1}</b>
              </div>
              <small>{item.product?.productBrain?.objectType ?? "producto"}</small>
              <h3>{item.product?.name ?? "Producto"}</h3>
              <div className="scoreLine">
                <strong>{item.score?.toFixed(2) ?? "—"}</strong>
                <span>puntos</span>
              </div>
              <p>{item.reasons?.[0] ?? "Sin explicación disponible."}</p>
              {item.warnings?.length ? <em>{item.warnings[0]}</em> : null}
            </button>
          ))}
        </div>
      </section>

      {selectedProduct && (
        <section className="debugColumns productDebug">
          <article className="debugPanel">
            <div className="panelTitle">
              <div>
                <small>PRODUCT BRAIN</small>
                <h2>{selectedProduct.product?.name ?? "Producto"}</h2>
              </div>
              <span>{selectedProduct.product?.sku ?? "SIN SKU"}</span>
            </div>

            <div className="brainFacts">
              <article>
                <span>Objeto</span>
                <strong>
                  {selectedProduct.product?.productBrain?.objectType ?? "—"}
                </strong>
              </article>
              <article>
                <span>Roles</span>
                <strong>
                  {selectedProduct.product?.productBrain?.giftRoles?.join(", ") ??
                    "—"}
                </strong>
              </article>
              <article>
                <span>Intereses</span>
                <strong>
                  {selectedProduct.product?.productBrain?.interests?.join(", ") ??
                    selectedProduct.product?.interests?.join(", ") ??
                    "—"}
                </strong>
              </article>
              <article>
                <span>Ocasiones</span>
                <strong>
                  {selectedProduct.product?.productBrain?.occasions?.join(", ") ??
                    selectedProduct.product?.occasions?.join(", ") ??
                    "—"}
                </strong>
              </article>
              <article>
                <span>Precio</span>
                <strong>
                  {typeof selectedProduct.product?.price === "number"
                    ? `${selectedProduct.product.price} €`
                    : "—"}
                </strong>
              </article>
              <article>
                <span>Stock</span>
                <strong>{selectedProduct.product?.stock ?? "—"}</strong>
              </article>
            </div>

            <div className="reasonList">
              {(selectedProduct.reasons ?? []).map((reason) => (
                <p key={reason}>✓ {reason}</p>
              ))}
              {(selectedProduct.warnings ?? []).map((warning) => (
                <p key={warning} className="is-warning">
                  ⚠ {warning}
                </p>
              ))}
            </div>
          </article>

          <article className="debugPanel">
            <div className="panelTitle">
              <div>
                <small>SCORE BREAKDOWN</small>
                <h2>Por qué gana</h2>
              </div>
              <span>{selectedProduct.score?.toFixed(2) ?? "—"}</span>
            </div>

            <div className="scoreBreakdown">
              {scoreEntries(selectedProduct).length ? (
                scoreEntries(selectedProduct).map(([key, value]) => (
                  <article key={key}>
                    <div>
                      <strong>{key}</strong>
                      <span>{value.toFixed(2)}</span>
                    </div>
                    <i>
                      <b
                        style={{
                          width: `${Math.max(0, Math.min(100, value))}%`,
                        }}
                      />
                    </i>
                  </article>
                ))
              ) : (
                <div className="zeroResultsDiagnostic">
                  Este recomendador no ha expuesto todavía el breakdown del
                  score.
                </div>
              )}
            </div>
          </article>
        </section>
      )}

      {trace && (
        <section className="debugPanel fullJsonPanel">
          <div className="panelTitle">
            <div>
              <small>TRAZA COMPLETA</small>
              <h2>JSON de diagnóstico</h2>
            </div>
            <button type="button" onClick={() => void copy("trace", trace)}>
              {copied === "trace" ? "JSON copiado" : "Copiar JSON"}
            </button>
          </div>
          <pre>{pretty(trace)}</pre>
        </section>
      )}
    </main>
  );
}
