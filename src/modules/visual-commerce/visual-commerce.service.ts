import { Buffer } from "node:buffer";
import { env } from "../../config/env.js";

export type MockupInput = {
  productName: string;
  productImageUrl?: string | null;
  customerImageDataUrl: string;
  text?: string;
  style?: string;
  size?: string;
};

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[char]!));
}

function assertImageDataUrl(value: string): void {
  if (!/^data:image\/(png|jpeg|jpg|webp);base64,[a-z0-9+/=\s]+$/i.test(value)) throw new Error("La imagen subida no tiene un formato válido.");
  const base64 = value.split(",", 2)[1] ?? "";
  if (Buffer.byteLength(base64, "base64") > 8 * 1024 * 1024) throw new Error("La imagen supera el límite de 8 MB.");
}

function dataUrlToBlob(value: string): Blob {
  assertImageDataUrl(value);
  const [header = "", base64 = ""] = value.split(",", 2);
  const mime = header.match(/^data:([^;]+)/)?.[1] ?? "image/png";
  return new Blob([Buffer.from(base64, "base64")], { type: mime });
}

async function remoteImageToBlob(url: string): Promise<Blob | undefined> {
  try {
    if (url.startsWith("data:image/")) return dataUrlToBlob(url);
    const response = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    if (!response.ok) return undefined;
    const type = response.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) return undefined;
    return await response.blob();
  } catch {
    return undefined;
  }
}

function mockupPrompt(input: MockupInput): string {
  const details = [input.style ? `estilo ${input.style}` : "", input.size ? `formato ${input.size}` : ""].filter(Boolean).join(", ");
  return [
    `Crea un mockup comercial fotorrealista de un producto llamado «${input.productName}».`,
    "La primera imagen, cuando exista, es la referencia exacta del modelo de producto. Conserva su forma, materiales, color, proporciones y herrajes.",
    "La última imagen es la fotografía del cliente. Colócala únicamente en el área personalizable del producto, con perspectiva, recorte e iluminación realistas.",
    input.text ? `Incluye de forma elegante el texto exacto: «${input.text}».` : "No añadas textos inventados.",
    details ? `Detalles solicitados: ${details}.` : "",
    "Presenta una sola unidad sobre un fondo de estudio cálido y limpio. No cambies rostros, no añadas personas y no inventes logotipos ni elementos extra.",
  ].filter(Boolean).join(" ");
}

async function generateWithOpenAI(input: MockupInput) {
  if (!env.openAiApiKey) return undefined;
  const form = new FormData();
  form.append("model", env.openAiImageModel);
  form.append("prompt", mockupPrompt(input));
  form.append("size", "1024x1024");
  form.append("quality", env.openAiImageQuality);
  form.append("output_format", "png");
  form.append("input_fidelity", "high");

  const productBlob = input.productImageUrl ? await remoteImageToBlob(input.productImageUrl) : undefined;
  if (productBlob) form.append("image", productBlob, "product-reference.png");
  form.append("image", dataUrlToBlob(input.customerImageDataUrl), "customer-photo.png");

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.openAiApiKey}` },
    body: form,
    signal: AbortSignal.timeout(120_000),
  });
  const raw = await response.text();
  let data: any;
  try { data = JSON.parse(raw); } catch { data = { raw }; }
  if (!response.ok) throw new Error(data?.error?.message ?? `OpenAI Images respondió HTTP ${response.status}.`);
  const item = data?.data?.[0];
  const base64 = item?.b64_json;
  if (typeof base64 === "string" && base64) {
    return {
      mimeType: "image/png",
      dataUrl: `data:image/png;base64,${base64}`,
      generator: env.openAiImageModel,
      provider: "openai" as const,
    };
  }

  // Compatibilidad defensiva por si la API devuelve una URL temporal.
  const imageUrl = item?.url;
  if (typeof imageUrl === "string" && imageUrl) {
    const outputBlob = await remoteImageToBlob(imageUrl);
    if (outputBlob) {
      const bytes = Buffer.from(await outputBlob.arrayBuffer());
      const mimeType = outputBlob.type || "image/png";
      return {
        mimeType,
        dataUrl: `data:${mimeType};base64,${bytes.toString("base64")}`,
        generator: env.openAiImageModel,
        provider: "openai" as const,
      };
    }
  }

  throw new Error("OpenAI Images no devolvió una imagen utilizable.");
}

function generateTemplateMockup(input: MockupInput) {
  const name = escapeXml(input.productName);
  const caption = escapeXml(input.text ?? "Tu fotografía");
  const details = escapeXml([input.size, input.style].filter(Boolean).join(" · "));
  const lower = input.productName.toLowerCase();
  const isKeyring = /llavero|keychain/.test(lower);
  const isCanvas = /lienzo|canvas/.test(lower);
  const frame = isKeyring
    ? '<path d="M340 145a60 60 0 1 1 120 0" fill="none" stroke="#b9b9b9" stroke-width="22"/><rect x="250" y="185" width="300" height="380" rx="70" fill="#f5f2ed" stroke="#c9c0b7" stroke-width="14"/>'
    : isCanvas
      ? '<rect x="120" y="90" width="560" height="420" rx="8" fill="#faf8f4" stroke="#c9bcae" stroke-width="18"/><path d="M680 110l45 35v400l-45-35z" fill="#d8cec4"/>'
      : '<rect x="150" y="95" width="500" height="430" rx="36" fill="#f5f2ed" stroke="#c9c0b7" stroke-width="14"/>';
  const clip = isKeyring ? '<rect x="280" y="215" width="240" height="280" rx="44"/>' : isCanvas ? '<rect x="145" y="115" width="510" height="360" rx="2"/>' : '<rect x="185" y="130" width="430" height="330" rx="20"/>';
  const img = isKeyring ? {x:280,y:215,w:240,h:280} : isCanvas ? {x:145,y:115,w:510,h:360} : {x:185,y:130,w:430,h:330};
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs><filter id="shadow"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-opacity=".18"/></filter><clipPath id="photo">${clip}</clipPath></defs>
  <rect width="800" height="800" fill="#f3ede5"/><ellipse cx="400" cy="620" rx="270" ry="45" fill="#000" opacity=".10"/>
  <g filter="url(#shadow)">${frame}<image href="${input.customerImageDataUrl}" x="${img.x}" y="${img.y}" width="${img.w}" height="${img.h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#photo)"/></g>
  <text x="400" y="690" text-anchor="middle" font-family="Arial,sans-serif" font-size="30" font-weight="700" fill="#352e29">${name}</text>
  <text x="400" y="730" text-anchor="middle" font-family="Arial,sans-serif" font-size="21" fill="#6d625a">${caption}</text>
  <text x="400" y="760" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" fill="#8d8178">${details}</text></svg>`;
  return {
    mimeType: "image/svg+xml",
    dataUrl: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
    generator: isKeyring ? "keyring-template-v2" : isCanvas ? "canvas-template-v2" : "generic-template-v2",
    provider: "template" as const,
  };
}

export async function generateProductMockup(input: MockupInput) {
  assertImageDataUrl(input.customerImageDataUrl);
  try {
    const generated = await generateWithOpenAI(input);
    if (generated) return generated;
  } catch (error) {
    const fallback = generateTemplateMockup(input);
    return { ...fallback, warning: error instanceof Error ? error.message : String(error) };
  }
  return generateTemplateMockup(input);
}
