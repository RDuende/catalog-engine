CREATE TABLE IF NOT EXISTS kg_build_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL CHECK(status IN ('RUNNING','COMPLETED','FAILED')),
  provider_key text,
  options jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE INDEX IF NOT EXISTS kg_build_runs_started_idx ON kg_build_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS kg_build_runs_provider_idx ON kg_build_runs(provider_key, started_at DESC);
