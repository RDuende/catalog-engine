import type { Pool } from "pg";
import { canonicalPool } from "../canonical-catalog/canonical-db.js";
import { classifyProductBrain } from "../product-brain/product-brain.classifier.js";
import { ProductBrainRepository } from "../product-brain/product-brain.repository.js";
import type { ProductBrain, ProductBrainSource, ProductGiftRole, ScoredTaxonomyValue } from "../product-brain/product-brain.types.js";
import { ProductBrainStudioRepository } from "./product-brain-studio.repository.js";
import type { ProductBrainCorrection, ProductBrainStudioPreview } from "./product-brain-studio.types.js";

const VALID_ROLES = new Set<ProductGiftRole>(["PRIMARY", "COMPLEMENT", "BUNDLE_COMPONENT", "PROMOTIONAL"]);
const OBJECT_TYPES = ["thermal_cup","travel_mug","mug","sports_bottle","bottle","headphones","speaker","power_bank","notebook","pen","keyring","backpack","tshirt","tote_bag","towel","canvas","trophy","clapper","anti_stress","generic_object"];
const INTERESTS = ["coffee","office","travel","music","football","sports","gaming","technology","nautical","sustainability","cooking","children","education","outdoors"];
const PERSONALIZATION_METHODS = ["laser_engraving","uv_print","screen_printing","transfer","sublimation","dtf","embroidery","digital_print","pad_printing"];

function arr(value: unknown): string[] { return Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : []; }
function rec(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function sourceFromRow(row: Record<string, unknown>): ProductBrainSource {
  return { id:String(row.id), providerKey:String(row.provider_key ?? "unknown"), name:String(row.name ?? "Producto sin nombre"),
    ...(typeof row.description === "string" ? { description: row.description } : {}),
    ...(typeof row.short_description === "string" ? { shortDescription: row.short_description } : {}),
    categories:Object.freeze(arr(row.categories)), tags:Object.freeze(arr(row.tags)),
    ...(typeof row.material === "string" ? { material: row.material } : {}), customizable:row.customizable === true,
    attributes:rec(row.attributes), metadata:rec(row.metadata) };
}
function clamp(value: unknown, fallback: number): number {
  const number = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.max(0, Math.min(1, number));
}
function scored(values: readonly ScoredTaxonomyValue[] | undefined): readonly ScoredTaxonomyValue[] | undefined {
  if (!values) return undefined;
  return Object.freeze(values.filter((item) => item && typeof item.id === "string").map((item) => Object.freeze({
    id: item.id.trim(), score: clamp(item.score, .95), evidence: Object.freeze(item.evidence?.length ? [...item.evidence] : ["Corrección administrativa"]),
  })).filter((item) => item.id));
}
function sanitize(correction: ProductBrainCorrection): ProductBrainCorrection {
  const roles = correction.giftRoles?.filter((role): role is ProductGiftRole => VALID_ROLES.has(role));
  return Object.freeze({
    ...(correction.objectType?.trim() ? { objectType: correction.objectType.trim() } : {}),
    ...(roles ? { giftRoles: Object.freeze([...new Set(roles)]) } : {}),
    ...(correction.interests ? { interests: scored(correction.interests) ?? Object.freeze([]) } : {}),
    ...(correction.shapes ? { shapes: scored(correction.shapes) ?? Object.freeze([]) } : {}),
    ...(correction.personalizationMethods ? { personalizationMethods: Object.freeze([...new Set(correction.personalizationMethods.filter(Boolean))]) } : {}),
    ...(typeof correction.personalizationScore === "number" ? { personalizationScore: clamp(correction.personalizationScore, 0) } : {}),
    ...(typeof correction.bundleScore === "number" ? { bundleScore: clamp(correction.bundleScore, 0) } : {}),
    ...(typeof correction.premiumScore === "number" ? { premiumScore: clamp(correction.premiumScore, 0) } : {}),
    ...(typeof correction.giftSuitabilityScore === "number" ? { giftSuitabilityScore: clamp(correction.giftSuitabilityScore, 0) } : {}),
    ...(correction.notes?.trim() ? { notes: correction.notes.trim() } : {}),
  });
}
function applyCorrection(base: ProductBrain, input: ProductBrainCorrection): ProductBrain {
  const correction = sanitize(input);
  const objectType = correction.objectType ?? base.objectType;
  const confidence = objectType !== "generic_object" ? Math.max(base.classificationConfidence, .9) : base.classificationConfidence;
  const status = confidence >= .7 && objectType !== "generic_object" ? "READY" : "REVIEW_REQUIRED";
  const searchTerms = [...new Set([objectType, ...(correction.interests ?? base.interests).map((item) => item.id), ...base.searchTerms])];
  return Object.freeze({ ...base, ...correction, objectType,
    giftRoles: correction.giftRoles ?? base.giftRoles,
    interests: correction.interests ?? base.interests,
    shapes: correction.shapes ?? base.shapes,
    personalizationMethods: correction.personalizationMethods ?? base.personalizationMethods,
    status, classificationConfidence: confidence, searchTerms:Object.freeze(searchTerms),
    version: `${base.version}+admin-v1`, generatedAt:new Date().toISOString(),
  });
}
function reviewReasons(brain: ProductBrain): string[] {
  const reasons: string[] = [];
  if (brain.objectType === "generic_object") reasons.push("No se ha identificado un objeto físico específico.");
  if (brain.classificationConfidence < .7) reasons.push(`La confianza global es inferior al 70 % (${Math.round(brain.classificationConfidence * 100)} %).`);
  if (!brain.giftRoles.length) reasons.push("No hay roles de regalo definidos.");
  if (!brain.personalizationMethods.length && brain.personalizationScore < .65) reasons.push("Faltan métodos de personalización fiables.");
  if (!brain.interests.length) reasons.push("No se han detectado intereses o contextos de uso.");
  return reasons.length ? reasons : ["La clasificación cumple los criterios automáticos."];
}
function changes(before: ProductBrain, after: ProductBrain): string[] {
  const result: string[] = [];
  if (before.objectType !== after.objectType) result.push(`Objeto: ${before.objectType} → ${after.objectType}`);
  if (JSON.stringify(before.giftRoles) !== JSON.stringify(after.giftRoles)) result.push("Roles actualizados.");
  if (JSON.stringify(before.interests) !== JSON.stringify(after.interests)) result.push("Intereses actualizados.");
  if (JSON.stringify(before.personalizationMethods) !== JSON.stringify(after.personalizationMethods)) result.push("Métodos de personalización actualizados.");
  for (const key of ["personalizationScore","bundleScore","premiumScore","giftSuitabilityScore"] as const) if (before[key] !== after[key]) result.push(`${key}: ${Math.round(before[key]*100)} % → ${Math.round(after[key]*100)} %`);
  return result;
}

export class ProductBrainStudioService {
  private readonly brainRepository: ProductBrainRepository;
  private readonly repository: ProductBrainStudioRepository;
  constructor(private readonly pool: Pool = canonicalPool()) { this.brainRepository = new ProductBrainRepository(pool); this.repository = new ProductBrainStudioRepository(pool); }
  private async row(productId: string): Promise<Record<string, unknown> | undefined> { const result = await this.pool.query(`SELECT * FROM canonical_products WHERE id=$1`, [productId]); return result.rows[0] as Record<string, unknown> | undefined; }
  private async base(productId: string): Promise<ProductBrain | undefined> { const row = await this.row(productId); if (!row) return undefined; return classifyProductBrain(sourceFromRow(row)); }
  async current(productId: string): Promise<ProductBrain | undefined> {
    await this.brainRepository.ensureSchema();
    const result = await this.pool.query(`SELECT brain FROM canonical_product_brains WHERE product_id=$1`, [productId]);
    const stored = result.rows[0]?.brain as ProductBrain | undefined;
    const base = stored ?? await this.base(productId); if (!base) return undefined;
    const correction = await this.repository.getOverride(productId); return correction ? applyCorrection(base, correction) : base;
  }
  async studio(productId: string) {
    const brain = await this.current(productId); if (!brain) return undefined;
    return { brain, reviewReasons:reviewReasons(brain), override:await this.repository.getOverride(productId), history:await this.repository.history(productId),
      options:{ objectTypes:OBJECT_TYPES, roles:[...VALID_ROLES], interests:INTERESTS, personalizationMethods:PERSONALIZATION_METHODS } };
  }
  async preview(productId: string, correction: ProductBrainCorrection): Promise<ProductBrainStudioPreview | undefined> {
    const before = await this.current(productId); if (!before) return undefined;
    const after = applyCorrection(before, correction);
    return Object.freeze({ before, after, changes:Object.freeze(changes(before, after)), reviewReasons:Object.freeze(reviewReasons(after)) });
  }
  async teach(productId: string, correction: ProductBrainCorrection, actor = "admin") {
    const before = await this.current(productId); const row = await this.row(productId); if (!before || !row) return undefined;
    const clean = sanitize(correction); const after = applyCorrection(before, clean);
    await this.repository.saveOverride(productId, clean, actor);
    await this.brainRepository.save(after, typeof row.content_hash === "string" ? row.content_hash : undefined);
    const history = await this.repository.addHistory({ productId, action:"TEACH", before, after, correction:clean, actor });
    return { brain:after, history, reviewReasons:reviewReasons(after) };
  }
  async reclassify(productId: string) {
    const row = await this.row(productId); if (!row) return undefined;
    const raw = classifyProductBrain(sourceFromRow(row)); const correction = await this.repository.getOverride(productId); const brain = correction ? applyCorrection(raw, correction) : raw;
    await this.brainRepository.save(brain, typeof row.content_hash === "string" ? row.content_hash : undefined); return brain;
  }
  async revert(productId: string, historyId: string, actor = "admin") {
    const current = await this.current(productId); const entry = await this.repository.historyEntry(historyId); const row = await this.row(productId);
    if (!current || !entry || !row || entry.productId !== productId) return undefined;
    const after = Object.freeze({ ...entry.before, generatedAt:new Date().toISOString(), version:`${entry.before.version}+revert-v1` });
    const correction: ProductBrainCorrection = { objectType:after.objectType, giftRoles:after.giftRoles, interests:after.interests, shapes:after.shapes,
      personalizationMethods:after.personalizationMethods, personalizationScore:after.personalizationScore, bundleScore:after.bundleScore,
      premiumScore:after.premiumScore, giftSuitabilityScore:after.giftSuitabilityScore, notes:`Reversión de ${historyId}` };
    await this.repository.saveOverride(productId, correction, actor); await this.brainRepository.save(after, typeof row.content_hash === "string" ? row.content_hash : undefined);
    const history = await this.repository.addHistory({ productId, action:"REVERT", before:current, after, correction, actor });
    return { brain:after, history, reviewReasons:reviewReasons(after) };
  }
}
