import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { normalizeMarkingTechnique } from "./marking-technique.normalizer.js";
import type {
  ProductMarkingArea,
  ProductMarkingProfile,
  ProductMarkingTechnique,
  ProviderMarkingEvidence,
} from "./marking-intelligence.types.js";

const DATA_DIR = path.resolve(process.env.MARKING_INTELLIGENCE_DIR ?? "storage/marking-intelligence");

function safeId(value: string): string { return value.replace(/[^a-zA-Z0-9_.-]/g, "_"); }
function profilePath(productId: string): string { return path.join(DATA_DIR, `${safeId(productId)}.json`); }
function clamp01(value: number): number { return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)); }

function normalizeArea(area: ProductMarkingArea): ProductMarkingArea {
  const p = area.placement;
  return {
    ...area,
    id: area.id || randomUUID(),
    placement: {
      ...p,
      x: clamp01(p.x), y: clamp01(p.y), width: clamp01(p.width), height: clamp01(p.height),
      ...(typeof p.rotation === "number" ? { rotation: p.rotation } : {}),
    },
    techniques: area.techniques.map((technique) => ({ ...technique, id: technique.id || randomUUID() })),
  };
}

export async function getMarkingProfile(productId: string): Promise<ProductMarkingProfile | undefined> {
  try { return JSON.parse(await fs.readFile(profilePath(productId), "utf8")) as ProductMarkingProfile; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined; throw error; }
}

export async function saveMarkingProfile(input: Omit<ProductMarkingProfile, "updatedAt">): Promise<ProductMarkingProfile> {
  const profile: ProductMarkingProfile = {
    ...input,
    areas: input.areas.map(normalizeArea),
    updatedAt: new Date().toISOString(),
  };
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(profilePath(input.productId), JSON.stringify(profile, null, 2), "utf8");
  return profile;
}

const EVIDENCE_KEY = /(mark|print|printing|techni|personaliz|engr|laser|sublim|dtf|screen|pad|tampo|bord|transfer|area|size|max|width|height)/i;

export function collectProviderMarkingEvidence(value: unknown, max = 250): ProviderMarkingEvidence[] {
  const found: ProviderMarkingEvidence[] = [];
  const seen = new Set<object>();
  const visit = (node: unknown, currentPath: string): void => {
    if (found.length >= max || node == null) return;
    if (Array.isArray(node)) { node.forEach((item, index) => visit(item, `${currentPath}[${index}]`)); return; }
    if (typeof node !== "object") return;
    if (seen.has(node as object)) return;
    seen.add(node as object);
    for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
      const p = currentPath ? `${currentPath}.${key}` : key;
      if (EVIDENCE_KEY.test(key) && (typeof child !== "object" || child === null || Array.isArray(child))) {
        found.push({ path: p, key, value: child });
      }
      visit(child, p);
    }
  };
  visit(value, "");
  return found;
}

export function techniquesFromEvidence(evidence: readonly ProviderMarkingEvidence[]): ProductMarkingTechnique[] {
  const byCode = new Map<string, ProductMarkingTechnique>();
  for (const item of evidence) {
    const values = Array.isArray(item.value) ? item.value : [item.value];
    for (const value of values) {
      if (typeof value !== "string" || value.trim().length < 2) continue;
      const normalized = normalizeMarkingTechnique(value);
      if (normalized.code === "OTHER" && !/(laser|sublim|dtf|serigraf|tampograf|bordad|transfer|digital|uv)/i.test(value)) continue;
      if (!byCode.has(normalized.code)) byCode.set(normalized.code, {
        id: randomUUID(), code: normalized.code, name: normalized.name,
        providerCode: value, source: "PROVIDER", providerRaw: item,
      });
    }
  }
  return [...byCode.values()];
}
