-- CreateEnum
CREATE TYPE "KnowledgeNodeType" AS ENUM ('CONCEPT', 'NEED', 'SOLUTION', 'SOLUTION_STEP', 'AUDIENCE', 'OCCASION', 'BUSINESS_TYPE', 'OBJECTIVE', 'STYLE', 'MATERIAL', 'TECHNIQUE');

-- CreateEnum
CREATE TYPE "KnowledgeRelationType" AS ENUM ('REQUIRES', 'SUGGESTS', 'SOLVES', 'PART_OF', 'RELATED_TO', 'SUITABLE_FOR', 'ALTERNATIVE_TO', 'COMPLEMENTS', 'PRECEDES', 'DEPENDS_ON', 'USED_FOR', 'PRODUCES');

-- CreateEnum
CREATE TYPE "KnowledgeEvidenceType" AS ENUM ('MANUAL', 'RULE', 'IMPORT', 'AI', 'BEHAVIOR');

-- CreateEnum
CREATE TYPE "KnowledgeEventType" AS ENUM ('QUERY_RECEIVED', 'NODE_MATCHED', 'EDGE_TRAVERSED', 'PRODUCT_CANDIDATE', 'PRODUCT_SCORED', 'PRODUCT_SELECTED', 'PRODUCT_REJECTED', 'EXPLANATION_GENERATED');

-- CreateTable
CREATE TABLE "KnowledgeNode" (
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

-- CreateTable
CREATE TABLE "KnowledgeEdge" (
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

-- CreateTable
CREATE TABLE "KnowledgeProductLink" (
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

-- CreateTable
CREATE TABLE "KnowledgeSession" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "normalizedQuery" TEXT,
    "context" JSONB,
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeSessionMatch" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "score" DECIMAL(10,6) NOT NULL,
    "reason" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeSessionMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeDecisionEvent" (
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

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeNode_slug_key" ON "KnowledgeNode"("slug");

-- CreateIndex
CREATE INDEX "KnowledgeNode_type_active_idx" ON "KnowledgeNode"("type", "active");

-- CreateIndex
CREATE INDEX "KnowledgeNode_name_idx" ON "KnowledgeNode"("name");

-- CreateIndex
CREATE INDEX "KnowledgeNode_priority_idx" ON "KnowledgeNode"("priority");

-- CreateIndex
CREATE INDEX "KnowledgeEdge_sourceId_relationType_active_idx" ON "KnowledgeEdge"("sourceId", "relationType", "active");

-- CreateIndex
CREATE INDEX "KnowledgeEdge_targetId_relationType_active_idx" ON "KnowledgeEdge"("targetId", "relationType", "active");

-- CreateIndex
CREATE INDEX "KnowledgeEdge_weight_idx" ON "KnowledgeEdge"("weight");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeEdge_sourceId_targetId_relationType_key" ON "KnowledgeEdge"("sourceId", "targetId", "relationType");

-- CreateIndex
CREATE INDEX "KnowledgeProductLink_nodeId_active_idx" ON "KnowledgeProductLink"("nodeId", "active");

-- CreateIndex
CREATE INDEX "KnowledgeProductLink_productId_active_idx" ON "KnowledgeProductLink"("productId", "active");

-- CreateIndex
CREATE INDEX "KnowledgeProductLink_weight_idx" ON "KnowledgeProductLink"("weight");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeProductLink_nodeId_productId_relationType_key" ON "KnowledgeProductLink"("nodeId", "productId", "relationType");

-- CreateIndex
CREATE INDEX "KnowledgeSession_createdAt_idx" ON "KnowledgeSession"("createdAt");

-- CreateIndex
CREATE INDEX "KnowledgeSessionMatch_sessionId_score_idx" ON "KnowledgeSessionMatch"("sessionId", "score");

-- CreateIndex
CREATE INDEX "KnowledgeSessionMatch_nodeId_idx" ON "KnowledgeSessionMatch"("nodeId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeSessionMatch_sessionId_nodeId_key" ON "KnowledgeSessionMatch"("sessionId", "nodeId");

-- CreateIndex
CREATE INDEX "KnowledgeDecisionEvent_sessionId_type_idx" ON "KnowledgeDecisionEvent"("sessionId", "type");

-- CreateIndex
CREATE INDEX "KnowledgeDecisionEvent_productId_idx" ON "KnowledgeDecisionEvent"("productId");

-- CreateIndex
CREATE INDEX "KnowledgeDecisionEvent_createdAt_idx" ON "KnowledgeDecisionEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeDecisionEvent_sessionId_sequence_key" ON "KnowledgeDecisionEvent"("sessionId", "sequence");

-- AddForeignKey
ALTER TABLE "KnowledgeEdge" ADD CONSTRAINT "KnowledgeEdge_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "KnowledgeNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeEdge" ADD CONSTRAINT "KnowledgeEdge_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "KnowledgeNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeProductLink" ADD CONSTRAINT "KnowledgeProductLink_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "KnowledgeNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeProductLink" ADD CONSTRAINT "KnowledgeProductLink_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeSessionMatch" ADD CONSTRAINT "KnowledgeSessionMatch_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "KnowledgeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeSessionMatch" ADD CONSTRAINT "KnowledgeSessionMatch_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "KnowledgeNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeDecisionEvent" ADD CONSTRAINT "KnowledgeDecisionEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "KnowledgeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
