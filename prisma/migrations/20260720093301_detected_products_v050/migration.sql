-- CreateEnum
CREATE TYPE "CatalogVersionStatus" AS ENUM ('DRAFT', 'PROCESSING', 'WAITING_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DetectedProductStatus" AS ENUM ('DETECTED', 'NEEDS_REVIEW', 'APPROVED', 'REJECTED', 'IMPORTED', 'CONFLICT');

-- AlterTable
ALTER TABLE "DocumentJob" ADD COLUMN     "catalogVersionId" TEXT;

-- CreateTable
CREATE TABLE "Manufacturer" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[],
    "website" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Manufacturer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Catalog" (
    "id" TEXT NOT NULL,
    "manufacturerId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogVersion" (
    "id" TEXT NOT NULL,
    "catalogId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "season" TEXT,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "status" "CatalogVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceAssetId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetectedProduct" (
    "id" TEXT NOT NULL,
    "documentJobId" TEXT NOT NULL,
    "catalogVersionId" TEXT,
    "sourceCandidateId" TEXT,
    "sourcePageNumber" INTEGER,
    "manufacturerSku" TEXT,
    "barcode" TEXT,
    "name" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "category" TEXT,
    "subcategory" TEXT,
    "material" TEXT,
    "dimensions" JSONB,
    "weight" JSONB,
    "colors" JSONB,
    "variants" JSONB,
    "prices" JSONB,
    "printAreas" JSONB,
    "normalizedData" JSONB NOT NULL,
    "evidence" JSONB,
    "warnings" JSONB,
    "imageAssetId" TEXT,
    "productId" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "DetectedProductStatus" NOT NULL DEFAULT 'DETECTED',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DetectedProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Manufacturer_code_key" ON "Manufacturer"("code");

-- CreateIndex
CREATE INDEX "Catalog_manufacturerId_idx" ON "Catalog"("manufacturerId");

-- CreateIndex
CREATE UNIQUE INDEX "Catalog_manufacturerId_code_key" ON "Catalog"("manufacturerId", "code");

-- CreateIndex
CREATE INDEX "CatalogVersion_catalogId_status_idx" ON "CatalogVersion"("catalogId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogVersion_catalogId_version_key" ON "CatalogVersion"("catalogId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "DetectedProduct_sourceCandidateId_key" ON "DetectedProduct"("sourceCandidateId");

-- CreateIndex
CREATE INDEX "DetectedProduct_documentJobId_status_idx" ON "DetectedProduct"("documentJobId", "status");

-- CreateIndex
CREATE INDEX "DetectedProduct_catalogVersionId_manufacturerSku_idx" ON "DetectedProduct"("catalogVersionId", "manufacturerSku");

-- CreateIndex
CREATE INDEX "DetectedProduct_manufacturerSku_idx" ON "DetectedProduct"("manufacturerSku");

-- AddForeignKey
ALTER TABLE "Catalog" ADD CONSTRAINT "Catalog_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogVersion" ADD CONSTRAINT "CatalogVersion_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "Catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogVersion" ADD CONSTRAINT "CatalogVersion_sourceAssetId_fkey" FOREIGN KEY ("sourceAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetectedProduct" ADD CONSTRAINT "DetectedProduct_documentJobId_fkey" FOREIGN KEY ("documentJobId") REFERENCES "DocumentJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetectedProduct" ADD CONSTRAINT "DetectedProduct_catalogVersionId_fkey" FOREIGN KEY ("catalogVersionId") REFERENCES "CatalogVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetectedProduct" ADD CONSTRAINT "DetectedProduct_imageAssetId_fkey" FOREIGN KEY ("imageAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetectedProduct" ADD CONSTRAINT "DetectedProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentJob" ADD CONSTRAINT "DocumentJob_catalogVersionId_fkey" FOREIGN KEY ("catalogVersionId") REFERENCES "CatalogVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
