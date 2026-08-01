CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS commercial_recommendation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  profile text NOT NULL,
  pipeline text NOT NULL,
  provider_key text,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_candidates integer NOT NULL DEFAULT 0,
  returned_items integer NOT NULL DEFAULT 0,
  elapsed_ms numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS commercial_recommendation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES commercial_recommendation_runs(id) ON DELETE CASCADE,
  product_id uuid,
  rank integer NOT NULL,
  score numeric(12,2) NOT NULL DEFAULT 0,
  outcome text NOT NULL DEFAULT 'SHOWN' CHECK (outcome IN ('SHOWN','SHORTLISTED','QUOTED','ACCEPTED','REJECTED','PURCHASED')),
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  feedback jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(run_id, product_id)
);

CREATE TABLE IF NOT EXISTS commercial_feedback_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES commercial_recommendation_runs(id) ON DELETE CASCADE,
  item_id uuid REFERENCES commercial_recommendation_items(id) ON DELETE SET NULL,
  product_id uuid,
  event_type text NOT NULL CHECK (event_type IN ('SHOWN','SHORTLISTED','QUOTED','ACCEPTED','REJECTED','PURCHASED')),
  value numeric(12,2),
  notes text,
  actor text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commercial_runs_created_at ON commercial_recommendation_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commercial_runs_profile ON commercial_recommendation_runs(profile, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commercial_items_product ON commercial_recommendation_items(product_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_commercial_items_outcome ON commercial_recommendation_items(outcome, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_commercial_feedback_type ON commercial_feedback_events(event_type, created_at DESC);
