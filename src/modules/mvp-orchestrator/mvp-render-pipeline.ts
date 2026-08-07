import { createHash, randomUUID } from "node:crypto";

export type MvpRenderLayerType =
  | "BACKGROUND"
  | "IMAGE"
  | "TEXT"
  | "DECORATION";

export interface MvpRenderCanvas {
  readonly width: number;
  readonly height: number;
  readonly unit: "PX";
  readonly background: string;
  readonly safeArea: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
}

export interface MvpRenderLayerBase {
  readonly id: string;
  readonly type: MvpRenderLayerType;
  readonly name: string;
  readonly visible: boolean;
  readonly locked: boolean;
  readonly zIndex: number;
}

export interface MvpRenderTextLayer extends MvpRenderLayerBase {
  readonly type: "TEXT";
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly align: "LEFT" | "CENTER";
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly fontWeight: number;
  readonly lineHeight: number;
  readonly fill: string;
}

export interface MvpRenderImageLayer extends MvpRenderLayerBase {
  readonly type: "IMAGE";
  readonly src: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly fit: "COVER" | "CONTAIN";
  readonly opacity: number;
  readonly radius: number;
}

export interface MvpRenderShapeLayer extends MvpRenderLayerBase {
  readonly type: "BACKGROUND" | "DECORATION";
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly fill: string;
  readonly opacity: number;
  readonly radius: number;
}

export type MvpRenderLayer =
  | MvpRenderTextLayer
  | MvpRenderImageLayer
  | MvpRenderShapeLayer;

export interface MvpRenderScene {
  readonly id: string;
  readonly sessionId: string;
  readonly proposalId: string;
  readonly designVariantId: string;
  readonly canvas: MvpRenderCanvas;
  readonly layers: readonly MvpRenderLayer[];
  readonly svg: string;
  readonly fingerprint: string;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface MvpRenderInput {
  readonly proposalId: string;
  readonly designVariantId: string;
  readonly style: "ETHEREAL" | "EDITORIAL" | "MEMORY_COLLAGE";
  readonly headline: string;
  readonly supportingText: string;
  readonly palette: readonly string[];
  readonly photoUrl?: string;
  readonly now?: string;
}

function clean(value: string | undefined): string {
  return value?.trim() ?? "";
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function palette(input: readonly string[]): readonly string[] {
  const normalized = input.map((item) => item.trim()).filter(Boolean);
  return normalized.length >= 2
    ? Object.freeze(normalized.slice(0, 5))
    : Object.freeze(["#ead6e2", "#d8e7e1", "#fffaf5"]);
}

function toColor(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (/^#[0-9a-f]{3,8}$/iu.test(trimmed)) return trimmed;

  const names: Readonly<Record<string, string>> = Object.freeze({
    marfil: "#fffaf0",
    "malva suave": "#d8bfd2",
    malva: "#c89bb6",
    "verde salvia": "#a8b8a1",
    azul: "#7f9db7",
    dorado: "#c7a85b",
    rosa: "#d7a5b7",
    negro: "#222222",
    blanco: "#ffffff",
  });

  return names[trimmed.toLowerCase()] ?? fallback;
}

function fitFontSize(text: string, maxWidth: number, preferred: number): number {
  const safeLength = Math.max(1, text.length);
  const estimated = maxWidth / (safeLength * 0.56);
  return Math.max(24, Math.min(preferred, Math.floor(estimated)));
}

function fingerprint(input: MvpRenderInput): string {
  return createHash("sha256")
    .update(JSON.stringify({
      proposalId: input.proposalId,
      designVariantId: input.designVariantId,
      style: input.style,
      headline: clean(input.headline),
      supportingText: clean(input.supportingText),
      palette: palette(input.palette),
      photoUrl: clean(input.photoUrl),
    }))
    .digest("hex");
}

function sceneLayers(input: MvpRenderInput): readonly MvpRenderLayer[] {
  const colors = palette(input.palette);
  const backgroundA = toColor(colors[0] ?? "", "#ead6e2");
  const backgroundB = toColor(colors[1] ?? "", "#d8e7e1");
  const ink = "#3d303c";
  const headline = clean(input.headline) || "Un recuerdo especial";
  const supporting = clean(input.supportingText) || "Hay momentos que merecen quedarse para siempre.";
  const hasPhoto = Boolean(clean(input.photoUrl));

  const layers: MvpRenderLayer[] = [
    Object.freeze({
      id: "background",
      type: "BACKGROUND",
      name: "Fondo",
      visible: true,
      locked: true,
      zIndex: 0,
      x: 0,
      y: 0,
      width: 1080,
      height: 1080,
      fill: backgroundA,
      opacity: 1,
      radius: 0,
    }),
    Object.freeze({
      id: "accent",
      type: "DECORATION",
      name: "Acento",
      visible: true,
      locked: false,
      zIndex: 1,
      x: input.style === "EDITORIAL" ? 710 : 120,
      y: input.style === "MEMORY_COLLAGE" ? 90 : 120,
      width: input.style === "EDITORIAL" ? 260 : 840,
      height: input.style === "MEMORY_COLLAGE" ? 170 : 840,
      fill: backgroundB,
      opacity: input.style === "ETHEREAL" ? 0.42 : 0.72,
      radius: input.style === "EDITORIAL" ? 24 : 90,
    }),
  ];

  if (hasPhoto) {
    layers.push(Object.freeze({
      id: "photo",
      type: "IMAGE",
      name: "Fotografía",
      visible: true,
      locked: false,
      zIndex: 2,
      src: clean(input.photoUrl),
      x: input.style === "EDITORIAL" ? 560 : 180,
      y: input.style === "MEMORY_COLLAGE" ? 160 : 180,
      width: input.style === "EDITORIAL" ? 400 : 720,
      height: input.style === "EDITORIAL" ? 720 : 540,
      fit: "COVER",
      opacity: input.style === "ETHEREAL" ? 0.82 : 1,
      radius: input.style === "MEMORY_COLLAGE" ? 18 : 38,
    }));
  }

  const textX = input.style === "EDITORIAL" ? 90 : 140;
  const textWidth = input.style === "EDITORIAL" ? 410 : 800;
  const headlineY = input.style === "MEMORY_COLLAGE" ? 760 : hasPhoto ? 770 : 410;

  layers.push(
    Object.freeze({
      id: "headline",
      type: "TEXT",
      name: "Título",
      visible: true,
      locked: false,
      zIndex: 3,
      text: headline,
      x: textX,
      y: headlineY,
      width: textWidth,
      align: input.style === "EDITORIAL" ? "LEFT" : "CENTER",
      fontFamily: input.style === "EDITORIAL" ? "Arial, sans-serif" : "Georgia, serif",
      fontSize: fitFontSize(headline, textWidth, input.style === "EDITORIAL" ? 78 : 92),
      fontWeight: 700,
      lineHeight: 1.05,
      fill: ink,
    }),
    Object.freeze({
      id: "supporting",
      type: "TEXT",
      name: "Texto secundario",
      visible: true,
      locked: false,
      zIndex: 4,
      text: supporting,
      x: textX,
      y: headlineY + 105,
      width: textWidth,
      align: input.style === "EDITORIAL" ? "LEFT" : "CENTER",
      fontFamily: "Arial, sans-serif",
      fontSize: fitFontSize(supporting, textWidth, 34),
      fontWeight: 400,
      lineHeight: 1.35,
      fill: ink,
    }),
  );

  return Object.freeze(layers);
}

function renderSvg(canvas: MvpRenderCanvas, layers: readonly MvpRenderLayer[]): string {
  const body = [...layers]
    .sort((left, right) => left.zIndex - right.zIndex)
    .filter((layer) => layer.visible)
    .map((layer) => {
      if (layer.type === "TEXT") {
        const anchor = layer.align === "CENTER" ? "middle" : "start";
        const x = layer.align === "CENTER" ? layer.x + layer.width / 2 : layer.x;
        const lines = layer.text.split(/\n/u);
        return `<text x="${x}" y="${layer.y}" text-anchor="${anchor}" font-family="${escapeXml(layer.fontFamily)}" font-size="${layer.fontSize}" font-weight="${layer.fontWeight}" fill="${escapeXml(layer.fill)}">${lines.map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : layer.fontSize * layer.lineHeight}">${escapeXml(line)}</tspan>`).join("")}</text>`;
      }

      if (layer.type === "IMAGE") {
        const preserve = layer.fit === "COVER" ? "xMidYMid slice" : "xMidYMid meet";
        return `<defs><clipPath id="clip-${layer.id}"><rect x="${layer.x}" y="${layer.y}" width="${layer.width}" height="${layer.height}" rx="${layer.radius}"/></clipPath></defs><image href="${escapeXml(layer.src)}" x="${layer.x}" y="${layer.y}" width="${layer.width}" height="${layer.height}" opacity="${layer.opacity}" preserveAspectRatio="${preserve}" clip-path="url(#clip-${layer.id})"/>`;
      }

      return `<rect x="${layer.x}" y="${layer.y}" width="${layer.width}" height="${layer.height}" rx="${layer.radius}" fill="${escapeXml(layer.fill)}" opacity="${layer.opacity}"/>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">${body}</svg>`;
}

export class InMemoryMvpRenderPipelineRepository {
  readonly #scenes = new Map<string, MvpRenderScene>();

  private key(sessionId: string, proposalId: string): string {
    return `${sessionId}:${proposalId}`;
  }

  get(sessionId: string, proposalId: string): MvpRenderScene | undefined {
    return this.#scenes.get(this.key(sessionId, proposalId));
  }

  render(sessionId: string, input: MvpRenderInput): MvpRenderScene {
    const now = input.now ?? new Date().toISOString();
    const current = this.get(sessionId, input.proposalId);
    const nextFingerprint = fingerprint(input);

    if (current?.fingerprint === nextFingerprint) {
      return current;
    }

    const canvas: MvpRenderCanvas = Object.freeze({
      width: 1080,
      height: 1080,
      unit: "PX",
      background: "#fffaf5",
      safeArea: Object.freeze({
        x: 70,
        y: 70,
        width: 940,
        height: 940,
      }),
    });

    const layers = sceneLayers(input);
    const scene = Object.freeze({
      id: current?.id ?? randomUUID(),
      sessionId,
      proposalId: input.proposalId,
      designVariantId: input.designVariantId,
      canvas,
      layers,
      svg: renderSvg(canvas, layers),
      fingerprint: nextFingerprint,
      version: (current?.version ?? 0) + 1,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    } satisfies MvpRenderScene);

    this.#scenes.set(this.key(sessionId, input.proposalId), scene);
    return scene;
  }
}
