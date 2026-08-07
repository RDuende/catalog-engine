import type { ArtifactSnapshot } from "../artifact-domain/index.js";
import type { PresentationTemplate } from "./presentation.types.js";

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  }[char] ?? char));
}

function mimeToDataUri(mimeType: string, content: Uint8Array): string {
  return `data:${mimeType};base64,${Buffer.from(content).toString("base64")}`;
}

export function composePresentationSvg(input: {
  readonly template: PresentationTemplate;
  readonly sourceArtifact: ArtifactSnapshot;
  readonly sourceContent: Uint8Array;
}): Uint8Array {
  const { template, sourceArtifact, sourceContent } = input;
  const mimeType = sourceArtifact.mimeType ?? "image/png";
  const imageUri = mimeToDataUri(mimeType, sourceContent);
  const area = template.printableArea;
  const clipId = `clip-${template.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

  const productShape = template.productKind === "TSHIRT"
    ? `<path d="M360 250 L260 340 L330 455 L390 420 L390 940 L810 940 L810 420 L870 455 L940 340 L840 250 L740 300 Q600 390 460 300 Z" fill="${template.productColor}" stroke="#c8c8c8" stroke-width="8"/>`
    : template.productKind === "MUG"
      ? `<rect x="275" y="330" width="620" height="470" rx="72" fill="${template.productColor}" stroke="#c8c8c8" stroke-width="8"/><path d="M890 430 Q1080 420 1060 590 Q1040 740 890 700" fill="none" stroke="#c8c8c8" stroke-width="54"/>`
      : template.productKind === "CANVAS"
        ? `<rect x="220" y="180" width="760" height="760" fill="${template.productColor}" stroke="#7d6e62" stroke-width="18"/><rect x="235" y="195" width="730" height="730" fill="none" stroke="#d8cabb" stroke-width="5"/>`
        : `<rect x="205" y="240" width="790" height="690" rx="18" fill="${template.productColor}" stroke="#b9aa93" stroke-width="10"/>`;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${template.width}" height="${template.height}" viewBox="0 0 ${template.width} ${template.height}">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="24" stdDeviation="22" flood-color="#000000" flood-opacity="0.22"/>
    </filter>
    <clipPath id="${clipId}">
      <rect x="${area.x}" y="${area.y}" width="${area.width}" height="${area.height}" rx="${area.borderRadius ?? 0}"/>
    </clipPath>
  </defs>
  <rect width="100%" height="100%" fill="${template.background}"/>
  <g filter="url(#shadow)">${productShape}</g>
  <image href="${imageUri}" x="${area.x}" y="${area.y}" width="${area.width}" height="${area.height}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>
  <text x="600" y="1080" text-anchor="middle" font-family="Arial, sans-serif" font-size="38" font-weight="700" fill="#343434">${escapeXml(template.title)}</text>
  <text x="600" y="1132" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#666666">Vista previa · ${escapeXml(sourceArtifact.id)}</text>
</svg>`;

  return Buffer.from(svg, "utf8");
}
