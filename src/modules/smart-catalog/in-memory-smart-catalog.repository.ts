import type { SmartCatalogProduct, SmartCatalogRepository } from "./smart-catalog.types.js";

const PRODUCTS: readonly SmartCatalogProduct[] = Object.freeze([
  Object.freeze({ id: "tshirt-kids", sku: "TXT-KID-001", name: "Camiseta infantil personalizada", category: "TEXTILE", price: 19, cost: 8, currency: "EUR", stock: 40, productionDays: 3, minAge: 3, maxAge: 14, tags: Object.freeze(["superheroínas", "gemelas", "cumpleaños", "coordinado"]), emotionalGoals: Object.freeze(["FUN", "CONNECTION", "CELEBRATION"]), visualStyles: Object.freeze(["COMIC", "COLORFUL_ILLUSTRATION", "MINIMAL"]), presentationTemplateIds: Object.freeze(["tshirt-front-v1"]), active: true }),
  Object.freeze({ id: "mug-ceramic", sku: "DRK-MUG-001", name: "Taza personalizada", category: "DRINKWARE", price: 14, cost: 5.5, currency: "EUR", stock: 75, productionDays: 2, minAge: 8, tags: Object.freeze(["desayuno", "foto", "recuerdo"]), emotionalGoals: Object.freeze(["REMEMBRANCE", "CELEBRATION"]), visualStyles: Object.freeze(["COMIC", "COLORFUL_ILLUSTRATION", "PHOTOGRAPHIC", "MINIMAL"]), presentationTemplateIds: Object.freeze(["mug-wrap-v1"]), active: true }),
  Object.freeze({ id: "canvas-30x40", sku: "DEC-CAN-3040", name: "Lienzo 30 × 40 cm", category: "DECORATION", price: 29, cost: 12, currency: "EUR", stock: 25, productionDays: 4, tags: Object.freeze(["habitación", "decoración", "recuerdo"]), emotionalGoals: Object.freeze(["PRIDE", "REMEMBRANCE", "CONNECTION"]), visualStyles: Object.freeze(["COMIC", "COLORFUL_ILLUSTRATION", "WATERCOLOR", "PHOTOGRAPHIC"]), presentationTemplateIds: Object.freeze(["canvas-wall-v1"]), active: true }),
  Object.freeze({ id: "puzzle-120", sku: "PUZ-120-001", name: "Puzle personalizado 120 piezas", category: "PUZZLE", price: 24, cost: 9, currency: "EUR", stock: 30, productionDays: 4, minAge: 6, tags: Object.freeze(["juego", "familia", "gemelas", "compartido"]), emotionalGoals: Object.freeze(["FUN", "CONNECTION", "SURPRISE"]), visualStyles: Object.freeze(["COMIC", "COLORFUL_ILLUSTRATION", "WATERCOLOR", "PHOTOGRAPHIC"]), presentationTemplateIds: Object.freeze(["puzzle-flat-v1"]), active: true }),
  Object.freeze({ id: "story-book", sku: "BOK-A5-001", name: "Cuento personalizado A5", category: "BOOK", price: 28, cost: 11, currency: "EUR", stock: 50, productionDays: 5, minAge: 4, maxAge: 12, tags: Object.freeze(["historia", "aventura", "personajes", "superheroínas"]), emotionalGoals: Object.freeze(["SURPRISE", "CONNECTION", "REMEMBRANCE", "FUN"]), visualStyles: Object.freeze(["COMIC", "COLORFUL_ILLUSTRATION", "WATERCOLOR"]), presentationTemplateIds: Object.freeze([]), active: true }),
]);

export class InMemorySmartCatalogRepository implements SmartCatalogRepository {
  constructor(private readonly products: readonly SmartCatalogProduct[] = PRODUCTS) {}
  async list(): Promise<readonly SmartCatalogProduct[]> { return this.products; }
  getById(id: string): SmartCatalogProduct | undefined { return this.products.find((item) => item.id === id); }
}
