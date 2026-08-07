import { joinUrl } from "./provider-utils.js";
import type { ProviderConnectionConfig } from "./provider-types.js";
import { ProviderRateLimiter, type RateLimitSnapshot } from "./provider-rate-limiter.js";

export interface MakitoCredentials {
  clientId: string;
  clientSecret: string;
}

export interface MakitoApiConfig extends ProviderConnectionConfig {
  clientId?: string;
  clientSecret?: string;
  lang?: "es" | "en" | "fr";
  plant?: string;
  storageLocation?: string;
  rateLimitCapacity?: number;
  rateLimitRefillPerMinute?: number;
  rateLimitSafetyFactor?: number;
  maxRetries?: number;
}

export interface MakitoDiagnosticResult {
  ok: boolean;
  login: {
    ok: boolean;
    tokenPrefix?: string;
    tokenExpiresAt?: string;
  };
  request: {
    method: "GET";
    url: string;
    authorization: "Bearer [REDACTED]";
    accept: string;
  };
  response: {
    status: number;
    statusText: string;
    url: string;
    redirected: boolean;
    location?: string;
    contentType?: string;
    contentLength?: string;
    bodyPreview?: string;
  };
  interpretation: string;
}

export class MakitoHttpError extends Error {
  constructor(
    readonly status: number,
    readonly statusText: string,
    readonly url: string,
    readonly responseBody: string,
    readonly responseHeaders: Record<string, string>
  ) {
    const preview = responseBody.trim().slice(0, 500) || statusText || "Sin cuerpo de respuesta";
    super(`Makito HTTP ${status}: ${preview}`);
    this.name = "MakitoHttpError";
  }
}

type TokenCacheEntry = { token: string; expiresAt: number };
const tokenCache = new Map<string, TokenCacheEntry>();
const limiterCache = new Map<string, ProviderRateLimiter>();

function positiveNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function makitoLimiter(config: MakitoApiConfig): ProviderRateLimiter {
  const capacity = positiveNumber(config.rateLimitCapacity ?? process.env.MAKITO_RATE_LIMIT_CAPACITY, 100);
  const refillPerMinute = positiveNumber(config.rateLimitRefillPerMinute ?? process.env.MAKITO_RATE_LIMIT_REFILL_PER_MINUTE, 25);
  const safetyFactor = Math.min(1, Math.max(0.1, positiveNumber(config.rateLimitSafetyFactor ?? process.env.MAKITO_RATE_LIMIT_SAFETY_FACTOR, 0.9)));
  const key = `${config.baseUrl}|${capacity}|${refillPerMinute}|${safetyFactor}`;
  let limiter = limiterCache.get(key);
  if (!limiter) {
    limiter = new ProviderRateLimiter({ capacity, refillTokens: refillPerMinute, refillIntervalMs: 60_000, safetyFactor });
    limiterCache.set(key, limiter);
  }
  return limiter;
}

function retryDelayMs(response: Response, attempt: number): number {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds * 1000);
    const date = Date.parse(retryAfter);
    if (Number.isFinite(date)) return Math.max(0, date - Date.now());
  }
  return Math.min(60_000, 2_500 * 2 ** attempt) + Math.floor(Math.random() * 250);
}

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

function decodeJwtExpiry(token: string): number | undefined {
  try {
    const payload = token.split(".")[1];
    if (!payload) return undefined;
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: number };
    return decoded.exp ? decoded.exp * 1000 : undefined;
  } catch {
    return undefined;
  }
}

function resolveCredentials(config: MakitoApiConfig): MakitoCredentials {
  const clientId = config.clientId ?? process.env.MAKITO_CLIENT_ID;
  const clientSecret = config.clientSecret ?? process.env.MAKITO_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Faltan MAKITO_CLIENT_ID y MAKITO_CLIENT_SECRET en el archivo .env.");
  }
  return { clientId, clientSecret };
}

export function resolveMakitoConfig(config: Partial<MakitoApiConfig> = {}): MakitoApiConfig {
  return {
    baseUrl: config.baseUrl ?? process.env.MAKITO_API_BASE_URL ?? "https://apis.makito.es",
    timeoutMs: config.timeoutMs ?? 120_000,
    lang: config.lang ?? "es",
    plant: config.plant,
    storageLocation: config.storageLocation,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    headers: config.headers,
    rateLimitCapacity: config.rateLimitCapacity,
    rateLimitRefillPerMinute: config.rateLimitRefillPerMinute,
    rateLimitSafetyFactor: config.rateLimitSafetyFactor,
    maxRetries: config.maxRetries ?? positiveNumber(process.env.MAKITO_MAX_RETRIES, 5)
  };
}

function headersToRecord(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!response.ok) {
    throw new MakitoHttpError(
      response.status,
      response.statusText,
      response.url,
      text,
      headersToRecord(response.headers)
    );
  }
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`Makito no devolvió JSON válido. Content-Type: ${response.headers.get("content-type") ?? "desconocido"}. Inicio: ${text.slice(0, 250)}`);
  }
}

export async function getMakitoToken(input: Partial<MakitoApiConfig> = {}, forceRefresh = false): Promise<string> {
  const config = resolveMakitoConfig(input);
  const credentials = resolveCredentials(config);
  const cacheKey = `${config.baseUrl}|${credentials.clientId}`;
  const cached = tokenCache.get(cacheKey);
  if (!forceRefresh && cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs ?? 120_000);
  try {
    await makitoLimiter(config).acquire();
    const response = await fetch(joinUrl(config.baseUrl, "/access/auth/login"), {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(credentials),
      signal: controller.signal
    });
    const raw = await readJson(response) as { token?: unknown } | null;
    const token = typeof raw?.token === "string" ? raw.token.trim() : undefined;
    if (!token) throw new Error("La respuesta de login de Makito no contiene el campo token.");
    tokenCache.set(cacheKey, { token, expiresAt: decodeJwtExpiry(token) ?? Date.now() + 50 * 60_000 });
    return token;
  } finally {
    clearTimeout(timeout);
  }
}

function buildMakitoUrl(config: MakitoApiConfig, path: string, query: Record<string, string | undefined>): URL {
  const url = new URL(joinUrl(config.baseUrl, path));
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) url.searchParams.set(key, value);
  }
  return url;
}

function requestHeaders(config: MakitoApiConfig, token: string): Record<string, string> {
  return {
    ...config.headers,
    accept: "application/json",
    authorization: `Bearer ${token}`
  };
}

export async function makitoFetchJson<T = unknown>(input: Partial<MakitoApiConfig>, path: string, query: Record<string, string | undefined> = {}): Promise<T> {
  const config = resolveMakitoConfig(input);
  const url = buildMakitoUrl(config, path, query);

  const request = async (forceRefresh: boolean): Promise<Response> => {
    const token = await getMakitoToken(config, forceRefresh);
    await makitoLimiter(config).acquire();
    return fetch(url, {
      headers: requestHeaders(config, token),
      redirect: "follow"
    });
  };

  const maxRetries = Math.max(0, Math.floor(config.maxRetries ?? 5));
  let forceRefresh = false;
  for (let attempt = 0; ; attempt += 1) {
    const response = await request(forceRefresh);
    if (response.status === 401 && !forceRefresh) {
      forceRefresh = true;
      continue;
    }
    if ((response.status === 429 || response.status === 503) && attempt < maxRetries) {
      await sleep(retryDelayMs(response, attempt));
      continue;
    }
    return await readJson(response) as T;
  }
}

export async function makitoFetchBinary(
  input: Partial<MakitoApiConfig>,
  resourceUrl: string,
): Promise<{ bytes: Buffer; contentType: string; sourceUrl: string }> {
  const config = resolveMakitoConfig(input);
  const maxRetries = Math.max(0, Math.floor(config.maxRetries ?? 5));

  const request = async (url: string, forceRefresh: boolean): Promise<Response> => {
    const token = await getMakitoToken(config, forceRefresh);
    await makitoLimiter(config).acquire();
    return fetch(url, {
      headers: { ...config.headers, accept: "image/*", authorization: `Bearer ${token}` },
      redirect: "manual",
    });
  };

  let currentUrl = new URL(resourceUrl, config.baseUrl).toString();
  let forceRefresh = false;
  let redirects = 0;
  for (let attempt = 0; ; attempt += 1) {
    const response = await request(currentUrl, forceRefresh);
    if (response.status === 401 && !forceRefresh) {
      forceRefresh = true;
      continue;
    }
    if ((response.status === 429 || response.status === 503) && attempt < maxRetries) {
      await sleep(retryDelayMs(response, attempt));
      continue;
    }
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new MakitoHttpError(response.status, response.statusText, currentUrl, "Redirección sin Location", headersToRecord(response.headers));
      redirects += 1;
      if (redirects > 5) throw new Error("Demasiadas redirecciones al descargar una imagen de Makito.");
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }
    if (!response.ok) {
      const body = await response.text();
      throw new MakitoHttpError(response.status, response.statusText, currentUrl, body, headersToRecord(response.headers));
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    return {
      bytes,
      contentType: response.headers.get("content-type")?.split(";")[0]?.trim() || "application/octet-stream",
      sourceUrl: currentUrl,
    };
  }
}

export async function diagnoseMakitoEndpoint(
  input: Partial<MakitoApiConfig> = {},
  path = "/catalog/files",
  query: Record<string, string | undefined> = { format: "JSON", lang: "es" }
): Promise<MakitoDiagnosticResult> {
  const config = resolveMakitoConfig(input);
  const token = await getMakitoToken(config, true);
  const expiry = decodeJwtExpiry(token);
  const url = buildMakitoUrl(config, path, query);
  const response = await fetch(url, {
    headers: requestHeaders(config, token),
    redirect: "manual"
  });
  const body = await response.text();
  const location = response.headers.get("location") ?? undefined;

  let interpretation: string;
  if (response.status >= 300 && response.status < 400 && location) {
    interpretation = "Makito está redirigiendo la descarga. El conector debe revisar si el destino requiere conservar Authorization o si la URL ya está firmada.";
  } else if (response.status === 401) {
    interpretation = "El endpoint no acepta el JWT obtenido o el token ha caducado.";
  } else if (response.status === 403) {
    interpretation = "El login es válido, pero Makito deniega este recurso. El cuerpo de respuesta permite distinguir permisos, formato o política de acceso.";
  } else if (response.ok) {
    interpretation = "El endpoint responde correctamente. Si preview sigue fallando, el problema está en el tratamiento posterior de la respuesta.";
  } else {
    interpretation = "Makito respondió con un error distinto de autenticación. Revisa status y bodyPreview.";
  }

  return {
    ok: response.ok,
    login: {
      ok: true,
      tokenPrefix: `${token.slice(0, 12)}…`,
      tokenExpiresAt: expiry ? new Date(expiry).toISOString() : undefined
    },
    request: {
      method: "GET",
      url: url.toString(),
      authorization: "Bearer [REDACTED]",
      accept: "application/json"
    },
    response: {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      redirected: response.redirected,
      location,
      contentType: response.headers.get("content-type") ?? undefined,
      contentLength: response.headers.get("content-length") ?? undefined,
      bodyPreview: body.slice(0, 2000) || undefined
    },
    interpretation
  };
}

export function getMakitoRateLimitStatus(input: Partial<MakitoApiConfig> = {}): RateLimitSnapshot {
  return makitoLimiter(resolveMakitoConfig(input)).snapshot();
}

export function clearMakitoTokenCache(): void {
  tokenCache.clear();
}

export function clearMakitoRateLimitCache(): void {
  limiterCache.clear();
}
