-- CreateEnum
CREATE TYPE "CatalogProductStatus" AS ENUM ('DRAFT', 'NEEDS_REVIEW', 'APPROVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ExtractionIssueSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR');

-- CreateEnum
CREATE TYPE "ChannelListingStatus" AS ENUM ('DRAFT', 'READY', 'SYNCING', 'SYNCED', 'FAILED', 'UNPUBLISHED');

-- AlterTable
ALTER TABLE "DetectedProduct" ADD COLUMN     "catalogProductId" TEXT;

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "country" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogProduct" (
    "id" TEXT NOT NULL,
    "manufacturerId" TEXT,
    "internalSku" TEXT NOT NULL,
    "manufacturerSku" TEXT,
    "barcode" TEXT,
    "fingerprint" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "CatalogProductStatus" NOT NULL DEFAULT 'DRAFT',
    "manuallyProtected" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierReference" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "catalogProductId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "barcode" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogProductSnapshot" (
    "id" TEXT NOT NULL,
    "catalogProductId" TEXT NOT NULL,
    "catalogVersionId" TEXT NOT NULL,
    "sourceSku" TEXT,
    "data" JSONB NOT NULL,
    "contentHash" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogProductSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetectedProductPrice" (
    "id" TEXT NOT NULL,
    "detectedProductId" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "minQuantity" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "value" DECIMAL(14,4) NOT NULL,
    "priceType" TEXT NOT NULL DEFAULT 'PRODUCT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DetectedProductPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetectedProductColor" (
    "id" TEXT NOT NULL,
    "detectedProductId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT,
    "normalizedCode" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DetectedProductColor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetectedProductPrintArea" (
    "id" TEXT NOT NULL,
    "detectedProductId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT,
    "technique" TEXT,
    "widthMm" DECIMAL(10,2),
    "heightMm" DECIMAL(10,2),
    "diameterMm" DECIMAL(10,2),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DetectedProductPrintArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetectedProductAsset" (
    "id" TEXT NOT NULL,
    "detectedProductId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "role" "AssetRole" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DetectedProductAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractionIssue" (
    "id" TEXT NOT NULL,
    "detectedProductId" TEXT NOT NULL,
    "field" TEXT,
    "code" TEXT NOT NULL,
    "severity" "ExtractionIssueSeverity" NOT NULL DEFAULT 'WARNING',
    "message" TEXT NOT NULL,
    "evidence" JSONB,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExtractionIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelListing" (
    "id" TEXT NOT NULL,
    "catalogProductId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "externalId" TEXT,
    "status" "ChannelListingStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT,
    "description" TEXT,
    "price" DECIMAL(14,4),
    "metadata" JSONB,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChannelListing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_code_key" ON "Supplier"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogProduct_internalSku_key" ON "CatalogProduct"("internalSku");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogProduct_fingerprint_key" ON "CatalogProduct"("fingerprint");

-- CreateIndex
CREATE INDEX "CatalogProduct_manufacturerId_manufacturerSku_idx" ON "CatalogProduct"("manufacturerId", "manufacturerSku");

-- CreateIndex
CREATE INDEX "CatalogProduct_barcode_idx" ON "CatalogProduct"("barcode");

-- CreateIndex
CREATE INDEX "CatalogProduct_status_idx" ON "CatalogProduct"("status");

-- CreateIndex
CREATE INDEX "SupplierReference_catalogProductId_idx" ON "SupplierReference"("catalogProductId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierReference_supplierId_reference_key" ON "SupplierReference"("supplierId", "reference");

-- CreateIndex
CREATE INDEX "CatalogProductSnapshot_catalogVersionId_sourceSku_idx" ON "CatalogProductSnapshot"("catalogVersionId", "sourceSku");

-- CreateIndex
CREATE INDEX "CatalogProductSnapshot_contentHash_idx" ON "CatalogProductSnapshot"("contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogProductSnapshot_catalogProductId_catalogVersionId_key" ON "CatalogProductSnapshot"("catalogProductId", "catalogVersionId");

-- CreateIndex
CREATE INDEX "DetectedProductPrice_detectedProductId_idx" ON "DetectedProductPrice"("detectedProductId");

-- CreateIndex
CREATE UNIQUE INDEX "DetectedProductPrice_detectedProductId_tier_priceType_key" ON "DetectedProductPrice"("detectedProductId", "tier", "priceType");

-- CreateIndex
CREATE INDEX "DetectedProductColor_detectedProductId_sortOrder_idx" ON "DetectedProductColor"("detectedProductId", "sortOrder");

-- CreateIndex
CREATE INDEX "DetectedProductPrintArea_detectedProductId_idx" ON "DetectedProductPrintArea"("detectedProductId");

-- CreateIndex
CREATE INDEX "DetectedProductAsset_detectedProductId_role_sortOrder_idx" ON "DetectedProductAsset"("detectedProductId", "role", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "DetectedProductAsset_detectedProductId_assetId_role_key" ON "DetectedProductAsset"("detectedProductId", "assetId", "role");

-- CreateIndex
CREATE INDEX "ExtractionIssue_detectedProductId_severity_idx" ON "ExtractionIssue"("detectedProductId", "severity");

-- CreateIndex
CREATE INDEX "ExtractionIssue_code_idx" ON "ExtractionIssue"("code");

-- CreateIndex
CREATE INDEX "ChannelListing_channel_status_idx" ON "ChannelListing"("channel", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelListing_catalogProductId_channel_key" ON "ChannelListing"("catalogProductId", "channel");

-- AddForeignKey
ALTER TABLE "DetectedProduct" ADD CONSTRAINT "DetectedProduct_catalogProductId_fkey" FOREIGN KEY ("catalogProductId") REFERENCES "CatalogProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogProduct" ADD CONSTRAINT "CatalogProduct_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierReference" ADD CONSTRAINT "SupplierReference_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierReference" ADD CONSTRAINT "SupplierReference_catalogProductId_fkey" FOREIGN KEY ("catalogProductId") REFERENCES "CatalogProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogProductSnapshot" ADD CONSTRAINT "CatalogProductSnapshot_catalogProductId_fkey" FOREIGN KEY ("catalogProductId") REFERENCES "CatalogProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogProductSnapshot" ADD CONSTRAINT "CatalogProductSnapshot_catalogVersionId_fkey" FOREIGN KEY ("catalogVersionId") REFERENCES "CatalogVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetectedProductPrice" ADD CONSTRAINT "DetectedProductPrice_detectedProductId_fkey" FOREIGN KEY ("detectedProductId") REFERENCES "DetectedProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetectedProductColor" ADD CONSTRAINT "DetectedProductColor_detectedProductId_fkey" FOREIGN KEY ("detectedProductId") REFERENCES "DetectedProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetectedProductPrintArea" ADD CONSTRAINT "DetectedProductPrintArea_detectedProductId_fkey" FOREIGN KEY ("detectedProductId") REFERENCES "DetectedProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetectedProductAsset" ADD CONSTRAINT "DetectedProductAsset_detectedProductId_fkey" FOREIGN KEY ("detectedProductId") REFERENCES "DetectedProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetectedProductAsset" ADD CONSTRAINT "DetectedProductAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractionIssue" ADD CONSTRAINT "ExtractionIssue_detectedProductId_fkey" FOREIGN KEY ("detectedProductId") REFERENCES "DetectedProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelListing" ADD CONSTRAINT "ChannelListing_catalogProductId_fkey" FOREIGN KEY ("catalogProductId") REFERENCES "CatalogProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
