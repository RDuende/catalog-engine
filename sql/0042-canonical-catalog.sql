CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS canonical_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key text NOT NULL,
  external_id text NOT NULL,
  sku text,
  name text NOT NULL,
  description text,
  short_description text,
  brand text,
  material text,
  color text,
  dimensions text,
  weight numeric(14,4),
  customizable boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE','DISCONTINUED','DRAFT')),
  source_updated_at timestamptz,
  categories text[] NOT NULL DEFAULT '{}',
  tags text[] NOT NULL DEFAULT '{}',
  attributes jsonb NOT NULL DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}',
  content_hash char(64) NOT NULL,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider_key, external_id)
);
CREATE INDEX IF NOT EXISTS canonical_products_provider_idx ON canonical_products(provider_key);
CREATE INDEX IF NOT EXISTS canonical_products_sku_idx ON canonical_products(sku);
CREATE INDEX IF NOT EXISTS canonical_products_status_idx ON canonical_products(status);
CREATE INDEX IF NOT EXISTS canonical_products_categories_gin ON canonical_products USING gin(categories);
CREATE INDEX IF NOT EXISTS canonical_products_tags_gin ON canonical_products USING gin(tags);
CREATE INDEX IF NOT EXISTS canonical_products_attributes_gin ON canonical_products USING gin(attributes);

CREATE TABLE IF NOT EXISTS canonical_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES canonical_products(id) ON DELETE CASCADE,
  external_id text,
  sku text NOT NULL,
  name text,
  barcode text,
  color text,
  size text,
  material text,
  active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, sku)
);
CREATE INDEX IF NOT EXISTS canonical_variants_sku_idx ON canonical_variants(sku);
CREATE INDEX IF NOT EXISTS canonical_variants_barcode_idx ON canonical_variants(barcode);

CREATE TABLE IF NOT EXISTS canonical_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES canonical_products(id) ON DELETE CASCADE,
  url text NOT NULL,
  type text NOT NULL DEFAULT 'IMAGE' CHECK (type IN ('IMAGE','VIDEO','DOCUMENT','PDF')),
  alt_text text,
  is_primary boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, url)
);

CREATE TABLE IF NOT EXISTS canonical_product_revisions (
  id bigserial PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES canonical_products(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('CREATED','UPDATED','DELETED','RESTORED')),
  content_hash char(64) NOT NULL,
  snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS canonical_revisions_product_idx ON canonical_product_revisions(product_id, created_at DESC);
