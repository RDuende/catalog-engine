import {
  ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type ToolMode =
  | "RUNNABLE"
  | "NAVIGATION"
  | "DIAGNOSTIC";

interface AdminTool {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly mode: ToolMode;
  readonly adminPath: string;
  readonly testScript?: string;
  readonly defaultPayload?: unknown;
}

interface TraceEntry {
  readonly at: string;
  readonly phase: string;
  readonly message: string;
  readonly data?: unknown;
}

interface RunResult {
  readonly id: string;
  readonly toolId: string;
  readonly status:
    | "PASS"
    | "FAIL"
    | "NOT_RUNNABLE";
  readonly startedAt: string;
  readonly completedAt: string;
  readonly durationMs: number;
  readonly input: unknown;
  readonly output?: unknown;
  readonly traces:
    readonly TraceEntry[];
  readonly error?: {
    readonly message: string;
    readonly stack?: string;
  };
}

interface TestResult {
  readonly toolId: string;
  readonly script: string;
  readonly status:
    | "PASS"
    | "FAIL";
  readonly exitCode: number;
  readonly durationMs: number;
  readonly stdout: string;
  readonly stderr: string;
}

interface SavedCase {
  readonly id: string;
  readonly name: string;
  readonly toolId: string;
  readonly payload: string;
  readonly result?: RunResult;
  readonly createdAt: string;
  readonly updatedAt: string;
}

const HISTORY_KEY =
  "recuerdarte.admin-tools.history.v2";
const CASES_KEY =
  "recuerdarte.admin-tools.cases.v2";

function safeParse<T>(
  raw: string | null,
  fallback: T,
): T {
  try {
    return raw
      ? JSON.parse(raw) as T
      : fallback;
  } catch {
    return fallback;
  }
}

function stamp(): string {
  return new Date()
    .toISOString()
    .replace(/[:.]/gu, "-");
}

function parsePayload(
  value: string,
): unknown {
  return value.trim()
    ? JSON.parse(value)
    : {};
}

function downloadBlob(
  filename: string,
  blob: Blob,
): void {
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

function downloadJson(
  filename: string,
  value: unknown,
): void {
  downloadBlob(
    filename,
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
    ),
  );
}

function crc32(
  bytes: Uint8Array,
): number {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc ^= byte;

    for (
      let bit = 0;
      bit < 8;
      bit += 1
    ) {
      crc =
        (crc >>> 1) ^
        (
          crc & 1
            ? 0xedb88320
            : 0
        );
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function write16(
  view: DataView,
  offset: number,
  value: number,
): void {
  view.setUint16(
    offset,
    value,
    true,
  );
}

function write32(
  view: DataView,
  offset: number,
  value: number,
): void {
  view.setUint32(
    offset,
    value,
    true,
  );
}

function exactBuffer(
  bytes: Uint8Array,
): ArrayBuffer {
  const copy =
    new Uint8Array(bytes.length);
  copy.set(bytes);
  return copy.buffer;
}

function createZip(
  files:
    Readonly<Record<string, string>>,
): Blob {
  const encoder =
    new TextEncoder();
  const localParts:
    ArrayBuffer[] = [];
  const centralParts:
    ArrayBuffer[] = [];
  let offset = 0;

  for (const [name, content] of
    Object.entries(files)) {
    const nameBytes =
      encoder.encode(name);
    const data =
      encoder.encode(content);
    const checksum =
      crc32(data);

    const local =
      new Uint8Array(
        30 +
        nameBytes.length +
        data.length,
      );
    const localView =
      new DataView(local.buffer);

    write32(
      localView,
      0,
      0x04034b50,
    );
    write16(localView, 4, 20);
    write16(localView, 6, 0);
    write16(localView, 8, 0);
    write16(localView, 10, 0);
    write16(localView, 12, 0);
    write32(
      localView,
      14,
      checksum,
    );
    write32(
      localView,
      18,
      data.length,
    );
    write32(
      localView,
      22,
      data.length,
    );
    write16(
      localView,
      26,
      nameBytes.length,
    );
    write16(localView, 28, 0);
    local.set(nameBytes, 30);
    local.set(
      data,
      30 + nameBytes.length,
    );

    const central =
      new Uint8Array(
        46 + nameBytes.length,
      );
    const centralView =
      new DataView(
        central.buffer,
      );

    write32(
      centralView,
      0,
      0x02014b50,
    );
    write16(centralView, 4, 20);
    write16(centralView, 6, 20);
    write16(centralView, 8, 0);
    write16(centralView, 10, 0);
    write16(centralView, 12, 0);
    write16(centralView, 14, 0);
    write32(
      centralView,
      16,
      checksum,
    );
    write32(
      centralView,
      20,
      data.length,
    );
    write32(
      centralView,
      24,
      data.length,
    );
    write16(
      centralView,
      28,
      nameBytes.length,
    );
    write16(centralView, 30, 0);
    write16(centralView, 32, 0);
    write16(centralView, 34, 0);
    write16(centralView, 36, 0);
    write32(centralView, 38, 0);
    write32(
      centralView,
      42,
      offset,
    );
    central.set(nameBytes, 46);

    localParts.push(
      exactBuffer(local),
    );
    centralParts.push(
      exactBuffer(central),
    );
    offset += local.length;
  }

  const centralOffset = offset;
  const centralSize =
    centralParts.reduce(
      (total, part) =>
        total +
        part.byteLength,
      0,
    );

  const end =
    new Uint8Array(22);
  const endView =
    new DataView(end.buffer);
  const count =
    Object.keys(files).length;

  write32(
    endView,
    0,
    0x06054b50,
  );
  write16(endView, 4, 0);
  write16(endView, 6, 0);
  write16(endView, 8, count);
  write16(endView, 10, count);
  write32(
    endView,
    12,
    centralSize,
  );
  write32(
    endView,
    16,
    centralOffset,
  );
  write16(endView, 20, 0);

  return new Blob(
    [
      ...localParts,
      ...centralParts,
      exactBuffer(end),
    ],
    {
      type: "application/zip",
    },
  );
}

function deepDifference(
  left: unknown,
  right: unknown,
  path = "$",
): readonly string[] {
  if (
    Object.is(left, right)
  ) {
    return [];
  }

  if (
    typeof left !==
      typeof right ||
    left === null ||
    right === null
  ) {
    return [
      `${path}: ${JSON.stringify(left)} → ${JSON.stringify(right)}`,
    ];
  }

  if (
    Array.isArray(left) &&
    Array.isArray(right)
  ) {
    const maximum =
      Math.max(
        left.length,
        right.length,
      );

    return Array.from(
      { length: maximum },
      (_, index) =>
        deepDifference(
          left[index],
          right[index],
          `${path}[${index}]`,
        ),
    ).flat();
  }

  if (
    typeof left === "object" &&
    typeof right === "object"
  ) {
    const leftRecord =
      left as
        Record<string, unknown>;
    const rightRecord =
      right as
        Record<string, unknown>;
    const keys =
      new Set([
        ...Object.keys(
          leftRecord,
        ),
        ...Object.keys(
          rightRecord,
        ),
      ]);

    return [...keys].flatMap(
      (key) =>
        deepDifference(
          leftRecord[key],
          rightRecord[key],
          `${path}.${key}`,
        ),
    );
  }

  return [
    `${path}: ${JSON.stringify(left)} → ${JSON.stringify(right)}`,
  ];
}

export default function AdminToolsApp() {
  const [tools, setTools] =
    useState<
      readonly AdminTool[]
    >([]);
  const [selectedId, setSelectedId] =
    useState(
      new URLSearchParams(
        window.location.search,
      ).get("tool") ??
        "composer-engine",
    );
  const [payload, setPayload] =
    useState("{}");
  const [result, setResult] =
    useState<RunResult>();
  const [testResult, setTestResult] =
    useState<TestResult>();
  const [history, setHistory] =
    useState<readonly RunResult[]>(
      () =>
        safeParse(
          localStorage.getItem(
            HISTORY_KEY,
          ),
          [],
        ),
    );
  const [cases, setCases] =
    useState<readonly SavedCase[]>(
      () =>
        safeParse(
          localStorage.getItem(
            CASES_KEY,
          ),
          [],
        ),
    );
  const [compareId, setCompareId] =
    useState<string>();
  const [busy, setBusy] =
    useState(false);
  const [testing, setTesting] =
    useState(false);
  const [error, setError] =
    useState<string>();
  const [caseName, setCaseName] =
    useState("");
  const fileRef =
    useRef<HTMLInputElement>(
      null,
    );

  const selected = useMemo(
    () =>
      tools.find(
        (tool) =>
          tool.id === selectedId,
      ),
    [selectedId, tools],
  );

  const comparison = useMemo(
    () =>
      history.find(
        (item) =>
          item.id === compareId,
      ),
    [compareId, history],
  );

  const differences = useMemo(
    () =>
      comparison && result
        ? deepDifference(
            comparison.output ??
              comparison.error,
            result.output ??
              result.error,
          )
        : [],
    [comparison, result],
  );

  useEffect(() => {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(history),
    );
  }, [history]);

  useEffect(() => {
    localStorage.setItem(
      CASES_KEY,
      JSON.stringify(cases),
    );
  }, [cases]);

  useEffect(() => {
    void fetch(
      "/api/v1/admin-tools",
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}`,
          );
        }

        return response.json() as
          Promise<{
            tools:
              readonly AdminTool[];
          }>;
      })
      .then(({ tools: loaded }) => {
        setTools(loaded);
      })
      .catch((reason: unknown) => {
        setError(
          reason instanceof Error
            ? reason.message
            : String(reason),
        );
      });
  }, []);

  useEffect(() => {
    if (!selected) return;

    setPayload(
      JSON.stringify(
        selected.defaultPayload ?? {},
        null,
        2,
      ),
    );
    setResult(undefined);
    setTestResult(undefined);
  }, [selected]);

  async function run(): Promise<void> {
    if (!selected || busy) return;

    setBusy(true);
    setError(undefined);

    try {
      const input =
        parsePayload(payload);
      const response =
        await fetch(
          `/api/v1/admin-tools/${selected.id}/run`,
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json",
            },
            body:
              JSON.stringify(input),
          },
        );

      const current =
        await response.json() as
          RunResult;

      setResult(current);
      setHistory((previous) =>
        Object.freeze([
          current,
          ...previous,
        ].slice(0, 100)),
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

  async function runTest(): Promise<void> {
    if (
      !selected?.testScript ||
      testing
    ) {
      return;
    }

    setTesting(true);
    setError(undefined);

    try {
      const response =
        await fetch(
          `/api/v1/admin-tools/${selected.id}/test`,
          {
            method: "POST",
          },
        );

      const current =
        await response.json() as
          TestResult & {
            error?: string;
          };

      if (!response.ok) {
        throw new Error(
          current.error ??
            "No se pudo ejecutar el test.",
        );
      }

      setTestResult(current);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : String(reason),
      );
    } finally {
      setTesting(false);
    }
  }

  function saveCase(): void {
    if (!selected) return;

    const time =
      new Date().toISOString();
    const item:
      SavedCase = {
        id:
          crypto.randomUUID(),
        name:
          caseName.trim() ||
          `${selected.name} · ${new Date().toLocaleString("es-ES")}`,
        toolId:
          selected.id,
        payload,
        ...(result
          ? { result }
          : {}),
        createdAt: time,
        updatedAt: time,
      };

    setCases((current) =>
      Object.freeze([
        item,
        ...current,
      ]),
    );
    setCaseName("");
  }

  function loadCase(
    item: SavedCase,
  ): void {
    setSelectedId(item.toolId);
    setPayload(item.payload);
    setResult(item.result);
  }

  function deleteCase(
    id: string,
  ): void {
    setCases((current) =>
      current.filter(
        (item) =>
          item.id !== id,
      ),
    );
  }

  async function importCase(
    event:
      ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file =
      event.target.files?.[0];

    if (!file) return;

    try {
      const parsed =
        JSON.parse(
          await file.text(),
        ) as
          Partial<SavedCase> & {
            case?: SavedCase;
          };

      const candidate =
        parsed.case ?? parsed;

      if (
        typeof candidate.toolId !==
          "string" ||
        typeof candidate.payload !==
          "string"
      ) {
        throw new Error(
          "El archivo no contiene un caso válido.",
        );
      }

      const time =
        new Date().toISOString();
      const imported:
        SavedCase = {
          id:
            crypto.randomUUID(),
          name:
            typeof candidate.name ===
              "string"
              ? candidate.name
              : file.name,
          toolId:
            candidate.toolId,
          payload:
            candidate.payload,
          ...(candidate.result
            ? {
                result:
                  candidate.result,
              }
            : {}),
          createdAt:
            typeof candidate.createdAt ===
              "string"
              ? candidate.createdAt
              : time,
          updatedAt: time,
        };

      setCases((current) =>
        Object.freeze([
          imported,
          ...current,
        ]),
      );
      loadCase(imported);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : String(reason),
      );
    } finally {
      event.target.value = "";
    }
  }

  async function copyCurrent(): Promise<void> {
    await navigator.clipboard.writeText(
      JSON.stringify(
        {
          exportedAt:
            new Date().toISOString(),
          tool: selected,
          payload:
            parsePayload(payload),
          result,
          testResult,
          location:
            window.location.href,
          userAgent:
            navigator.userAgent,
        },
        null,
        2,
      ),
    );
  }

  function exportCaseJson(): void {
    downloadJson(
      `recuerdarte-case-${selected?.id ?? "unknown"}-${stamp()}.json`,
      {
        id:
          crypto.randomUUID(),
        name:
          caseName ||
          selected?.name ||
          "Caso de prueba",
        toolId:
          selected?.id,
        payload,
        result,
        testResult,
        createdAt:
          new Date().toISOString(),
        updatedAt:
          new Date().toISOString(),
      },
    );
  }

  async function exportZip(): Promise<void> {
    let backendDiagnostic:
      unknown = {};

    try {
      const response =
        await fetch(
          "/api/v1/admin-tools-diagnostic",
        );
      backendDiagnostic =
        await response.json();
    } catch {
      backendDiagnostic = {
        error:
          "No se pudo recuperar el diagnóstico del backend.",
      };
    }

    const manifest = {
      format:
        "recuerdarte-engineering-case-v2",
      exportedAt:
        new Date().toISOString(),
      toolId:
        selected?.id,
      url:
        window.location.href,
      browser:
        navigator.userAgent,
      online:
        navigator.onLine,
    };

    const caseData = {
      id:
        crypto.randomUUID(),
      name:
        caseName ||
        selected?.name ||
        "Caso de prueba",
      toolId:
        selected?.id,
      payload,
      result,
      testResult,
      createdAt:
        new Date().toISOString(),
      updatedAt:
        new Date().toISOString(),
    };

    const zip = createZip({
      "manifest.json":
        JSON.stringify(
          manifest,
          null,
          2,
        ),
      "case.json":
        JSON.stringify(
          caseData,
          null,
          2,
        ),
      "tool.json":
        JSON.stringify(
          selected,
          null,
          2,
        ),
      "result.json":
        JSON.stringify(
          result ?? {},
          null,
          2,
        ),
      "test-result.json":
        JSON.stringify(
          testResult ?? {},
          null,
          2,
        ),
      "backend-diagnostic.json":
        JSON.stringify(
          backendDiagnostic,
          null,
          2,
        ),
      "local-history.json":
        JSON.stringify(
          history,
          null,
          2,
        ),
      "README.txt":
        [
          "RecuerdArte Engineering Case V2",
          "",
          `Herramienta: ${selected?.name ?? "desconocida"}`,
          `Exportado: ${new Date().toISOString()}`,
          "",
          "Para reproducir:",
          "1. Abre /admin/tools",
          "2. Importa case.json",
          "3. Ejecuta la herramienta",
          "4. Compara el nuevo resultado con result.json",
        ].join("\n"),
    });

    downloadBlob(
      `recuerdarte-case-${selected?.id ?? "unknown"}-${stamp()}.zip`,
      zip,
    );
  }

  return (
    <main className="engineeringConsole">
      <header className="engineeringHeader">
        <div>
          <p>
            RecuerdArte · Ingeniería
          </p>
          <h1>
            Consola de herramientas
          </h1>
          <span>
            Ejecuta, reproduce, compara y exporta cualquier subsistema.
          </span>
        </div>

        <div className="engineeringHeader__actions">
          <button
            type="button"
            onClick={() =>
              fileRef.current?.click()
            }
          >
            Importar caso
          </button>
          <input
            ref={fileRef}
            hidden
            type="file"
            accept=".json,application/json"
            onChange={(event) =>
              void importCase(event)
            }
          />
          <button
            type="button"
            onClick={() =>
              void exportZip()
            }
          >
            Exportar caso ZIP
          </button>
          <a href="/admin">
            Administración
          </a>
        </div>
      </header>

      {error ? (
        <div className="engineeringError">
          {error}
        </div>
      ) : null}

      <div className="engineeringLayout">
        <aside className="engineeringSidebar">
          <section>
            <h2>Herramientas</h2>
            {tools.map((tool) => (
              <button
                type="button"
                key={tool.id}
                className={
                  selectedId ===
                  tool.id
                    ? "is-active"
                    : ""
                }
                onClick={() => {
                  setSelectedId(
                    tool.id,
                  );
                  const url =
                    new URL(
                      window.location.href,
                    );
                  url.searchParams.set(
                    "tool",
                    tool.id,
                  );
                  window.history
                    .replaceState(
                      {},
                      "",
                      url,
                    );
                }}
              >
                <strong>
                  {tool.name}
                </strong>
                <small>
                  {tool.category}
                </small>
              </button>
            ))}
          </section>

          <section>
            <div className="sidebarTitle">
              <h2>Casos guardados</h2>
              <span>
                {cases.length}
              </span>
            </div>

            {cases.length === 0 ? (
              <p className="emptyCopy">
                Aún no hay casos.
              </p>
            ) : (
              cases.map((item) => (
                <article
                  key={item.id}
                  className="savedCase"
                >
                  <button
                    type="button"
                    onClick={() =>
                      loadCase(item)
                    }
                  >
                    <strong>
                      {item.name}
                    </strong>
                    <small>
                      {item.toolId}
                    </small>
                  </button>
                  <button
                    type="button"
                    aria-label="Eliminar caso"
                    onClick={() =>
                      deleteCase(item.id)
                    }
                  >
                    ×
                  </button>
                </article>
              ))
            )}
          </section>
        </aside>

        <section className="engineeringWorkspace">
          {selected ? (
            <>
              <header className="toolHeader">
                <div>
                  <span>
                    {selected.mode}
                  </span>
                  <h2>
                    {selected.name}
                  </h2>
                  <p>
                    {selected.description}
                  </p>
                </div>
                <a
                  href={
                    selected.adminPath
                  }
                >
                  Abrir herramienta
                </a>
              </header>

              <div className="engineeringGrid">
                <section className="engineeringPanel">
                  <div className="panelHeader">
                    <h3>
                      Entrada JSON
                    </h3>
                    <span>
                      editable
                    </span>
                  </div>

                  <textarea
                    value={payload}
                    onChange={(event) =>
                      setPayload(
                        event.target.value,
                      )
                    }
                    spellCheck={false}
                  />

                  <div className="primaryActions">
                    <button
                      type="button"
                      onClick={() =>
                        void run()
                      }
                      disabled={busy}
                    >
                      {busy
                        ? "Ejecutando…"
                        : "Ejecutar"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void runTest()
                      }
                      disabled={
                        testing ||
                        !selected.testScript
                      }
                    >
                      {testing
                        ? "Ejecutando test…"
                        : "Ejecutar test"}
                    </button>
                  </div>

                  <div className="caseSave">
                    <input
                      value={caseName}
                      onChange={(event) =>
                        setCaseName(
                          event.target.value,
                        )
                      }
                      placeholder="Nombre del caso"
                    />
                    <button
                      type="button"
                      onClick={saveCase}
                    >
                      Guardar caso
                    </button>
                  </div>

                  <div className="secondaryActions">
                    <button
                      type="button"
                      onClick={
                        exportCaseJson
                      }
                    >
                      Exportar JSON
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void copyCurrent()
                      }
                    >
                      Copiar para ChatGPT
                    </button>
                  </div>

                  {selected.testScript ? (
                    <code className="testCommand">
                      {
                        selected.testScript
                      }
                    </code>
                  ) : null}
                </section>

                <section className="engineeringPanel">
                  <div className="panelHeader">
                    <h3>Resultado</h3>
                    {result ? (
                      <span
                        className={`runStatus runStatus--${result.status.toLowerCase()}`}
                      >
                        {result.status} ·{" "}
                        {
                          result.durationMs
                        }{" "}
                        ms
                      </span>
                    ) : null}
                  </div>

                  <pre>
                    {JSON.stringify(
                      result?.output ??
                        result?.error ??
                        {
                          message:
                            "Ejecuta la herramienta para ver el resultado.",
                        },
                      null,
                      2,
                    )}
                  </pre>
                </section>
              </div>

              <div className="engineeringLowerGrid">
                <section className="engineeringPanel tracesPanel">
                  <div className="panelHeader">
                    <h3>Trazas</h3>
                    <span>
                      {
                        result?.traces
                          .length ?? 0
                      }
                    </span>
                  </div>

                  <div className="traceList">
                    {result?.traces
                      .length ? (
                      result.traces.map(
                        (trace, index) => (
                          <article
                            key={`${trace.at}-${index}`}
                          >
                            <span>
                              {
                                trace.phase
                              }
                            </span>
                            <div>
                              <strong>
                                {
                                  trace.message
                                }
                              </strong>
                              <small>
                                {trace.at}
                              </small>
                            </div>
                          </article>
                        ),
                      )
                    ) : (
                      <p className="emptyCopy">
                        Sin trazas todavía.
                      </p>
                    )}
                  </div>
                </section>

                <section className="engineeringPanel">
                  <div className="panelHeader">
                    <h3>Test Runner</h3>
                    {testResult ? (
                      <span
                        className={`runStatus runStatus--${testResult.status.toLowerCase()}`}
                      >
                        {
                          testResult.status
                        }{" "}
                        ·{" "}
                        {
                          testResult.durationMs
                        }{" "}
                        ms
                      </span>
                    ) : null}
                  </div>

                  <pre>
                    {testResult
                      ? [
                          testResult.stdout,
                          testResult.stderr,
                        ]
                          .filter(Boolean)
                          .join("\n")
                      : "Ejecuta el test permitido de esta herramienta."}
                  </pre>
                </section>
              </div>

              <section className="engineeringPanel comparisonPanel">
                <div className="panelHeader">
                  <h3>
                    Comparador de ejecuciones
                  </h3>
                  <select
                    value={
                      compareId ?? ""
                    }
                    onChange={(event) =>
                      setCompareId(
                        event.target
                          .value ||
                          undefined,
                      )
                    }
                  >
                    <option value="">
                      Seleccionar ejecución anterior
                    </option>
                    {history
                      .filter(
                        (item) =>
                          item.toolId ===
                          selected.id &&
                          item.id !==
                          result?.id,
                      )
                      .map((item) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {
                            item.completedAt
                          }{" "}
                          ·{" "}
                          {item.status}
                        </option>
                      ))}
                  </select>
                </div>

                {comparison && result ? (
                  <div className="comparisonGrid">
                    <pre>
                      {JSON.stringify(
                        comparison.output ??
                          comparison.error,
                        null,
                        2,
                      )}
                    </pre>
                    <pre>
                      {JSON.stringify(
                        result.output ??
                          result.error,
                        null,
                        2,
                      )}
                    </pre>
                    <div className="differenceList">
                      <strong>
                        Diferencias detectadas:{" "}
                        {differences.length}
                      </strong>
                      {differences
                        .slice(0, 200)
                        .map(
                          (
                            difference,
                            index,
                          ) => (
                            <code
                              key={`${difference}-${index}`}
                            >
                              {
                                difference
                              }
                            </code>
                          ),
                        )}
                    </div>
                  </div>
                ) : (
                  <p className="emptyCopy">
                    Ejecuta al menos dos veces la misma herramienta para compararlas.
                  </p>
                )}
              </section>
            </>
          ) : (
            <p>
              Cargando herramientas…
            </p>
          )}
        </section>
      </div>
    </main>
  );
}