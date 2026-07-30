import type { ProviderAuth, ProviderConnectionConfig } from "./provider-types.js";

function authHeaders(auth?: ProviderAuth): Record<string, string> {
  if (!auth || auth.type === "none") return {};
  if (auth.type === "bearer") return { authorization: `Bearer ${auth.token}` };
  if (auth.type === "api-key") return { [auth.header]: auth.value };
  return { authorization: `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString("base64")}` };
}

export async function providerFetch(config: ProviderConnectionConfig, url: URL): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs ?? 30_000);
  try {
    const response = await fetch(url, {
      headers: { accept: "application/json", ...config.headers, ...authHeaders(config.auth) },
      signal: controller.signal
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${text.slice(0, 500)}`);
    if (!text.trim()) return null;
    try { return JSON.parse(text) as unknown; }
    catch { throw new Error("La API no devolvió JSON válido."); }
  } finally {
    clearTimeout(timeout);
  }
}
