import type { Catalog, CatalogVersion, Product, Provider, Recommendation } from "../domain/entities.js";
import type { EntityId } from "../shared/ids.js";

export interface PageRequest { readonly page: number; readonly pageSize: number }
export interface Page<T> { readonly items: readonly T[]; readonly page: number; readonly pageSize: number; readonly total: number }

export interface ProviderRepository {
  findById(id: EntityId): Promise<Provider | null>;
  findBySlug(slug: string): Promise<Provider | null>;
  save(provider: Provider): Promise<void>;
}

export interface CatalogRepository {
  findById(id: EntityId): Promise<Catalog | null>;
  findVersionById(id: EntityId): Promise<CatalogVersion | null>;
  save(catalog: Catalog): Promise<void>;
  saveVersion(version: CatalogVersion): Promise<void>;
}

export interface ProductSearchCriteria {
  readonly text?: string;
  readonly providerId?: EntityId;
  readonly categoryIds?: readonly EntityId[];
  readonly activeOnly?: boolean;
}

export interface ProductRepository {
  findById(id: EntityId): Promise<Product | null>;
  search(criteria: ProductSearchCriteria, page: PageRequest): Promise<Page<Product>>;
  save(product: Product): Promise<void>;
  saveMany(products: readonly Product[]): Promise<void>;
}

export interface KnowledgeRepository {
  linkProduct(productId: EntityId, nodeId: EntityId, weight: number, explanation?: string): Promise<void>;
  unlinkProduct(productId: EntityId, nodeId: EntityId): Promise<void>;
}

export interface RecommendationRepository {
  save(recommendation: Recommendation): Promise<void>;
  findById(id: EntityId): Promise<Recommendation | null>;
}
