\set ON_ERROR_STOP on
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'KnowledgeNodeType') THEN
    CREATE TYPE "KnowledgeNodeType" AS ENUM (
      'CONCEPT','NEED','SOLUTION','SOLUTION_STEP','AUDIENCE','OCCASION',
      'BUSINESS_TYPE','OBJECTIVE','STYLE','MATERIAL','TECHNIQUE'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'KnowledgeRelationType') THEN
    CREATE TYPE "KnowledgeRelationType" AS ENUM (
      'REQUIRES','SUGGESTS','SOLVES','PART_OF','RELATED_TO','SUITABLE_FOR',
      'ALTERNATIVE_TO','COMPLEMENTS','PRECEDES','DEPENDS_ON','USED_FOR','PRODUCES'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'KnowledgeEvidenceType') THEN
    CREATE TYPE "KnowledgeEvidenceType" AS ENUM ('MANUAL','RULE','IMPORT','AI','BEHAVIOR');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'KnowledgeEventType') THEN
    CREATE TYPE "KnowledgeEventType" AS ENUM (
      'QUERY_RECEIVED','NODE_MATCHED','EDGE_TRAVERSED','PRODUCT_CANDIDATE',
      'PRODUCT_SCORED','PRODUCT_SELECTED','PRODUCT_REJECTED','EXPLANATION_GENERATED'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "KnowledgeNode" (
  "id" TEXT NOT NULL,
  "type" "KnowledgeNodeType" NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "KnowledgeNode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "KnowledgeEdge" (
  "id" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "relationType" "KnowledgeRelationType" NOT NULL,
  "weight" DECIMAL(8,6) NOT NULL DEFAULT 1,
  "confidence" DECIMAL(8,6) NOT NULL DEFAULT 1,
  "evidenceType" "KnowledgeEvidenceType" NOT NULL DEFAULT 'MANUAL',
  "explanation" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "validFrom" TIMESTAMP(3),
  "validTo" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "KnowledgeEdge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "KnowledgeProductLink" (
  "id" TEXT NOT NULL,
  "nodeId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "relationType" "KnowledgeRelationType" NOT NULL DEFAULT 'RELATED_TO',
  "weight" DECIMAL(8,6) NOT NULL DEFAULT 1,
  "confidence" DECIMAL(8,6) NOT NULL DEFAULT 1,
  "evidenceType" "KnowledgeEvidenceType" NOT NULL DEFAULT 'MANUAL',
  "explanation" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "KnowledgeProductLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "KnowledgeSession" (
  "id" TEXT NOT NULL,
  "query" TEXT NOT NULL,
  "normalizedQuery" TEXT,
  "context" JSONB,
  "result" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "KnowledgeSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "KnowledgeSessionMatch" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "nodeId" TEXT NOT NULL,
  "score" DECIMAL(10,6) NOT NULL,
  "reason" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "KnowledgeSessionMatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "KnowledgeDecisionEvent" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "type" "KnowledgeEventType" NOT NULL,
  "sequence" INTEGER NOT NULL,
  "nodeId" TEXT,
  "edgeId" TEXT,
  "productId" TEXT,
  "score" DECIMAL(12,6),
  "reason" TEXT NOT NULL,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "KnowledgeDecisionEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "KnowledgeNode_slug_key" ON "KnowledgeNode"("slug");
CREATE INDEX IF NOT EXISTS "KnowledgeNode_type_active_idx" ON "KnowledgeNode"("type","active");
CREATE INDEX IF NOT EXISTS "KnowledgeNode_name_idx" ON "KnowledgeNode"("name");
CREATE INDEX IF NOT EXISTS "KnowledgeNode_priority_idx" ON "KnowledgeNode"("priority");

CREATE UNIQUE INDEX IF NOT EXISTS "KnowledgeEdge_sourceId_targetId_relationType_key"
  ON "KnowledgeEdge"("sourceId","targetId","relationType");
CREATE INDEX IF NOT EXISTS "KnowledgeEdge_sourceId_relationType_active_idx"
  ON "KnowledgeEdge"("sourceId","relationType","active");
CREATE INDEX IF NOT EXISTS "KnowledgeEdge_targetId_relationType_active_idx"
  ON "KnowledgeEdge"("targetId","relationType","active");
CREATE INDEX IF NOT EXISTS "KnowledgeEdge_weight_idx" ON "KnowledgeEdge"("weight");

CREATE UNIQUE INDEX IF NOT EXISTS "KnowledgeProductLink_nodeId_productId_relationType_key"
  ON "KnowledgeProductLink"("nodeId","productId","relationType");
CREATE INDEX IF NOT EXISTS "KnowledgeProductLink_nodeId_active_idx"
  ON "KnowledgeProductLink"("nodeId","active");
CREATE INDEX IF NOT EXISTS "KnowledgeProductLink_productId_active_idx"
  ON "KnowledgeProductLink"("productId","active");
CREATE INDEX IF NOT EXISTS "KnowledgeProductLink_weight_idx"
  ON "KnowledgeProductLink"("weight");

CREATE INDEX IF NOT EXISTS "KnowledgeSession_createdAt_idx"
  ON "KnowledgeSession"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "KnowledgeSessionMatch_sessionId_nodeId_key"
  ON "KnowledgeSessionMatch"("sessionId","nodeId");
CREATE INDEX IF NOT EXISTS "KnowledgeSessionMatch_sessionId_score_idx"
  ON "KnowledgeSessionMatch"("sessionId","score");
CREATE INDEX IF NOT EXISTS "KnowledgeSessionMatch_nodeId_idx"
  ON "KnowledgeSessionMatch"("nodeId");

CREATE UNIQUE INDEX IF NOT EXISTS "KnowledgeDecisionEvent_sessionId_sequence_key"
  ON "KnowledgeDecisionEvent"("sessionId","sequence");
CREATE INDEX IF NOT EXISTS "KnowledgeDecisionEvent_sessionId_type_idx"
  ON "KnowledgeDecisionEvent"("sessionId","type");
CREATE INDEX IF NOT EXISTS "KnowledgeDecisionEvent_productId_idx"
  ON "KnowledgeDecisionEvent"("productId");
CREATE INDEX IF NOT EXISTS "KnowledgeDecisionEvent_createdAt_idx"
  ON "KnowledgeDecisionEvent"("createdAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='KnowledgeEdge_sourceId_fkey') THEN
    ALTER TABLE "KnowledgeEdge" ADD CONSTRAINT "KnowledgeEdge_sourceId_fkey"
      FOREIGN KEY ("sourceId") REFERENCES "KnowledgeNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='KnowledgeEdge_targetId_fkey') THEN
    ALTER TABLE "KnowledgeEdge" ADD CONSTRAINT "KnowledgeEdge_targetId_fkey"
      FOREIGN KEY ("targetId") REFERENCES "KnowledgeNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='KnowledgeProductLink_nodeId_fkey') THEN
    ALTER TABLE "KnowledgeProductLink" ADD CONSTRAINT "KnowledgeProductLink_nodeId_fkey"
      FOREIGN KEY ("nodeId") REFERENCES "KnowledgeNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='KnowledgeProductLink_productId_fkey') THEN
    ALTER TABLE "KnowledgeProductLink" ADD CONSTRAINT "KnowledgeProductLink_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='KnowledgeSessionMatch_sessionId_fkey') THEN
    ALTER TABLE "KnowledgeSessionMatch" ADD CONSTRAINT "KnowledgeSessionMatch_sessionId_fkey"
      FOREIGN KEY ("sessionId") REFERENCES "KnowledgeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='KnowledgeSessionMatch_nodeId_fkey') THEN
    ALTER TABLE "KnowledgeSessionMatch" ADD CONSTRAINT "KnowledgeSessionMatch_nodeId_fkey"
      FOREIGN KEY ("nodeId") REFERENCES "KnowledgeNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='KnowledgeDecisionEvent_sessionId_fkey') THEN
    ALTER TABLE "KnowledgeDecisionEvent" ADD CONSTRAINT "KnowledgeDecisionEvent_sessionId_fkey"
      FOREIGN KEY ("sessionId") REFERENCES "KnowledgeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

COMMIT;
