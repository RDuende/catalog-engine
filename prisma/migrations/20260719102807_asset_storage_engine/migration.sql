/*
  Warnings:

  - You are about to drop the column `active` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `brandId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `ean` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `longDescription` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `productType` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `shortDescription` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `taxRate` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the `Attribute` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AttributeOption` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Brand` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductAttributeValue` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductMedia` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductVariant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Supplier` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SupplierCatalog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SupplierProduct` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT', 'VECTOR', 'TEMPLATE', 'MOCKUP', 'FONT', 'ICC_PROFILE', 'ARCHIVE', 'AUDIO', 'OTHER');

-- CreateEnum
CREATE TYPE "AssetRole" AS ENUM ('PRIMARY_IMAGE', 'GALLERY_IMAGE', 'DETAIL_IMAGE', 'LIFESTYLE_IMAGE', 'PACKAGING_IMAGE', 'TECHNICAL_DRAWING', 'PRINT_TEMPLATE', 'MOCKUP', 'MANUAL', 'CERTIFICATE', 'SAFETY_SHEET', 'ICC_PROFILE', 'PRODUCTION_FILE', 'SOURCE_FILE', 'THUMBNAIL', 'OTHER');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('PROCESSING', 'READY', 'FAILED', 'QUARANTINED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AssetSource" AS ENUM ('MANUAL_UPLOAD', 'IMPORT', 'API', 'GENERATED', 'AI', 'EMAIL', 'DOCUMENT_EXTRACTION');

-- CreateEnum
CREATE TYPE "StorageDriver" AS ENUM ('LOCAL', 'S3', 'MINIO', 'AZURE_BLOB', 'GOOGLE_CLOUD');

-- CreateEnum
CREATE TYPE "AssetProcessingJobType" AS ENUM ('METADATA_EXTRACTION', 'THUMBNAIL', 'PREVIEW', 'OCR', 'VIRUS_SCAN', 'COLOR_PROFILE', 'TRANSCODE', 'AI_CLASSIFICATION');

-- CreateEnum
CREATE TYPE "AssetProcessingJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "AttributeOption" DROP CONSTRAINT "AttributeOption_attributeId_fkey";

-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_parentId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_brandId_fkey";

-- DropForeignKey
ALTER TABLE "ProductAttributeValue" DROP CONSTRAINT "ProductAttributeValue_attributeId_fkey";

-- DropForeignKey
ALTER TABLE "ProductAttributeValue" DROP CONSTRAINT "ProductAttributeValue_productId_fkey";

-- DropForeignKey
ALTER TABLE "ProductCategory" DROP CONSTRAINT "ProductCategory_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "ProductCategory" DROP CONSTRAINT "ProductCategory_productId_fkey";

-- DropForeignKey
ALTER TABLE "ProductMedia" DROP CONSTRAINT "ProductMedia_productId_fkey";

-- DropForeignKey
ALTER TABLE "ProductMedia" DROP CONSTRAINT "ProductMedia_variantId_fkey";

-- DropForeignKey
ALTER TABLE "ProductVariant" DROP CONSTRAINT "ProductVariant_productId_fkey";

-- DropForeignKey
ALTER TABLE "SupplierCatalog" DROP CONSTRAINT "SupplierCatalog_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "SupplierProduct" DROP CONSTRAINT "SupplierProduct_productId_fkey";

-- DropForeignKey
ALTER TABLE "SupplierProduct" DROP CONSTRAINT "SupplierProduct_supplierCatalogId_fkey";

-- DropForeignKey
ALTER TABLE "SupplierProduct" DROP CONSTRAINT "SupplierProduct_supplierId_fkey";

-- DropIndex
DROP INDEX "Product_brandId_idx";

-- DropIndex
DROP INDEX "Product_deletedAt_idx";

-- DropIndex
DROP INDEX "Product_name_idx";

-- DropIndex
DROP INDEX "Product_status_idx";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "active",
DROP COLUMN "brandId",
DROP COLUMN "deletedAt",
DROP COLUMN "ean",
DROP COLUMN "longDescription",
DROP COLUMN "productType",
DROP COLUMN "shortDescription",
DROP COLUMN "status",
DROP COLUMN "taxRate";

-- DropTable
DROP TABLE "Attribute";

-- DropTable
DROP TABLE "AttributeOption";

-- DropTable
DROP TABLE "Brand";

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "ProductAttributeValue";

-- DropTable
DROP TABLE "ProductCategory";

-- DropTable
DROP TABLE "ProductMedia";

-- DropTable
DROP TABLE "ProductVariant";

-- DropTable
DROP TABLE "Supplier";

-- DropTable
DROP TABLE "SupplierCatalog";

-- DropTable
DROP TABLE "SupplierProduct";

-- DropEnum
DROP TYPE "AttributeDataType";

-- DropEnum
DROP TYPE "CatalogSourceType";

-- DropEnum
DROP TYPE "MediaType";

-- DropEnum
DROP TYPE "ProductStatus";

-- DropEnum
DROP TYPE "ProductType";

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "displayName" TEXT,
    "extension" TEXT,
    "mimeType" TEXT NOT NULL,
    "assetType" "AssetType" NOT NULL,
    "role" "AssetRole",
    "status" "AssetStatus" NOT NULL DEFAULT 'PROCESSING',
    "storageDriver" "StorageDriver" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "widthPx" INTEGER,
    "heightPx" INTEGER,
    "durationSeconds" DECIMAL(12,3),
    "pageCount" INTEGER,
    "colorSpace" TEXT,
    "metadata" JSONB,
    "tags" TEXT[],
    "source" "AssetSource" NOT NULL DEFAULT 'MANUAL_UPLOAD',
    "sourceReference" TEXT,
    "currentVersionId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetVersion" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "storageDriver" "StorageDriver" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "metadata" JSONB,
    "changeReason" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAsset" (
    "productId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "role" "AssetRole" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "channel" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductAsset_pkey" PRIMARY KEY ("productId","assetId","role")
);

-- CreateTable
CREATE TABLE "AssetProcessingJob" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "type" "AssetProcessingJobType" NOT NULL,
    "status" "AssetProcessingJobStatus" NOT NULL DEFAULT 'PENDING',
    "input" JSONB,
    "output" JSONB,
    "errorMessage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetProcessingJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Asset_publicId_key" ON "Asset"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_currentVersionId_key" ON "Asset"("currentVersionId");

-- CreateIndex
CREATE INDEX "Asset_checksumSha256_idx" ON "Asset"("checksumSha256");

-- CreateIndex
CREATE INDEX "Asset_assetType_status_idx" ON "Asset"("assetType", "status");

-- CreateIndex
CREATE INDEX "Asset_deletedAt_idx" ON "Asset"("deletedAt");

-- CreateIndex
CREATE INDEX "AssetVersion_checksumSha256_idx" ON "AssetVersion"("checksumSha256");

-- CreateIndex
CREATE UNIQUE INDEX "AssetVersion_assetId_versionNumber_key" ON "AssetVersion"("assetId", "versionNumber");

-- CreateIndex
CREATE INDEX "ProductAsset_productId_role_sortOrder_idx" ON "ProductAsset"("productId", "role", "sortOrder");

-- CreateIndex
CREATE INDEX "AssetProcessingJob_status_type_idx" ON "AssetProcessingJob"("status", "type");

-- CreateIndex
CREATE INDEX "AssetProcessingJob_assetId_idx" ON "AssetProcessingJob"("assetId");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "AssetVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetVersion" ADD CONSTRAINT "AssetVersion_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAsset" ADD CONSTRAINT "ProductAsset_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAsset" ADD CONSTRAINT "ProductAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetProcessingJob" ADD CONSTRAINT "AssetProcessingJob_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
