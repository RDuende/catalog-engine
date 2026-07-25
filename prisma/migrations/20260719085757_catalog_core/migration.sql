-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'IMPORTED', 'REVIEW', 'APPROVED', 'ACTIVE', 'ARCHIVED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'COMPLETED_WITH_ERRORS', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ImportItemStatus" AS ENUM ('PENDING', 'IMPORTED', 'UPDATED', 'SKIPPED', 'REVIEW', 'FAILED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'DOCUMENT', 'VIDEO', 'ICON');

-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('LA_COLORIDA', 'PRINTSTUDIO', 'RDUENDEGEST', 'WOOCOMMERCE', 'AMAZON', 'OTHER');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('NOT_SYNCED', 'PENDING', 'SYNCING', 'SYNCED', 'FAILED', 'BLOCKED');

-- CreateTable
CREATE TABLE "Supplier" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(170) NOT NULL,
    "website" VARCHAR(255),
    "countryCode" CHAR(2),
    "defaultCurrency" CHAR(3) NOT NULL DEFAULT 'EUR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierCatalog" (
    "id" SERIAL NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "version" VARCHAR(80),
    "sourceType" VARCHAR(40) NOT NULL,
    "sourceName" VARCHAR(255),
    "fileHash" VARCHAR(64),
    "importedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" SERIAL NOT NULL,
    "supplierCatalogId" INTEGER NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "sourceFilename" VARCHAR(255),
    "fileHash" VARCHAR(64),
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "importedItems" INTEGER NOT NULL DEFAULT 0,
    "updatedItems" INTEGER NOT NULL DEFAULT 0,
    "skippedItems" INTEGER NOT NULL DEFAULT 0,
    "reviewItems" INTEGER NOT NULL DEFAULT 0,
    "failedItems" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportItem" (
    "id" SERIAL NOT NULL,
    "importJobId" INTEGER NOT NULL,
    "productId" INTEGER,
    "supplierReference" VARCHAR(100),
    "status" "ImportItemStatus" NOT NULL DEFAULT 'PENDING',
    "confidence" DECIMAL(5,4),
    "sourcePage" INTEGER,
    "rawPayload" JSONB,
    "normalizedPayload" JSONB,
    "warnings" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "sku" VARCHAR(120) NOT NULL,
    "name" VARCHAR(220) NOT NULL,
    "slug" VARCHAR(250) NOT NULL,
    "shortDescription" TEXT,
    "description" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "brand" VARCHAR(150),
    "materialSummary" VARCHAR(255),
    "dimensionsRaw" VARCHAR(255),
    "weightGrams" DECIMAL(12,3),
    "defaultCurrency" CHAR(3) NOT NULL DEFAULT 'EUR',
    "aiAttributes" JSONB,
    "searchMetadata" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierProduct" (
    "id" SERIAL NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "supplierReference" VARCHAR(100) NOT NULL,
    "supplierName" VARCHAR(220),
    "supplierDescription" TEXT,
    "supplierUrl" VARCHAR(500),
    "rawPayload" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierPrice" (
    "id" SERIAL NOT NULL,
    "supplierProductId" INTEGER NOT NULL,
    "minQuantity" INTEGER NOT NULL DEFAULT 1,
    "unitCost" DECIMAL(14,4) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'EUR',
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "sku" VARCHAR(140) NOT NULL,
    "supplierReference" VARCHAR(120),
    "ean" VARCHAR(32),
    "name" VARCHAR(180),
    "colorCode" VARCHAR(50),
    "colorName" VARCHAR(100),
    "sizeCode" VARCHAR(50),
    "sizeName" VARCHAR(100),
    "attributes" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "parentId" INTEGER,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(190) NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCategory" (
    "productId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "primary" BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("productId","categoryId")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" SERIAL NOT NULL,
    "type" "MediaType" NOT NULL DEFAULT 'IMAGE',
    "originalName" VARCHAR(255),
    "storagePath" VARCHAR(500) NOT NULL,
    "publicUrl" VARCHAR(700),
    "mimeType" VARCHAR(120),
    "fileHash" VARCHAR(64),
    "width" INTEGER,
    "height" INTEGER,
    "sizeBytes" BIGINT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductMedia" (
    "productId" INTEGER NOT NULL,
    "mediaAssetId" INTEGER NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'gallery',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "altText" VARCHAR(255),

    CONSTRAINT "ProductMedia_pkey" PRIMARY KEY ("productId","mediaAssetId")
);

-- CreateTable
CREATE TABLE "ProductTranslation" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "name" VARCHAR(220) NOT NULL,
    "slug" VARCHAR(250),
    "shortDescription" TEXT,
    "description" TEXT,
    "seoTitle" VARCHAR(255),
    "seoDescription" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelListing" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "channel" "ChannelType" NOT NULL,
    "externalId" VARCHAR(150),
    "externalUrl" VARCHAR(700),
    "status" "SyncStatus" NOT NULL DEFAULT 'NOT_SYNCED',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "channelData" JSONB,
    "lastSyncedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChannelListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" BIGSERIAL NOT NULL,
    "entityType" VARCHAR(80) NOT NULL,
    "entityId" VARCHAR(100) NOT NULL,
    "action" VARCHAR(80) NOT NULL,
    "actorType" VARCHAR(50),
    "actorId" VARCHAR(100),
    "beforeData" JSONB,
    "afterData" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_name_key" ON "Supplier"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_slug_key" ON "Supplier"("slug");

-- CreateIndex
CREATE INDEX "Supplier_active_idx" ON "Supplier"("active");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierCatalog_fileHash_key" ON "SupplierCatalog"("fileHash");

-- CreateIndex
CREATE INDEX "SupplierCatalog_supplierId_idx" ON "SupplierCatalog"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierCatalog_importedAt_idx" ON "SupplierCatalog"("importedAt");

-- CreateIndex
CREATE INDEX "ImportJob_supplierCatalogId_idx" ON "ImportJob"("supplierCatalogId");

-- CreateIndex
CREATE INDEX "ImportJob_status_idx" ON "ImportJob"("status");

-- CreateIndex
CREATE INDEX "ImportJob_createdAt_idx" ON "ImportJob"("createdAt");

-- CreateIndex
CREATE INDEX "ImportItem_importJobId_idx" ON "ImportItem"("importJobId");

-- CreateIndex
CREATE INDEX "ImportItem_productId_idx" ON "ImportItem"("productId");

-- CreateIndex
CREATE INDEX "ImportItem_status_idx" ON "ImportItem"("status");

-- CreateIndex
CREATE INDEX "ImportItem_supplierReference_idx" ON "ImportItem"("supplierReference");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "Product_active_idx" ON "Product"("active");

-- CreateIndex
CREATE INDEX "Product_brand_idx" ON "Product"("brand");

-- CreateIndex
CREATE INDEX "SupplierProduct_productId_idx" ON "SupplierProduct"("productId");

-- CreateIndex
CREATE INDEX "SupplierProduct_active_idx" ON "SupplierProduct"("active");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierProduct_supplierId_supplierReference_key" ON "SupplierProduct"("supplierId", "supplierReference");

-- CreateIndex
CREATE INDEX "SupplierPrice_supplierProductId_idx" ON "SupplierPrice"("supplierProductId");

-- CreateIndex
CREATE INDEX "SupplierPrice_validFrom_validUntil_idx" ON "SupplierPrice"("validFrom", "validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierPrice_supplierProductId_minQuantity_currency_key" ON "SupplierPrice"("supplierProductId", "minQuantity", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_ean_key" ON "ProductVariant"("ean");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE INDEX "ProductVariant_colorName_idx" ON "ProductVariant"("colorName");

-- CreateIndex
CREATE INDEX "ProductVariant_sizeName_idx" ON "ProductVariant"("sizeName");

-- CreateIndex
CREATE INDEX "ProductVariant_active_idx" ON "ProductVariant"("active");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE INDEX "Category_active_idx" ON "Category"("active");

-- CreateIndex
CREATE INDEX "Category_sortOrder_idx" ON "Category"("sortOrder");

-- CreateIndex
CREATE INDEX "ProductCategory_categoryId_idx" ON "ProductCategory"("categoryId");

-- CreateIndex
CREATE INDEX "ProductCategory_primary_idx" ON "ProductCategory"("primary");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_storagePath_key" ON "MediaAsset"("storagePath");

-- CreateIndex
CREATE INDEX "MediaAsset_type_idx" ON "MediaAsset"("type");

-- CreateIndex
CREATE INDEX "MediaAsset_fileHash_idx" ON "MediaAsset"("fileHash");

-- CreateIndex
CREATE INDEX "ProductMedia_mediaAssetId_idx" ON "ProductMedia"("mediaAssetId");

-- CreateIndex
CREATE INDEX "ProductMedia_role_sortOrder_idx" ON "ProductMedia"("role", "sortOrder");

-- CreateIndex
CREATE INDEX "ProductTranslation_locale_idx" ON "ProductTranslation"("locale");

-- CreateIndex
CREATE INDEX "ProductTranslation_approved_idx" ON "ProductTranslation"("approved");

-- CreateIndex
CREATE UNIQUE INDEX "ProductTranslation_productId_locale_key" ON "ProductTranslation"("productId", "locale");

-- CreateIndex
CREATE INDEX "ChannelListing_channel_status_idx" ON "ChannelListing"("channel", "status");

-- CreateIndex
CREATE INDEX "ChannelListing_externalId_idx" ON "ChannelListing"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelListing_productId_channel_key" ON "ChannelListing"("productId", "channel");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "SupplierCatalog" ADD CONSTRAINT "SupplierCatalog_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_supplierCatalogId_fkey" FOREIGN KEY ("supplierCatalogId") REFERENCES "SupplierCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportItem" ADD CONSTRAINT "ImportItem_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "ImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportItem" ADD CONSTRAINT "ImportItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierProduct" ADD CONSTRAINT "SupplierProduct_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierProduct" ADD CONSTRAINT "SupplierProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPrice" ADD CONSTRAINT "SupplierPrice_supplierProductId_fkey" FOREIGN KEY ("supplierProductId") REFERENCES "SupplierProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMedia" ADD CONSTRAINT "ProductMedia_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMedia" ADD CONSTRAINT "ProductMedia_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTranslation" ADD CONSTRAINT "ProductTranslation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelListing" ADD CONSTRAINT "ChannelListing_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
