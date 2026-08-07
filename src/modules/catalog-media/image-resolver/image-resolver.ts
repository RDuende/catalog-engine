import type {
  CatalogImageCandidate,
  ImageResolutionResult,
  ResolvedImage,
  ResolvedImageKind,
} from "./image-resolver.types.js";

function basename(value: string): string {
  const clean = value.split(/[?#]/u)[0] ?? value;
  return clean.split(/[\\/]/u).at(-1)?.toLowerCase() ?? clean.toLowerCase();
}

function normalizedStem(value: string): string {
  return basename(value)
    .replace(/\.(?:avif|gif|jpe?g|png|svg|webp)$/iu, "")
    .replace(/(?:^|[-_.])(?:thumb(?:nail)?|small|preview|icon|mini|low|tiny)(?:[-_.]|$)/giu, "-")
    .replace(/(?:^|[-_.])\d{2,4}x\d{2,4}(?:[-_.]|$)/giu, "-")
    .replace(/[-_.]+/gu, "-")
    .replace(/^-|-$/gu, "");
}

function classify(candidate: CatalogImageCandidate): ResolvedImageKind {
  const metadata = candidate.metadata ?? {};
  const text = [
    candidate.url,
    candidate.providerUrl ?? "",
    candidate.localFilename ?? "",
    String(metadata.kind ?? ""),
    String(metadata.type ?? ""),
    String(metadata.role ?? ""),
  ].join(" ").toLowerCase();

  if (/thumbnail|thumb|mini|tiny|small|low[-_ ]?res|150x150|200x200|300x300/iu.test(text)) return "THUMBNAIL";
  if (/preview|sample|watermark/iu.test(text)) return "PREVIEW";
  if (/icon|favicon|sprite/iu.test(text)) return "ICON";
  if (/packaging|package|box|caja|embalaje/iu.test(text)) return "PACKAGING";
  if (/detail|detalle|zoom|close[-_ ]?up/iu.test(text)) return "DETAIL";
  if (/variant|color|colour|rojo|verde|azul|amarillo|negro|blanco|plateado/iu.test(text)) return "COLOR_VARIANT";
  if (metadata.isPrimary === true || metadata.primary === true || /principal|primary|main|hero|\b-w\./iu.test(text)) return "PRIMARY";
  return "GALLERY";
}

function score(kind: ResolvedImageKind, candidate: CatalogImageCandidate): number {
  const base: Readonly<Record<ResolvedImageKind, number>> = Object.freeze({
    PRIMARY: 100,
    GALLERY: 90,
    DETAIL: 80,
    COLOR_VARIANT: 70,
    PACKAGING: 60,
    UNKNOWN: 20,
    THUMBNAIL: -100,
    PREVIEW: -100,
    ICON: -100,
    DUPLICATE: -1000,
  });

  const area = Math.max(1, (candidate.width ?? 0) * (candidate.height ?? 0));
  const areaBonus = Math.min(20, Math.log10(area) * 2);
  return base[kind] + areaBonus + (candidate.localPublicUrl ? 8 : 0);
}

function keyOf(candidate: CatalogImageCandidate): string {
  return candidate.sha256 ?? normalizedStem(candidate.providerUrl ?? candidate.url);
}

export function resolveCatalogImages(
  candidates: readonly CatalogImageCandidate[],
): ImageResolutionResult {
  const prelim = candidates.map((candidate, index): ResolvedImage => {
    const kind = classify(candidate);
    return Object.freeze({
      key: keyOf(candidate),
      sourceUrl: candidate.providerUrl ?? candidate.url,
      publicUrl: candidate.localPublicUrl ?? candidate.url,
      kind,
      score: score(kind, candidate),
      ...(candidate.width !== undefined ? { width: candidate.width } : {}),
      ...(candidate.height !== undefined ? { height: candidate.height } : {}),
      position: candidate.position ?? index,
      selected: false,
      reason:
        kind === "THUMBNAIL" ? "Miniatura descartada." :
        kind === "PREVIEW" ? "Vista previa descartada." :
        kind === "ICON" ? "Icono descartado." :
        "Candidata válida.",
    });
  });

  const bestByKey = new Map<string, ResolvedImage>();

  for (const image of prelim) {
    if (["THUMBNAIL", "PREVIEW", "ICON"].includes(image.kind)) continue;
    const current = bestByKey.get(image.key);
    if (!current || image.score > current.score || (image.score === current.score && image.position < current.position)) {
      bestByKey.set(image.key, image);
    }
  }

  const all = prelim.map((image) => {
    const best = bestByKey.get(image.key);
    const selected = best?.publicUrl === image.publicUrl;
    const filtered = ["THUMBNAIL", "PREVIEW", "ICON"].includes(image.kind);
    const duplicate = !filtered && best !== undefined && best.publicUrl !== image.publicUrl;

    return Object.freeze({
      ...image,
      kind: duplicate ? "DUPLICATE" as const : image.kind,
      selected,
      reason:
        selected ? "Imagen seleccionada." :
        duplicate ? "Duplicada; se conserva la mejor versión." :
        image.reason,
    });
  });

  const selected = all
    .filter((image) => image.selected)
    .sort((left, right) => right.score - left.score || left.position - right.position);

  return Object.freeze({
    selected: Object.freeze(selected),
    all: Object.freeze(all),
    diagnostics: Object.freeze({
      totalCandidates: all.length,
      selectedCount: selected.length,
      discardedCount: all.length - selected.length,
      duplicateCount: all.filter((image) => image.kind === "DUPLICATE").length,
      thumbnailCount: all.filter((image) => image.kind === "THUMBNAIL").length,
      previewCount: all.filter((image) => image.kind === "PREVIEW").length,
      iconCount: all.filter((image) => image.kind === "ICON").length,
    }),
  });
}
