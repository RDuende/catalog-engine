-- CreateEnum
CREATE TYPE "DocumentJobStatus" AS ENUM ('PENDING', 'RUNNING', 'WAITING_REVIEW', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DocumentJobStage" AS ENUM ('QUEUED', 'READING', 'EXTRACTING_TEXT', 'DETECTING_OCR', 'CLASSIFYING', 'EXTRACTING_CANDIDATES', 'GENERATING_PREVIEW', 'IMPORTING', 'FINISHED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('UNKNOWN', 'PRODUCT_CATALOG', 'PRICE_LIST', 'TECHNICAL_SHEET', 'CERTIFICATE', 'MANUAL', 'SAFETY_SHEET', 'IMAGE_SET', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "DocumentElementType" AS ENUM ('TEXT_BLOCK', 'TABLE', 'IMAGE', 'LINK', 'HEADING', 'FOOTER', 'HEADER', 'BARCODE', 'QR_CODE');

-- CreateEnum
CREATE TYPE "DocumentCandidateType" AS ENUM ('PRODUCT', 'CATEGORY', 'BRAND', 'CERTIFICATE', 'TECHNIQUE', 'ASSET_LINK');

-- CreateEnum
CREATE TYPE "DocumentCandidateStatus" AS ENUM ('DETECTED', 'NEEDS_REVIEW', 'APPROVED', 'REJECTED', 'IMPORTED', 'FAILED');

-- CreateEnum
CREATE TYPE "DocumentEventLevel" AS ENUM ('DEBUG', 'INFO', 'WARNING', 'ERROR');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "description" TEXT,
ADD COLUMN     "metadata" JSONB;

-- CreateTable
CREATE TABLE "DocumentJob" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "status" "DocumentJobStatus" NOT NULL DEFAULT 'PENDING',
    "stage" "DocumentJobStage" NOT NULL DEFAULT 'QUEUED',
    "documentType" "DocumentType" NOT NULL DEFAULT 'UNKNOWN',
    "language" TEXT,
    "pageCount" INTEGER,
    "processedPages" INTEGER NOT NULL DEFAULT 0,
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "extractionConfig" JSONB,
    "summary" JSONB,
    "stats" JSONB,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentPage" (
    "id" TEXT NOT NULL,
    "documentJobId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "rotation" INTEGER NOT NULL DEFAULT 0,
    "rawText" TEXT,
    "normalizedText" TEXT,
    "textLength" INTEGER NOT NULL DEFAULT 0,
    "requiresOcr" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentElement" (
    "id" TEXT NOT NULL,
    "documentPageId" TEXT NOT NULL,
    "type" "DocumentElementType" NOT NULL,
    "sequence" INTEGER NOT NULL,
    "text" TEXT,
    "bbox" JSONB,
    "confidence" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentElement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentCandidate" (
    "id" TEXT NOT NULL,
    "documentJobId" TEXT NOT NULL,
    "documentPageId" TEXT,
    "type" "DocumentCandidateType" NOT NULL,
    "status" "DocumentCandidateStatus" NOT NULL DEFAULT 'DETECTED',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "externalSku" TEXT,
    "name" TEXT,
    "normalizedData" JSONB NOT NULL,
    "evidence" JSONB,
    "warnings" JSONB,
    "productId" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentEvent" (
    "id" TEXT NOT NULL,
    "documentJobId" TEXT NOT NULL,
    "level" "DocumentEventLevel" NOT NULL DEFAULT 'INFO',
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentJob_publicId_key" ON "DocumentJob"("publicId");

-- CreateIndex
CREATE INDEX "DocumentJob_status_createdAt_idx" ON "DocumentJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "DocumentJob_assetId_idx" ON "DocumentJob"("assetId");

-- CreateIndex
CREATE INDEX "DocumentPage_documentJobId_requiresOcr_idx" ON "DocumentPage"("documentJobId", "requiresOcr");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentPage_documentJobId_pageNumber_key" ON "DocumentPage"("documentJobId", "pageNumber");

-- CreateIndex
CREATE INDEX "DocumentElement_documentPageId_sequence_idx" ON "DocumentElement"("documentPageId", "sequence");

-- CreateIndex
CREATE INDEX "DocumentElement_type_idx" ON "DocumentElement"("type");

-- CreateIndex
CREATE INDEX "DocumentCandidate_documentJobId_status_idx" ON "DocumentCandidate"("documentJobId", "status");

-- CreateIndex
CREATE INDEX "DocumentCandidate_externalSku_idx" ON "DocumentCandidate"("externalSku");

-- CreateIndex
CREATE INDEX "DocumentEvent_documentJobId_createdAt_idx" ON "DocumentEvent"("documentJobId", "createdAt");

-- AddForeignKey
ALTER TABLE "DocumentJob" ADD CONSTRAINT "DocumentJob_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentPage" ADD CONSTRAINT "DocumentPage_documentJobId_fkey" FOREIGN KEY ("documentJobId") REFERENCES "DocumentJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentElement" ADD CONSTRAINT "DocumentElement_documentPageId_fkey" FOREIGN KEY ("documentPageId") REFERENCES "DocumentPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentCandidate" ADD CONSTRAINT "DocumentCandidate_documentJobId_fkey" FOREIGN KEY ("documentJobId") REFERENCES "DocumentJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentCandidate" ADD CONSTRAINT "DocumentCandidate_documentPageId_fkey" FOREIGN KEY ("documentPageId") REFERENCES "DocumentPage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentCandidate" ADD CONSTRAINT "DocumentCandidate_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentEvent" ADD CONSTRAINT "DocumentEvent_documentJobId_fkey" FOREIGN KEY ("documentJobId") REFERENCES "DocumentJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
