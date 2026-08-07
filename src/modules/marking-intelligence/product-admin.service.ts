import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { getMarkingProfile } from "./marking-intelligence.service.js";
import { canonicalPool } from "../canonical-catalog/canonical-db.js";

type Obj = Record<string, unknown>;

interface CatalogProduct {
  readonly externalId?: string;
  readonly supplierReference?: string;
  readonly sku?: string;
  readonly name?: string;
  readonly description?: string;
  readonly primaryImage?: string;
  readonly imageUrl?: string;
  readonly thumbnailUrl?: string;
  readonly images?: readonly unknown[];
  readonly media?: readonly unknown[];
  readonly categories?: readonly unknown[];
  readonly materials?: readonly unknown[];
  readonly techniques?: readonly unknown[];
  readonly tags?: readonly unknown[];
  readonly canonicalInterests?: readonly unknown[];
  readonly productBrain?: Readonly<Record<string, unknown>>;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly status?: string;
  readonly valid?: boolean;
  readonly stock?: number;
  readonly price?: number;
  readonly prices?: readonly unknown[];
}

interface OverridesFile {
  readonly products: Readonly<Record<string, {
    readonly primaryImageUrl?: string;
    readonly updatedAt?: string;
  }>>;
}

export interface AdminProductFilters {
  readonly q?: string;
  readonly objectType?: string;
  readonly technique?: string;
  readonly material?: string;
  readonly category?: string;
  readonly interest?: string;
  readonly marking?: string;
  readonly brainStatus?: string;
  readonly personalization?: string;
  readonly imageStatus?: string;
  readonly sort?: string;
  readonly page?: number;
  readonly limit?: number;
}

const DATA_DIR = join(process.cwd(), "storage", "marking-intelligence");
const OVERRIDES_FILE = join(DATA_DIR, "product-admin-overrides.json");

function str(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const clean = value.trim();
  return clean || undefined;
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es")
    .trim();
}

function labelOf(value: unknown): string | undefined {
  if (typeof value === "string") return str(value);
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const item = value as Obj;
  return (
    str(item.label) ??
    str(item.name) ??
    str(item.normalized) ??
    str(item.id) ??
    str(item.value)
  );
}

function labels(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map(labelOf).filter((value): value is string => Boolean(value)))];
}

function nestedString(root: Readonly<Record<string, unknown>> | undefined, keys: readonly string[]) {
  if (!root) return undefined;
  for (const key of keys) {
    const value = str(root[key]);
    if (value) return value;
  }
  return undefined;
}

function nestedBool(root: Readonly<Record<string, unknown>> | undefined, keys: readonly string[]) {
  if (!root) return undefined;
  for (const key of keys) {
    if (typeof root[key] === "boolean") return root[key] as boolean;
  }
  return undefined;
}


type RealBrain = Readonly<Record<string, unknown>>;

function rec(value: unknown): Readonly<Record<string, unknown>> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Readonly<Record<string, unknown>>
    : {};
}
function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((x) => typeof x === "string" ? x : (x && typeof x === "object" ? String((x as any).id ?? "") : "")).filter(Boolean)
    : [];
}
function brainObjectType(brain: RealBrain | undefined): string | undefined {
  const value = brain?.objectType ?? brain?.object_type;
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
function brainStatus(brain: RealBrain | undefined): string {
  const value = brain?.status;
  return typeof value === "string" && value.trim() ? value.trim().toUpperCase() : "UNKNOWN";
}
function brainInterests(brain: RealBrain | undefined): string[] {
  return stringArray(brain?.interests);
}
function brainTechniques(brain: RealBrain | undefined): string[] {
  return stringArray(brain?.personalizationMethods ?? brain?.personalization_methods);
}
function brainRoles(brain: RealBrain | undefined): string[] {
  return stringArray(brain?.giftRoles ?? brain?.gift_roles);
}
function personalizationOf(brain: RealBrain | undefined, product: CatalogProduct): string {
  const score = brain?.personalizationScore ?? brain?.personalization_score;
  if (typeof score === "number" && score >= .65) return "PERSONALIZABLE";
  const customizable = (product as Obj).customizable;
  if (customizable === true) return "PERSONALIZABLE";
  return "UNKNOWN";
}
function categoriesOf(product: CatalogProduct): string[] { return labels(product.categories); }
function tagsOf(product: CatalogProduct): string[] { return labels(product.tags); }

async function loadRealBrains(): Promise<ReadonlyMap<string, RealBrain>> {
  const pool = canonicalPool();

  const result = await pool.query(`
    SELECT
      p.id::text AS canonical_id,
      p.provider_key,
      p.external_id,
      p.sku,
      b.brain
    FROM canonical_products p
    INNER JOIN canonical_product_brains b
      ON b.product_id = p.id
  `);

  const index = new Map<string, RealBrain>();

  for (const row of result.rows) {
    const brain = rec(row.brain);

    const provider =
      typeof row.provider_key === "string"
        ? row.provider_key.trim()
        : "";

    const canonicalId =
      typeof row.canonical_id === "string"
        ? row.canonical_id.trim()
        : "";

    const externalId =
      typeof row.external_id === "string"
        ? row.external_id.trim()
        : "";

    const sku =
      typeof row.sku === "string"
        ? row.sku.trim()
        : "";

    const aliases = [
      canonicalId,
      externalId,
      sku,
      provider && externalId
        ? `${provider}:${externalId}`
        : "",
      provider && externalId
        ? `${provider}:external:${externalId}`
        : "",
      provider && sku
        ? `${provider}:sku:${sku}`
        : "",
    ].filter(Boolean);

    for (const alias of aliases) {
      if (!index.has(alias)) {
        index.set(alias, brain);
      }
    }
  }

  return index;
}

async function loadCanonicalAdminFields(): Promise<
  ReadonlyMap<
    string,
    {
      material?: string;
      customizable?: boolean;
    }
  >
> {
  const pool = canonicalPool();

  const result = await pool.query(`
    SELECT
      id::text AS canonical_id,
      provider_key,
      external_id,
      sku,
      material,
      customizable
    FROM canonical_products
  `);

  const index = new Map<
    string,
    {
      material?: string;
      customizable?: boolean;
    }
  >();

  for (const row of result.rows) {
    const provider =
      typeof row.provider_key === "string"
        ? row.provider_key.trim()
        : "";

    const canonicalId =
      typeof row.canonical_id === "string"
        ? row.canonical_id.trim()
        : "";

    const externalId =
      typeof row.external_id === "string"
        ? row.external_id.trim()
        : "";

    const sku =
      typeof row.sku === "string"
        ? row.sku.trim()
        : "";

    const fields = {
      ...(typeof row.material === "string" && row.material.trim()
        ? { material: row.material.trim() }
        : {}),
      ...(typeof row.customizable === "boolean"
        ? { customizable: row.customizable }
        : {}),
    };

    const aliases = [
      canonicalId,
      externalId,
      sku,
      provider && externalId
        ? `${provider}:${externalId}`
        : "",
      provider && externalId
        ? `${provider}:external:${externalId}`
        : "",
      provider && sku
        ? `${provider}:sku:${sku}`
        : "",
    ].filter(Boolean);

    for (const alias of aliases) {
      if (!index.has(alias)) {
        index.set(alias, fields);
      }
    }
  }

  return index;
}

function brainForProduct(
  product: CatalogProduct,
  brains: ReadonlyMap<string, RealBrain>,
): RealBrain | undefined {
  const externalId =
    str(product.externalId) ??
    str(product.supplierReference);

  const sku = str(product.sku);

  const aliases = [
    str((product as Obj).id),
    externalId,
    sku,
    externalId ? `makito:${externalId}` : undefined,
    externalId ? `makito:external:${externalId}` : undefined,
    sku ? `makito:sku:${sku}` : undefined,
  ].filter((value): value is string => Boolean(value));

  for (const alias of aliases) {
    const match = brains.get(alias);

    if (match) {
      return match;
    }
  }

  return undefined;
}

async function walk(directory: string): Promise<string[]> {
  try {
    const entries = await readdir(directory);
    const files: string[] = [];
    for (const entry of entries) {
      const full = join(directory, entry);
      const info = await stat(full);
      if (info.isDirectory()) files.push(...await walk(full));
      else files.push(full);
    }
    return files;
  } catch {
    return [];
  }
}

async function loadLatestCatalog(): Promise<{
  readonly file?: string;
  readonly products: readonly CatalogProduct[];
}> {
  const base = join(process.cwd(), "storage", "providers", "makito", "snapshots");
  const candidates = (await walk(base))
    .filter((file) => file.endsWith("normalized-products.json"));

  if (!candidates.length) return { products: Object.freeze([]) };

  const dated = await Promise.all(
    candidates.map(async (file) => ({ file, mtime: (await stat(file)).mtimeMs })),
  );
  dated.sort((a, b) => b.mtime - a.mtime);

  const selected = dated[0]?.file;
  if (!selected) return { products: Object.freeze([]) };

  const parsed = JSON.parse(await readFile(selected, "utf8")) as unknown;
  const products = Array.isArray(parsed)
    ? parsed.filter(
        (item): item is CatalogProduct =>
          Boolean(item) && typeof item === "object" && !Array.isArray(item),
      )
    : [];

  return { file: selected, products: Object.freeze(products) };
}

async function readOverrides(): Promise<OverridesFile> {
  try {
    const parsed = JSON.parse(await readFile(OVERRIDES_FILE, "utf8")) as OverridesFile;
    return parsed && typeof parsed === "object" && parsed.products
      ? parsed
      : { products: {} };
  } catch {
    return { products: {} };
  }
}

function collectImageUrls(value: unknown, depth = 0, found = new Set<string>()): string[] {
  if (depth > 5 || value == null) return [...found];

  if (typeof value === "string") {
    const text = value.trim();
    if (
      /^https?:\/\//i.test(text) ||
      text.startsWith("/media/") ||
      text.startsWith("/uploads/") ||
      text.startsWith("/catalog-media/")
    ) {
      if (
        /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(text) ||
        /image|media|photo|thumb/i.test(text)
      ) {
        found.add(text);
      }
    }
    return [...found];
  }

  if (Array.isArray(value)) {
    for (const item of value) collectImageUrls(item, depth + 1, found);
    return [...found];
  }

  if (typeof value === "object") {
    for (const [key, item] of Object.entries(value as Obj)) {
      if (/image|photo|thumb|media|url/i.test(key) || depth < 2) {
        collectImageUrls(item, depth + 1, found);
      }
    }
  }

  return [...found];
}

function productKey(product: CatalogProduct): string | undefined {
  const externalId = str(product.externalId) ?? str(product.supplierReference);
  return externalId ? `makito:${externalId}` : undefined;
}

function preferredImages(product: CatalogProduct): readonly string[] {
  const ordered = [
    str(product.primaryImage),
    str(product.imageUrl),
    str(product.thumbnailUrl),
    ...collectImageUrls(product),
  ].filter((value): value is string => Boolean(value));

  return Object.freeze([...new Set(ordered)].slice(0, 30));
}


function productBase(
  product: CatalogProduct,
  brain?: RealBrain,
  canonical?: { material?: string; customizable?: boolean },
) {
  const materialValues = [
    ...(canonical?.material ? [canonical.material] : []),
    ...labels(product.materials),
  ];
  const techniques = [...new Set([...labels(product.techniques), ...brainTechniques(brain)])];
  return {
    productId: productKey(product),
    externalId: str(product.externalId) ?? str(product.supplierReference),
    sku: str(product.sku),
    name: str(product.name) ?? "(Sin nombre)",
    description: str(product.description),
    images: Object.freeze(preferredImages(product)),
    objectType: brainObjectType(brain),
    categories: Object.freeze(categoriesOf(product)),
    materials: Object.freeze([...new Set(materialValues)]),
    catalogTechniques: Object.freeze(techniques),
    interests: Object.freeze(brainInterests(brain)),
    roles: Object.freeze(brainRoles(brain)),
    tags: Object.freeze(tagsOf(product)),
    brainStatus: brainStatus(brain),
    personalization: personalizationOf(brain, { ...product, ...(canonical ?? {}) } as CatalogProduct),
    productBrainSource: brain ? "CANONICAL_PRODUCT_BRAINS" : "NONE",
  };
}

function matchChoice(actual: string | undefined, wanted: string | undefined): boolean {
  if (!wanted) return true;
  if (!actual) return false;
  return normalize(actual) === normalize(wanted);
}

function matchArray(actual: readonly string[], wanted: string | undefined): boolean {
  if (!wanted) return true;
  const target = normalize(wanted);
  return actual.some((value) => normalize(value) === target);
}

function placementIsCalibrated(area: {
  readonly placement: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly corners?: unknown;
  };
}) {
  const p = area.placement;
  return !(
    p.x === 0 &&
    p.y === 0 &&
    p.width === 1 &&
    p.height === 1 &&
    !p.corners
  );
}

async function markingFacts(productId: string | undefined) {
  if (!productId) {
    return {
      areas: 0,
      calibrated: 0,
      pending: 0,
      techniques: [] as string[],
      officialTechniques: [] as string[],
    };
  }

  const profile = await getMarkingProfile(productId);
  const areas = profile?.areas ?? [];
  const calibrated = areas.filter(placementIsCalibrated).length;
  const techniqueNames = new Set<string>();
  const officialTechniques = new Set<string>();

  for (const area of areas) {
    for (const technique of area.techniques) {
      techniqueNames.add(technique.name);
      if (technique.providerOfficial) officialTechniques.add(technique.name);
    }
  }

  return {
    areas: areas.length,
    calibrated,
    pending: Math.max(0, areas.length - calibrated),
    techniques: [...techniqueNames],
    officialTechniques: [...officialTechniques],
  };
}

function markingStatusMatches(
  status: string | undefined,
  marking: Awaited<ReturnType<typeof markingFacts>>,
) {
  if (!status) return true;
  switch (status) {
    case "WITH_AREAS":
      return marking.areas > 0;
    case "WITHOUT_AREAS":
      return marking.areas === 0;
    case "PENDING_POSITION":
      return marking.pending > 0;
    case "FULLY_POSITIONED":
      return marking.areas > 0 && marking.pending === 0;
    case "ONE_AREA":
      return marking.areas === 1;
    case "TWO_AREAS":
      return marking.areas === 2;
    case "THREE_PLUS":
      return marking.areas >= 3;
    default:
      return true;
  }
}

function sortRows<T extends {
  name: string;
  sku?: string;
  marking: { areas: number; pending: number };
}>(rows: T[], sort: string | undefined) {
  const result = [...rows];

  switch (sort) {
    case "name_desc":
      result.sort((a, b) => b.name.localeCompare(a.name, "es"));
      break;
    case "sku_asc":
      result.sort((a, b) => String(a.sku ?? "").localeCompare(String(b.sku ?? ""), "es", { numeric: true }));
      break;
    case "areas_desc":
      result.sort((a, b) => b.marking.areas - a.marking.areas || a.name.localeCompare(b.name, "es"));
      break;
    case "pending_desc":
      result.sort((a, b) => b.marking.pending - a.marking.pending || a.name.localeCompare(b.name, "es"));
      break;
    default:
      result.sort((a, b) => a.name.localeCompare(b.name, "es"));
      break;
  }

  return result;
}

async function loadAdminDatabaseStats(): Promise<{
  storedBrains: number;
  canonicalProducts: number;
  joinedProducts: number;
}> {
  const pool = canonicalPool();

  const result = await pool.query(`
    SELECT
      (SELECT count(*)::int
       FROM canonical_product_brains) AS stored_brains,

      (SELECT count(*)::int
       FROM canonical_products) AS canonical_products,

      (
        SELECT count(*)::int
        FROM canonical_products p
        INNER JOIN canonical_product_brains b
          ON b.product_id = p.id
      ) AS joined_products
  `);

  const row = result.rows[0] ?? {};

  return {
    storedBrains: Number(row.stored_brains ?? 0),
    canonicalProducts: Number(row.canonical_products ?? 0),
    joinedProducts: Number(row.joined_products ?? 0),
  };
}

export async function getAdminProductFilterOptions() {
  const catalog = await loadLatestCatalog();
  const brains = await loadRealBrains();
  const canonicalFields = await loadCanonicalAdminFields();
  const objectTypes = new Set<string>();
  const materials = new Set<string>();
  const categories = new Set<string>();
  const interests = new Set<string>();
  const catalogTechniques = new Set<string>();
  const brainStatuses = new Set<string>();
  const personalizations = new Set<string>();

  for (const product of catalog.products) {
    const brain = brainForProduct(product, brains);
    const externalId =
      str(product.externalId) ??
      str(product.supplierReference);

    const sku = str(product.sku);

    const canonical =
      canonicalFields.get(str((product as Obj).id) ?? "") ??
      canonicalFields.get(externalId ?? "") ??
      canonicalFields.get(sku ?? "") ??
      canonicalFields.get(
        externalId
          ? `makito:${externalId}`
          : ""
      ) ??
      canonicalFields.get(
        externalId
          ? `makito:external:${externalId}`
          : ""
      ) ??
      canonicalFields.get(
        sku
          ? `makito:sku:${sku}`
          : ""
      );

    const base = productBase(product, brain, canonical);

    if (base.objectType) objectTypes.add(base.objectType);
    for (const value of base.materials) materials.add(value);
    for (const value of base.categories) categories.add(value);
    for (const value of base.interests) interests.add(value);
    for (const value of base.catalogTechniques) catalogTechniques.add(value);
    brainStatuses.add(base.brainStatus);
    personalizations.add(base.personalization);
  }

  // Official marking techniques are sourced from the persisted Makito catalog when available.
  let officialTechniques: string[] = [];
  try {
    const raw = JSON.parse(
      await readFile(join(DATA_DIR, "makito-official-techniques.json"), "utf8"),
    ) as { techniques?: Array<{ displayName?: string; providerCategory?: string }> };
    officialTechniques = [
      ...new Set(
        (raw.techniques ?? [])
          .map((item) => str(item.displayName) ?? str(item.providerCategory))
          .filter((value): value is string => Boolean(value)),
      ),
    ];
  } catch {
    officialTechniques = [];
  }

  const alphabetical = (values: Iterable<string>) =>
    [...values].sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));

  return Object.freeze({
    status: "ok",
    productBrain: Object.freeze(await loadAdminDatabaseStats()),
    objectTypes: Object.freeze(alphabetical(objectTypes)),
    techniques: Object.freeze(
      alphabetical(new Set([...catalogTechniques, ...officialTechniques])),
    ),
    materials: Object.freeze(alphabetical(materials)),
    categories: Object.freeze(alphabetical(categories)),
    interests: Object.freeze(alphabetical(interests)),
    brainStatuses: Object.freeze(alphabetical(brainStatuses)),
    personalizations: Object.freeze(alphabetical(personalizations)),
    markingStatuses: Object.freeze([
      "WITH_AREAS",
      "WITHOUT_AREAS",
      "PENDING_POSITION",
      "FULLY_POSITIONED",
      "ONE_AREA",
      "TWO_AREAS",
      "THREE_PLUS",
    ]),
  });
}

export async function listAdminProducts(input: AdminProductFilters) {
  const catalog = await loadLatestCatalog();
  const overrides = await readOverrides();
  const brains = await loadRealBrains();
  const canonicalFields = await loadCanonicalAdminFields();

  const q = (input.q ?? "").trim().toLocaleLowerCase("es");
  const page = Math.max(1, Math.floor(input.page ?? 1));
  const limit = Math.max(1, Math.min(100, Math.floor(input.limit ?? 30)));

  const prefiltered = catalog.products.filter((product) => {
    const brain = brainForProduct(product, brains);
    const canonical = canonicalFields.get(str((product as Obj).id) ?? "") ??
      canonicalFields.get(str(product.externalId) ?? "") ??
      canonicalFields.get(str(product.supplierReference) ?? "");
    const base = productBase(product, brain, canonical);

    if (q) {
      const haystack = [
        base.name,
        base.sku,
        base.externalId,
        base.objectType,
        ...base.categories,
        ...base.materials,
        ...base.catalogTechniques,
        ...base.interests,
        ...base.tags,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("es");

      if (!haystack.includes(q)) return false;
    }

    if (!matchChoice(base.objectType, input.objectType)) return false;
    if (!matchArray(base.materials, input.material)) return false;
    if (!matchArray(base.categories, input.category)) return false;
    if (!matchArray(base.interests, input.interest)) return false;
    if (!matchChoice(base.brainStatus, input.brainStatus)) return false;
    if (!matchChoice(base.personalization, input.personalization)) return false;

    if (input.imageStatus === "WITH_PRIMARY") {
      const override = base.productId ? overrides.products[base.productId] : undefined;
      if (!(override?.primaryImageUrl || base.images[0])) return false;
    }
    if (input.imageStatus === "WITHOUT_PRIMARY") {
      const override = base.productId ? overrides.products[base.productId] : undefined;
      if (override?.primaryImageUrl || base.images[0]) return false;
    }

    return true;
  });

  const needMarkingFilter = Boolean(input.marking || input.technique);
  const enriched = [];

  for (const product of prefiltered) {
    const brain = brainForProduct(product, brains);
    const canonical = canonicalFields.get(str((product as Obj).id) ?? "") ??
      canonicalFields.get(str(product.externalId) ?? "") ??
      canonicalFields.get(str(product.supplierReference) ?? "");
    const base = productBase(product, brain, canonical);
    const marking = await markingFacts(base.productId);

    if (!markingStatusMatches(input.marking, marking)) continue;

    if (input.technique) {
      const target = normalize(input.technique);
      const allTechniques = [
        ...base.catalogTechniques,
        ...marking.techniques,
      ];
      if (!allTechniques.some((value) => normalize(value) === target)) continue;
    }

    const override = base.productId ? overrides.products[base.productId] : undefined;

    enriched.push(Object.freeze({
      ...base,
      primaryImageUrl: override?.primaryImageUrl ?? base.images[0],
      marking: Object.freeze({
        areas: marking.areas,
        calibrated: marking.calibrated,
        pending: marking.pending,
        techniques: Object.freeze(marking.techniques),
      }),
    }));
  }

  const sorted = sortRows(enriched, input.sort);
  const start = (page - 1) * limit;
  const items = sorted.slice(start, start + limit);

  return Object.freeze({
    status: "ok",
    catalogSnapshot: catalog.file,
    total: sorted.length,
    page,
    limit,
    pages: Math.max(1, Math.ceil(sorted.length / limit)),
    filtersApplied: Object.freeze({
      q: input.q,
      objectType: input.objectType,
      technique: input.technique,
      material: input.material,
      category: input.category,
      interest: input.interest,
      marking: input.marking,
      brainStatus: input.brainStatus,
      personalization: input.personalization,
      imageStatus: input.imageStatus,
      sort: input.sort,
    }),
    items: Object.freeze(items),
  });
}

export async function getAdminProduct(productId: string) {
  const catalog = await loadLatestCatalog();
  const brains = await loadRealBrains();
  const canonicalFields = await loadCanonicalAdminFields();
  const overrides = await readOverrides();

  const product = catalog.products.find((item) => productKey(item) === productId);
  if (!product) return undefined;

  const brain = brainForProduct(product, brains);
    const canonical = canonicalFields.get(str((product as Obj).id) ?? "") ??
      canonicalFields.get(str(product.externalId) ?? "") ??
      canonicalFields.get(str(product.supplierReference) ?? "");
    const base = productBase(product, brain, canonical);
  const profile = await getMarkingProfile(productId);
  const override = overrides.products[productId];

  return Object.freeze({
    status: "ok",
    product: Object.freeze({
      ...base,
      primaryImageUrl: override?.primaryImageUrl ?? base.images[0],
      images: base.images,
    }),
    marking: profile
      ? Object.freeze({
          providerKey: profile.providerKey,
          providerProductId: profile.providerProductId,
          commercialImageUrl: profile.commercialImageUrl,
          mockupBaseImageUrl: profile.mockupBaseImageUrl,
          areas: Object.freeze(
            profile.areas.map((area) => Object.freeze({
              areaId: area.id,
              name: area.name,
              providerAreaId: area.providerAreaId,
              providerPositionId: area.providerPositionId,
              markingPreviewImageUrl: area.markingPreviewImageUrl,
              baseImageUrl: area.baseImageUrl,
              maxWidthMm: area.maxWidthMm,
              maxHeightMm: area.maxHeightMm,
              geometryStatus: placementIsCalibrated(area) ? "CALIBRATED" : "PLACEHOLDER",
              placement: area.placement,
              techniques: area.techniques.map((technique) => ({
                code: technique.code,
                name: technique.name,
                providerCode: technique.providerCode,
                providerVariantCode: technique.providerVariantCode,
                providerOfficial: technique.providerOfficial,
              })),
            })),
          ),
        })
      : undefined,
  });
}

export async function setAdminProductPrimaryImage(
  productId: string,
  primaryImageUrl: string,
) {
  const detail = await getAdminProduct(productId);
  if (!detail) throw new Error("Producto no encontrado.");

  if (!detail.product.images.includes(primaryImageUrl)) {
    throw new Error("La imagen seleccionada no pertenece a las imágenes conocidas del producto.");
  }

  const current = await readOverrides();
  const next: OverridesFile = {
    products: {
      ...current.products,
      [productId]: {
        ...(current.products[productId] ?? {}),
        primaryImageUrl,
        updatedAt: new Date().toISOString(),
      },
    },
  };

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(OVERRIDES_FILE, JSON.stringify(next, null, 2), "utf8");

  return getAdminProduct(productId);
}
