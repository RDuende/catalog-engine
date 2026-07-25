/*
  Warnings:

  - You are about to drop the column `internalSku` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `code` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the `Asset` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AssetProcessingJob` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AssetVersion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Catalog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CatalogProduct` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CatalogProductSnapshot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CatalogVersion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChannelListing` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DetectedProduct` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DetectedProductAsset` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DetectedProductColor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DetectedProductEvidence` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DetectedProductPrice` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DetectedProductPrintArea` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DocumentCandidate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DocumentElement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DocumentEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DocumentJob` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DocumentPage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EngineMetric` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ExtractionIssue` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Manufacturer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProcessingRun` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductAsset` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SupplierReference` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[sku]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Supplier` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Supplier` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "VariantStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "PriceType" AS ENUM ('COST', 'RETAIL', 'WHOLESALE', 'SALE', 'MAP');

-- CreateEnum
CREATE TYPE "ChannelCode" AS ENUM ('COLORIDA', 'PRINTSTUDIO', 'RDUENDE', 'VITRINAS', 'AMAZON', 'MIRAVIA', 'MANOMANO', 'OTHER');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT', 'RESERVATION', 'RELEASE');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT', 'PDF');

-- CreateEnum
CREATE TYPE "AttributeDataType" AS ENUM ('TEXT', 'NUMBER', 'BOOLEAN', 'COLOR', 'DATE', 'SELECT', 'MULTISELECT');

-- CreateEnum
CREATE TYPE "CustomizationType" AS ENUM ('TEXT', 'IMAGE', 'LOGO', 'COLOR', 'SIZE', 'POSITION', 'TECHNIQUE', 'FILE');

-- CreateEnum
CREATE TYPE "RuleStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DRAFT');

-- CreateEnum
CREATE TYPE "RecommendationSessionStatus" AS ENUM ('STARTED', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "RecommendationEventType" AS ENUM ('IMPRESSION', 'CLICK', 'ADD_TO_PACK', 'REMOVE_FROM_PACK', 'FAVORITE', 'PURCHASE', 'DISMISS');

-- DropForeignKey
ALTER TABLE "Asset" DROP CONSTRAINT "Asset_currentVersionId_fkey";

-- DropForeignKey
ALTER TABLE "AssetProcessingJob" DROP CONSTRAINT "AssetProcessingJob_assetId_fkey";

-- DropForeignKey
ALTER TABLE "AssetVersion" DROP CONSTRAINT "AssetVersion_assetId_fkey";

-- DropForeignKey
ALTER TABLE "Catalog" DROP CONSTRAINT "Catalog_manufacturerId_fkey";

-- DropForeignKey
ALTER TABLE "CatalogProduct" DROP CONSTRAINT "CatalogProduct_manufacturerId_fkey";

-- DropForeignKey
ALTER TABLE "CatalogProductSnapshot" DROP CONSTRAINT "CatalogProductSnapshot_catalogProductId_fkey";

-- DropForeignKey
ALTER TABLE "CatalogProductSnapshot" DROP CONSTRAINT "CatalogProductSnapshot_catalogVersionId_fkey";

-- DropForeignKey
ALTER TABLE "CatalogVersion" DROP CONSTRAINT "CatalogVersion_catalogId_fkey";

-- DropForeignKey
ALTER TABLE "CatalogVersion" DROP CONSTRAINT "CatalogVersion_sourceAssetId_fkey";

-- DropForeignKey
ALTER TABLE "ChannelListing" DROP CONSTRAINT "ChannelListing_catalogProductId_fkey";

-- DropForeignKey
ALTER TABLE "DetectedProduct" DROP CONSTRAINT "DetectedProduct_catalogProductId_fkey";

-- DropForeignKey
ALTER TABLE "DetectedProduct" DROP CONSTRAINT "DetectedProduct_catalogVersionId_fkey";

-- DropForeignKey
ALTER TABLE "DetectedProduct" DROP CONSTRAINT "DetectedProduct_documentJobId_fkey";

-- DropForeignKey
ALTER TABLE "DetectedProduct" DROP CONSTRAINT "DetectedProduct_imageAssetId_fkey";

-- DropForeignKey
ALTER TABLE "DetectedProduct" DROP CONSTRAINT "DetectedProduct_productId_fkey";

-- DropForeignKey
ALTER TABLE "DetectedProductAsset" DROP CONSTRAINT "DetectedProductAsset_assetId_fkey";

-- DropForeignKey
ALTER TABLE "DetectedProductAsset" DROP CONSTRAINT "DetectedProductAsset_detectedProductId_fkey";

-- DropForeignKey
ALTER TABLE "DetectedProductColor" DROP CONSTRAINT "DetectedProductColor_detectedProductId_fkey";

-- DropForeignKey
ALTER TABLE "DetectedProductEvidence" DROP CONSTRAINT "DetectedProductEvidence_detectedProductId_fkey";

-- DropForeignKey
ALTER TABLE "DetectedProductEvidence" DROP CONSTRAINT "DetectedProductEvidence_documentCandidateId_fkey";

-- DropForeignKey
ALTER TABLE "DetectedProductPrice" DROP CONSTRAINT "DetectedProductPrice_detectedProductId_fkey";

-- DropForeignKey
ALTER TABLE "DetectedProductPrintArea" DROP CONSTRAINT "DetectedProductPrintArea_detectedProductId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentCandidate" DROP CONSTRAINT "DocumentCandidate_documentJobId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentCandidate" DROP CONSTRAINT "DocumentCandidate_documentPageId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentCandidate" DROP CONSTRAINT "DocumentCandidate_productId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentElement" DROP CONSTRAINT "DocumentElement_documentPageId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentEvent" DROP CONSTRAINT "DocumentEvent_documentJobId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentJob" DROP CONSTRAINT "DocumentJob_assetId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentJob" DROP CONSTRAINT "DocumentJob_catalogVersionId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentPage" DROP CONSTRAINT "DocumentPage_documentJobId_fkey";

-- DropForeignKey
ALTER TABLE "EngineMetric" DROP CONSTRAINT "EngineMetric_runId_fkey";

-- DropForeignKey
ALTER TABLE "ExtractionIssue" DROP CONSTRAINT "ExtractionIssue_detectedProductId_fkey";

-- DropForeignKey
ALTER TABLE "ProcessingRun" DROP CONSTRAINT "ProcessingRun_documentJobId_fkey";

-- DropForeignKey
ALTER TABLE "ProductAsset" DROP CONSTRAINT "ProductAsset_assetId_fkey";

-- DropForeignKey
ALTER TABLE "ProductAsset" DROP CONSTRAINT "ProductAsset_productId_fkey";

-- DropForeignKey
ALTER TABLE "SupplierReference" DROP CONSTRAINT "SupplierReference_catalogProductId_fkey";

-- DropForeignKey
ALTER TABLE "SupplierReference" DROP CONSTRAINT "SupplierReference_supplierId_fkey";

-- DropIndex
DROP INDEX "Product_internalSku_key";

-- DropIndex
DROP INDEX "Supplier_code_key";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "internalSku",
ADD COLUMN     "aiDescription" TEXT,
ADD COLUMN     "brandId" TEXT,
ADD COLUMN     "customizable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "depthMm" INTEGER,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "heightMm" INTEGER,
ADD COLUMN     "material" TEXT,
ADD COLUMN     "popularityScore" DECIMAL(10,4) NOT NULL DEFAULT 0,
ADD COLUMN     "primaryColor" TEXT,
ADD COLUMN     "productType" TEXT,
ADD COLUMN     "recommendationScore" DECIMAL(10,4) NOT NULL DEFAULT 0,
ADD COLUMN     "searchDocument" TEXT,
ADD COLUMN     "shortDescription" TEXT,
ADD COLUMN     "sku" TEXT,
ADD COLUMN     "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "supplierId" TEXT,
ADD COLUMN     "supplierReference" TEXT,
ADD COLUMN     "weightGrams" INTEGER,
ADD COLUMN     "widthMm" INTEGER;

-- AlterTable
ALTER TABLE "Supplier" DROP COLUMN "code",
DROP COLUMN "country",
ADD COLUMN     "email" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "taxId" TEXT;

-- DropTable
DROP TABLE "Asset";

-- DropTable
DROP TABLE "AssetProcessingJob";

-- DropTable
DROP TABLE "AssetVersion";

-- DropTable
DROP TABLE "Catalog";

-- DropTable
DROP TABLE "CatalogProduct";

-- DropTable
DROP TABLE "CatalogProductSnapshot";

-- DropTable
DROP TABLE "CatalogVersion";

-- DropTable
DROP TABLE "ChannelListing";

-- DropTable
DROP TABLE "DetectedProduct";

-- DropTable
DROP TABLE "DetectedProductAsset";

-- DropTable
DROP TABLE "DetectedProductColor";

-- DropTable
DROP TABLE "DetectedProductEvidence";

-- DropTable
DROP TABLE "DetectedProductPrice";

-- DropTable
DROP TABLE "DetectedProductPrintArea";

-- DropTable
DROP TABLE "DocumentCandidate";

-- DropTable
DROP TABLE "DocumentElement";

-- DropTable
DROP TABLE "DocumentEvent";

-- DropTable
DROP TABLE "DocumentJob";

-- DropTable
DROP TABLE "DocumentPage";

-- DropTable
DROP TABLE "EngineMetric";

-- DropTable
DROP TABLE "ExtractionIssue";

-- DropTable
DROP TABLE "Manufacturer";

-- DropTable
DROP TABLE "ProcessingRun";

-- DropTable
DROP TABLE "ProductAsset";

-- DropTable
DROP TABLE "SupplierReference";

-- DropEnum
DROP TYPE "AssetProcessingJobStatus";

-- DropEnum
DROP TYPE "AssetProcessingJobType";

-- DropEnum
DROP TYPE "AssetRole";

-- DropEnum
DROP TYPE "AssetSource";

-- DropEnum
DROP TYPE "AssetStatus";

-- DropEnum
DROP TYPE "AssetType";

-- DropEnum
DROP TYPE "CatalogProductStatus";

-- DropEnum
DROP TYPE "CatalogVersionStatus";

-- DropEnum
DROP TYPE "ChannelListingStatus";

-- DropEnum
DROP TYPE "DetectedProductStatus";

-- DropEnum
DROP TYPE "DocumentCandidateStatus";

-- DropEnum
DROP TYPE "DocumentCandidateType";

-- DropEnum
DROP TYPE "DocumentElementType";

-- DropEnum
DROP TYPE "DocumentEventLevel";

-- DropEnum
DROP TYPE "DocumentJobStage";

-- DropEnum
DROP TYPE "DocumentJobStatus";

-- DropEnum
DROP TYPE "DocumentType";

-- DropEnum
DROP TYPE "ExtractionIssueSeverity";

-- DropEnum
DROP TYPE "ProcessingRunStatus";

-- DropEnum
DROP TYPE "StorageDriver";

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "website" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT,
    "status" "VariantStatus" NOT NULL DEFAULT 'ACTIVE',
    "barcode" TEXT,
    "weightGrams" INTEGER,
    "widthMm" INTEGER,
    "heightMm" INTEGER,
    "depthMm" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Option" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptionValue" (
    "id" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OptionValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariantOptionValue" (
    "variantId" TEXT NOT NULL,
    "optionValueId" TEXT NOT NULL,

    CONSTRAINT "VariantOptionValue_pkey" PRIMARY KEY ("variantId","optionValueId")
);

-- CreateTable
CREATE TABLE "ProductCategory" (
    "productId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("productId","categoryId")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "storageKey" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "altText" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductMedia" (
    "productId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "variantId" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProductMedia_pkey" PRIMARY KEY ("productId","mediaId")
);

-- CreateTable
CREATE TABLE "Attribute" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "dataType" "AttributeDataType" NOT NULL,
    "unit" TEXT,
    "filterable" BOOLEAN NOT NULL DEFAULT true,
    "searchable" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttributeValue" (
    "id" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "numericValue" DECIMAL(18,6),
    "booleanValue" BOOLEAN,
    "colorHex" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttributeValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAttribute" (
    "productId" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "attributeValueId" TEXT,
    "textValue" TEXT,
    "numericValue" DECIMAL(18,6),
    "booleanValue" BOOLEAN,

    CONSTRAINT "ProductAttribute_pkey" PRIMARY KEY ("productId","attributeId")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tagType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductTag" (
    "productId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "weight" DECIMAL(8,4) NOT NULL DEFAULT 1,
    "source" TEXT,

    CONSTRAINT "ProductTag_pkey" PRIMARY KEY ("productId","tagId")
);

-- CreateTable
CREATE TABLE "Audience" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Audience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAudience" (
    "productId" TEXT NOT NULL,
    "audienceId" TEXT NOT NULL,
    "weight" DECIMAL(8,4) NOT NULL DEFAULT 1,

    CONSTRAINT "ProductAudience_pkey" PRIMARY KEY ("productId","audienceId")
);

-- CreateTable
CREATE TABLE "Occasion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Occasion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductOccasion" (
    "productId" TEXT NOT NULL,
    "occasionId" TEXT NOT NULL,
    "weight" DECIMAL(8,4) NOT NULL DEFAULT 1,

    CONSTRAINT "ProductOccasion_pkey" PRIMARY KEY ("productId","occasionId")
);

-- CreateTable
CREATE TABLE "Emotion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Emotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductEmotion" (
    "productId" TEXT NOT NULL,
    "emotionId" TEXT NOT NULL,
    "weight" DECIMAL(8,4) NOT NULL DEFAULT 1,

    CONSTRAINT "ProductEmotion_pkey" PRIMARY KEY ("productId","emotionId")
);

-- CreateTable
CREATE TABLE "Profession" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductProfession" (
    "productId" TEXT NOT NULL,
    "professionId" TEXT NOT NULL,
    "weight" DECIMAL(8,4) NOT NULL DEFAULT 1,

    CONSTRAINT "ProductProfession_pkey" PRIMARY KEY ("productId","professionId")
);

-- CreateTable
CREATE TABLE "Interest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductInterest" (
    "productId" TEXT NOT NULL,
    "interestId" TEXT NOT NULL,
    "weight" DECIMAL(8,4) NOT NULL DEFAULT 1,

    CONSTRAINT "ProductInterest_pkey" PRIMARY KEY ("productId","interestId")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSeason" (
    "productId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "weight" DECIMAL(8,4) NOT NULL DEFAULT 1,

    CONSTRAINT "ProductSeason_pkey" PRIMARY KEY ("productId","seasonId")
);

-- CreateTable
CREATE TABLE "Customization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "CustomizationType" NOT NULL,
    "description" TEXT,
    "configuration" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCustomization" (
    "productId" TEXT NOT NULL,
    "customizationId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "minQuantity" INTEGER,
    "maxQuantity" INTEGER,
    "setupCost" DECIMAL(12,4),
    "unitCost" DECIMAL(12,4),
    "configuration" JSONB,

    CONSTRAINT "ProductCustomization_pkey" PRIMARY KEY ("productId","customizationId")
);

-- CreateTable
CREATE TABLE "SalesChannel" (
    "id" TEXT NOT NULL,
    "code" "ChannelCode" NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceList" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Price" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    "channelId" TEXT,
    "priceListId" TEXT,
    "type" "PriceType" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "amount" DECIMAL(12,4) NOT NULL,
    "minQuantity" INTEGER NOT NULL DEFAULT 1,
    "maxQuantity" INTEGER,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Price_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "location" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "reorderPoint" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "inventoryId" TEXT,
    "type" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reference" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pack" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "minBudget" DECIMAL(12,4),
    "maxBudget" DECIMAL(12,4),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackItem" (
    "packId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "rationale" TEXT,

    CONSTRAINT "PackItem_pkey" PRIMARY KEY ("packId","productId")
);

-- CreateTable
CREATE TABLE "ProductRelation" (
    "id" TEXT NOT NULL,
    "sourceProductId" TEXT NOT NULL,
    "targetProductId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    "weight" DECIMAL(8,4) NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "RuleStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" INTEGER NOT NULL DEFAULT 100,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecommendationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationSession" (
    "id" TEXT NOT NULL,
    "externalUserId" TEXT,
    "status" "RecommendationSessionStatus" NOT NULL DEFAULT 'STARTED',
    "query" TEXT,
    "answers" JSONB,
    "context" JSONB,
    "budgetMin" DECIMAL(12,4),
    "budgetMax" DECIMAL(12,4),
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "RecommendationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationItem" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" DECIMAL(10,6) NOT NULL,
    "explanation" TEXT,
    "factors" JSONB,
    "selected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "productId" TEXT,
    "type" "RecommendationEventType" NOT NULL,
    "value" DECIMAL(12,4),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductEmbedding" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "dimensions" INTEGER NOT NULL,
    "vector" DOUBLE PRECISION[] NOT NULL,
    "contentHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportSource" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "configuration" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "fileName" TEXT,
    "fileUrl" TEXT,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "successRows" INTEGER NOT NULL DEFAULT 0,
    "errorRows" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "log" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportRecord" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "productId" TEXT,
    "externalId" TEXT,
    "status" TEXT NOT NULL,
    "rawData" JSONB NOT NULL,
    "normalizedData" JSONB,
    "errors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE INDEX "Category_active_position_idx" ON "Category"("active", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE INDEX "ProductVariant_status_idx" ON "ProductVariant"("status");

-- CreateIndex
CREATE INDEX "ProductVariant_barcode_idx" ON "ProductVariant"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "Option_slug_key" ON "Option"("slug");

-- CreateIndex
CREATE INDEX "OptionValue_optionId_position_idx" ON "OptionValue"("optionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "OptionValue_optionId_slug_key" ON "OptionValue"("optionId", "slug");

-- CreateIndex
CREATE INDEX "VariantOptionValue_optionValueId_idx" ON "VariantOptionValue"("optionValueId");

-- CreateIndex
CREATE INDEX "ProductCategory_categoryId_isPrimary_idx" ON "ProductCategory"("categoryId", "isPrimary");

-- CreateIndex
CREATE INDEX "ProductMedia_variantId_idx" ON "ProductMedia"("variantId");

-- CreateIndex
CREATE INDEX "ProductMedia_productId_isPrimary_position_idx" ON "ProductMedia"("productId", "isPrimary", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Attribute_slug_key" ON "Attribute"("slug");

-- CreateIndex
CREATE INDEX "AttributeValue_attributeId_idx" ON "AttributeValue"("attributeId");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeValue_attributeId_value_key" ON "AttributeValue"("attributeId", "value");

-- CreateIndex
CREATE INDEX "ProductAttribute_attributeId_idx" ON "ProductAttribute"("attributeId");

-- CreateIndex
CREATE INDEX "ProductAttribute_attributeValueId_idx" ON "ProductAttribute"("attributeValueId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "ProductTag_tagId_weight_idx" ON "ProductTag"("tagId", "weight");

-- CreateIndex
CREATE UNIQUE INDEX "Audience_slug_key" ON "Audience"("slug");

-- CreateIndex
CREATE INDEX "ProductAudience_audienceId_weight_idx" ON "ProductAudience"("audienceId", "weight");

-- CreateIndex
CREATE UNIQUE INDEX "Occasion_slug_key" ON "Occasion"("slug");

-- CreateIndex
CREATE INDEX "ProductOccasion_occasionId_weight_idx" ON "ProductOccasion"("occasionId", "weight");

-- CreateIndex
CREATE UNIQUE INDEX "Emotion_slug_key" ON "Emotion"("slug");

-- CreateIndex
CREATE INDEX "ProductEmotion_emotionId_weight_idx" ON "ProductEmotion"("emotionId", "weight");

-- CreateIndex
CREATE UNIQUE INDEX "Profession_slug_key" ON "Profession"("slug");

-- CreateIndex
CREATE INDEX "ProductProfession_professionId_weight_idx" ON "ProductProfession"("professionId", "weight");

-- CreateIndex
CREATE UNIQUE INDEX "Interest_slug_key" ON "Interest"("slug");

-- CreateIndex
CREATE INDEX "ProductInterest_interestId_weight_idx" ON "ProductInterest"("interestId", "weight");

-- CreateIndex
CREATE UNIQUE INDEX "Season_slug_key" ON "Season"("slug");

-- CreateIndex
CREATE INDEX "ProductSeason_seasonId_weight_idx" ON "ProductSeason"("seasonId", "weight");

-- CreateIndex
CREATE UNIQUE INDEX "Customization_slug_key" ON "Customization"("slug");

-- CreateIndex
CREATE INDEX "ProductCustomization_customizationId_idx" ON "ProductCustomization"("customizationId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesChannel_code_key" ON "SalesChannel"("code");

-- CreateIndex
CREATE INDEX "PriceList_supplierId_active_idx" ON "PriceList"("supplierId", "active");

-- CreateIndex
CREATE INDEX "Price_productId_type_minQuantity_idx" ON "Price"("productId", "type", "minQuantity");

-- CreateIndex
CREATE INDEX "Price_variantId_type_minQuantity_idx" ON "Price"("variantId", "type", "minQuantity");

-- CreateIndex
CREATE INDEX "Price_channelId_idx" ON "Price"("channelId");

-- CreateIndex
CREATE INDEX "Price_priceListId_idx" ON "Price"("priceListId");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_code_key" ON "Warehouse"("code");

-- CreateIndex
CREATE INDEX "Inventory_productId_idx" ON "Inventory"("productId");

-- CreateIndex
CREATE INDEX "Inventory_variantId_idx" ON "Inventory"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_warehouseId_productId_variantId_key" ON "Inventory"("warehouseId", "productId", "variantId");

-- CreateIndex
CREATE INDEX "StockMovement_warehouseId_createdAt_idx" ON "StockMovement"("warehouseId", "createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_inventoryId_idx" ON "StockMovement"("inventoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Pack_slug_key" ON "Pack"("slug");

-- CreateIndex
CREATE INDEX "PackItem_productId_idx" ON "PackItem"("productId");

-- CreateIndex
CREATE INDEX "ProductRelation_targetProductId_relationType_idx" ON "ProductRelation"("targetProductId", "relationType");

-- CreateIndex
CREATE UNIQUE INDEX "ProductRelation_sourceProductId_targetProductId_relationTyp_key" ON "ProductRelation"("sourceProductId", "targetProductId", "relationType");

-- CreateIndex
CREATE INDEX "RecommendationRule_status_priority_idx" ON "RecommendationRule"("status", "priority");

-- CreateIndex
CREATE INDEX "RecommendationSession_externalUserId_idx" ON "RecommendationSession"("externalUserId");

-- CreateIndex
CREATE INDEX "RecommendationSession_status_startedAt_idx" ON "RecommendationSession"("status", "startedAt");

-- CreateIndex
CREATE INDEX "RecommendationItem_sessionId_rank_idx" ON "RecommendationItem"("sessionId", "rank");

-- CreateIndex
CREATE INDEX "RecommendationItem_productId_idx" ON "RecommendationItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationItem_sessionId_productId_key" ON "RecommendationItem"("sessionId", "productId");

-- CreateIndex
CREATE INDEX "RecommendationEvent_sessionId_createdAt_idx" ON "RecommendationEvent"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "RecommendationEvent_productId_type_idx" ON "RecommendationEvent"("productId", "type");

-- CreateIndex
CREATE INDEX "ProductEmbedding_contentHash_idx" ON "ProductEmbedding"("contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "ProductEmbedding_productId_provider_model_key" ON "ProductEmbedding"("productId", "provider", "model");

-- CreateIndex
CREATE INDEX "ImportJob_sourceId_status_idx" ON "ImportJob"("sourceId", "status");

-- CreateIndex
CREATE INDEX "ImportRecord_jobId_status_idx" ON "ImportRecord"("jobId", "status");

-- CreateIndex
CREATE INDEX "ImportRecord_externalId_idx" ON "ImportRecord"("externalId");

-- CreateIndex
CREATE INDEX "ImportRecord_productId_idx" ON "ImportRecord"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_supplierId_idx" ON "Product"("supplierId");

-- CreateIndex
CREATE INDEX "Product_brandId_idx" ON "Product"("brandId");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "Product_customizable_idx" ON "Product"("customizable");

-- CreateIndex
CREATE INDEX "Product_featured_idx" ON "Product"("featured");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- CreateIndex
CREATE INDEX "Product_supplierReference_idx" ON "Product"("supplierReference");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_slug_key" ON "Supplier"("slug");

-- CreateIndex
CREATE INDEX "Supplier_active_idx" ON "Supplier"("active");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptionValue" ADD CONSTRAINT "OptionValue_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "Option"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantOptionValue" ADD CONSTRAINT "VariantOptionValue_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantOptionValue" ADD CONSTRAINT "VariantOptionValue_optionValueId_fkey" FOREIGN KEY ("optionValueId") REFERENCES "OptionValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMedia" ADD CONSTRAINT "ProductMedia_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMedia" ADD CONSTRAINT "ProductMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMedia" ADD CONSTRAINT "ProductMedia_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttributeValue" ADD CONSTRAINT "AttributeValue_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "Attribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAttribute" ADD CONSTRAINT "ProductAttribute_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAttribute" ADD CONSTRAINT "ProductAttribute_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "Attribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAttribute" ADD CONSTRAINT "ProductAttribute_attributeValueId_fkey" FOREIGN KEY ("attributeValueId") REFERENCES "AttributeValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTag" ADD CONSTRAINT "ProductTag_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTag" ADD CONSTRAINT "ProductTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAudience" ADD CONSTRAINT "ProductAudience_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAudience" ADD CONSTRAINT "ProductAudience_audienceId_fkey" FOREIGN KEY ("audienceId") REFERENCES "Audience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductOccasion" ADD CONSTRAINT "ProductOccasion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductOccasion" ADD CONSTRAINT "ProductOccasion_occasionId_fkey" FOREIGN KEY ("occasionId") REFERENCES "Occasion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductEmotion" ADD CONSTRAINT "ProductEmotion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductEmotion" ADD CONSTRAINT "ProductEmotion_emotionId_fkey" FOREIGN KEY ("emotionId") REFERENCES "Emotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductProfession" ADD CONSTRAINT "ProductProfession_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductProfession" ADD CONSTRAINT "ProductProfession_professionId_fkey" FOREIGN KEY ("professionId") REFERENCES "Profession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInterest" ADD CONSTRAINT "ProductInterest_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInterest" ADD CONSTRAINT "ProductInterest_interestId_fkey" FOREIGN KEY ("interestId") REFERENCES "Interest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSeason" ADD CONSTRAINT "ProductSeason_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSeason" ADD CONSTRAINT "ProductSeason_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCustomization" ADD CONSTRAINT "ProductCustomization_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCustomization" ADD CONSTRAINT "ProductCustomization_customizationId_fkey" FOREIGN KEY ("customizationId") REFERENCES "Customization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceList" ADD CONSTRAINT "PriceList_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Price" ADD CONSTRAINT "Price_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Price" ADD CONSTRAINT "Price_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Price" ADD CONSTRAINT "Price_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "SalesChannel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Price" ADD CONSTRAINT "Price_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "PriceList"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackItem" ADD CONSTRAINT "PackItem_packId_fkey" FOREIGN KEY ("packId") REFERENCES "Pack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackItem" ADD CONSTRAINT "PackItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductRelation" ADD CONSTRAINT "ProductRelation_sourceProductId_fkey" FOREIGN KEY ("sourceProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductRelation" ADD CONSTRAINT "ProductRelation_targetProductId_fkey" FOREIGN KEY ("targetProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationItem" ADD CONSTRAINT "RecommendationItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "RecommendationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationItem" ADD CONSTRAINT "RecommendationItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationEvent" ADD CONSTRAINT "RecommendationEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "RecommendationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductEmbedding" ADD CONSTRAINT "ProductEmbedding_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportSource" ADD CONSTRAINT "ImportSource_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ImportSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRecord" ADD CONSTRAINT "ImportRecord_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRecord" ADD CONSTRAINT "ImportRecord_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
