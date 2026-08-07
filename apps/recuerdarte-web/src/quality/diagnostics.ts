export type DiagnosticRequest = {
  readonly id: string;
  readonly method: string;
  readonly url: string;
  readonly status?: number;
  readonly ok?: boolean;
  readonly durationMs: number;
  readonly startedAt: string;
  readonly error?: string;
};

const REQUEST_LIMIT = 40;
const requests: DiagnosticRequest[] = [];
const listeners = new Set<() => void>();
let installed = false;

function notify(): void {
  for (const listener of listeners) listener();
}

export function subscribeDiagnostics(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDiagnosticRequests(): readonly DiagnosticRequest[] {
  return [...requests];
}

function pushRequest(request: DiagnosticRequest): void {
  requests.unshift(request);
  if (requests.length > REQUEST_LIMIT) requests.length = REQUEST_LIMIT;
  notify();
}

export function installDiagnosticsFetchObserver(): void {
  if (installed || typeof globalThis.fetch !== "function") return;
  installed = true;
  const originalFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const started = performance.now();
    const startedAt = new Date().toISOString();
    const method = String(init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      const response = await originalFetch(input, init);
      pushRequest({ id, method, url, status: response.status, ok: response.ok, durationMs: Math.round(performance.now() - started), startedAt });
      return response;
    } catch (error) {
      pushRequest({ id, method, url, durationMs: Math.round(performance.now() - started), startedAt, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  };
}
