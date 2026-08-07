import type { SmartCatalogContext, SmartCatalogProduct, SmartCatalogRepository } from "./smart-catalog.types.js";

export class HybridSmartCatalogRepository implements SmartCatalogRepository {
  constructor(
    private readonly primary: SmartCatalogRepository,
    private readonly fallback: SmartCatalogRepository,
  ) {}

  async list(context?: SmartCatalogContext): Promise<readonly SmartCatalogProduct[]> {
    try {
      const products = await this.primary.list(context);
      if (products.length > 0) return products;
    } catch {
      // El catálogo demo solo es un respaldo operativo cuando PostgreSQL no está disponible.
    }
    return this.fallback.list(context);
  }

  getById(id: string): SmartCatalogProduct | undefined {
    try {
      const product = this.primary.getById(id);
      if (product) return product;
    } catch {
      // Continúa con el respaldo.
    }
    return this.fallback.getById(id);
  }
}
