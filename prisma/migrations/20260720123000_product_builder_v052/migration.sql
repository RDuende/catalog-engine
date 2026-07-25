-- Catalog Engine v0.5.2 - Product Builder Engine
ALTER TYPE "DocumentJobStage" ADD VALUE IF NOT EXISTS 'BUILDING_PRODUCTS';

DO $$ BEGIN
  CREATE TYPE "ProcessingRunStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "DetectedProductEvidence" (
  "id" TEXT NOT NULL,
  "detectedProductId" TEXT NOT NULL,
  "documentCandidateId" TEXT NOT NULL,
  "field" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL,
  "evidence" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DetectedProductEvidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProcessingRun" (
  "id" TEXT NOT NULL,
  "documentJobId" TEXT NOT NULL,
  "engineVersion" TEXT NOT NULL,
  "status" "ProcessingRunStatus" NOT NULL DEFAULT 'RUNNING',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  "candidates" INTEGER NOT NULL DEFAULT 0,
  "groups" INTEGER NOT NULL DEFAULT 0,
  "products" INTEGER NOT NULL DEFAULT 0,
  "warnings" INTEGER NOT NULL DEFAULT 0,
  "errors" INTEGER NOT NULL DEFAULT 0,
  "durationMs" INTEGER,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProcessingRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EngineMetric" (
  "id" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "metric" TEXT NOT NULL,
  "value" DOUBLE PRECISION NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EngineMetric_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DetectedProduct_documentJobId_manufacturerSku_key"
ON "DetectedProduct"("documentJobId", "manufacturerSku");
CREATE UNIQUE INDEX IF NOT EXISTS "DetectedProductEvidence_detectedProductId_documentCandidateId_field_key"
ON "DetectedProductEvidence"("detectedProductId", "documentCandidateId", "field");
CREATE INDEX IF NOT EXISTS "DetectedProductEvidence_documentCandidateId_idx"
ON "DetectedProductEvidence"("documentCandidateId");
CREATE INDEX IF NOT EXISTS "ProcessingRun_documentJobId_startedAt_idx"
ON "ProcessingRun"("documentJobId", "startedAt");
CREATE INDEX IF NOT EXISTS "ProcessingRun_engineVersion_status_idx"
ON "ProcessingRun"("engineVersion", "status");
CREATE INDEX IF NOT EXISTS "EngineMetric_runId_metric_idx"
ON "EngineMetric"("runId", "metric");

DO $$ BEGIN
  ALTER TABLE "DetectedProductEvidence"
  ADD CONSTRAINT "DetectedProductEvidence_detectedProductId_fkey"
  FOREIGN KEY ("detectedProductId") REFERENCES "DetectedProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "DetectedProductEvidence"
  ADD CONSTRAINT "DetectedProductEvidence_documentCandidateId_fkey"
  FOREIGN KEY ("documentCandidateId") REFERENCES "DocumentCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "ProcessingRun"
  ADD CONSTRAINT "ProcessingRun_documentJobId_fkey"
  FOREIGN KEY ("documentJobId") REFERENCES "DocumentJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "EngineMetric"
  ADD CONSTRAINT "EngineMetric_runId_fkey"
  FOREIGN KEY ("runId") REFERENCES "ProcessingRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
