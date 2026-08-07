import type { CatalogProduct, CatalogRepository } from "./solution-engine.types.js";

function product(value: CatalogProduct): CatalogProduct {
  return Object.freeze({
    ...value,
    compatibleVisualStyles: Object.freeze([...value.compatibleVisualStyles]),
    supportedEmotionalGoals: Object.freeze([...value.supportedEmotionalGoals]),
    tags: Object.freeze([...value.tags]),
  });
}

const PRODUCTS: readonly CatalogProduct[] = Object.freeze([
  product({
    id: "twin-shirts", sku: "TXT-TWIN-001", name: "Camiseta coordinada", category: "TEXTILE",
    unitPrice: 19, currency: "EUR", available: true, minAge: 3, maxAge: 14,
    compatibleVisualStyles: ["COMIC", "COLORFUL_ILLUSTRATION", "MINIMAL"],
    supportedEmotionalGoals: ["CONNECTION", "FUN", "CELEBRATION", "SURPRISE"],
    tags: ["gemelas", "hermanas", "coordinado", "superheroínas"],
  }),
  product({
    id: "personalized-poster", sku: "DEC-A3-001", name: "Lámina personalizada A3", category: "DECORATION",
    unitPrice: 18, currency: "EUR", available: true,
    compatibleVisualStyles: ["COMIC", "COLORFUL_ILLUSTRATION", "WATERCOLOR", "MINIMAL", "PHOTOGRAPHIC"],
    supportedEmotionalGoals: ["REMEMBRANCE", "CONNECTION", "CELEBRATION", "PRIDE"],
    tags: ["habitación", "recuerdo", "decoración"],
  }),
  product({
    id: "personalized-puzzle", sku: "PUZ-120-001", name: "Puzle personalizado 120 piezas", category: "PUZZLE",
    unitPrice: 24, currency: "EUR", available: true, minAge: 6,
    compatibleVisualStyles: ["COMIC", "COLORFUL_ILLUSTRATION", "WATERCOLOR", "PHOTOGRAPHIC"],
    supportedEmotionalGoals: ["FUN", "CONNECTION", "SURPRISE"],
    tags: ["juego", "compartido", "familia"],
  }),
  product({
    id: "mini-story-book", sku: "BOK-A5-001", name: "Mini cuento personalizado", category: "BOOK",
    unitPrice: 28, currency: "EUR", available: true, minAge: 4, maxAge: 12,
    compatibleVisualStyles: ["COMIC", "COLORFUL_ILLUSTRATION", "WATERCOLOR"],
    supportedEmotionalGoals: ["SURPRISE", "CONNECTION", "REMEMBRANCE", "FUN"],
    tags: ["historia", "aventura", "personajes"],
  }),
  product({
    id: "twin-bottles", sku: "DRK-TWIN-001", name: "Botella personalizada", category: "DRINKWARE",
    unitPrice: 15, currency: "EUR", available: true, minAge: 4,
    compatibleVisualStyles: ["COMIC", "COLORFUL_ILLUSTRATION", "MINIMAL"],
    supportedEmotionalGoals: ["FUN", "CONNECTION", "CELEBRATION"],
    tags: ["gemelas", "uso diario", "coordinado"],
  }),
]);

export class InMemorySolutionCatalogRepository implements CatalogRepository {
  constructor(private readonly products: readonly CatalogProduct[] = PRODUCTS) {}

  listAvailable(): readonly CatalogProduct[] {
    return this.products.filter((item) => item.available);
  }

  getById(productId: string): CatalogProduct | undefined {
    return this.products.find((item) => item.id === productId && item.available);
  }
}
