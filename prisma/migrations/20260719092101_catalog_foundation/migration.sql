/*
  Warnings:

  - The values [IMPORTED,REVIEW,APPROVED,BLOCKED] on the enum `ProductStatus` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `Product` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `active` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `aiAttributes` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `brand` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `defaultCurrency` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `dimensionsRaw` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `materialSummary` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `searchMetadata` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `shortDescription` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `sku` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `weightGrams` on the `Product` table. All the data in the column will be lost.
  - The primary key for the `ProductVariant` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `colorCode` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `colorName` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `ean` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `sizeCode` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `sizeName` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `supplierReference` on the `ProductVariant` table. All the data in the column will be lost.
  - The primary key for the `Supplier` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `countryCode` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the column `defaultCurrency` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `Supplier` table. All the data in the column will be lost.
  - The primary key for the `SupplierCatalog` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `fileHash` on the `SupplierCatalog` table. All the data in the column will be lost.
  - You are about to drop the column `importedAt` on the `SupplierCatalog` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `SupplierCatalog` table. All the data in the column will be lost.
  - You are about to drop the column `sourceName` on the `SupplierCatalog` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `SupplierCatalog` table. All the data in the column will be lost.
  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChannelListing` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ImportItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ImportJob` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MediaAsset` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductMedia` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductTranslation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SupplierPrice` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SupplierProduct` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[internalSku]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[supplierId,supplierSku]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Supplier` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `internalSku` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `ProductVariant` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `code` to the `Supplier` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `sourceType` on the `SupplierCatalog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "CatalogSourceType" AS ENUM ('CSV', 'XLSX', 'XML', 'JSON', 'ZIP', 'HTTP', 'FTP', 'SFTP', 'MANUAL');

-- AlterEnum
BEGIN;
CREATE TYPE "ProductStatus_new" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED');
ALTER TABLE "public"."Product" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Product" ALTER COLUMN "status" TYPE "ProductStatus_new" USING ("status"::text::"ProductStatus_new");
ALTER TYPE "ProductStatus" RENAME TO "ProductStatus_old";
ALTER TYPE "ProductStatus_new" RENAME TO "ProductStatus";
DROP TYPE "public"."ProductStatus_old";
ALTER TABLE "Product" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_parentId_fkey";

-- DropForeignKey
ALTER TABLE "ChannelListing" DROP CONSTRAINT "ChannelListing_productId_fkey";

-- DropForeignKey
ALTER TABLE "ImportItem" DROP CONSTRAINT "ImportItem_importJobId_fkey";

-- DropForeignKey
ALTER TABLE "ImportItem" DROP CONSTRAINT "ImportItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "ImportJob" DROP CONSTRAINT "ImportJob_supplierCatalogId_fkey";

-- DropForeignKey
ALTER TABLE "ProductCategory" DROP CONSTRAINT "ProductCategory_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "ProductCategory" DROP CONSTRAINT "ProductCategory_productId_fkey";

-- DropForeignKey
ALTER TABLE "ProductMedia" DROP CONSTRAINT "ProductMedia_mediaAssetId_fkey";

-- DropForeignKey
ALTER TABLE "ProductMedia" DROP CONSTRAINT "ProductMedia_productId_fkey";

-- DropForeignKey
ALTER TABLE "ProductTranslation" DROP CONSTRAINT "ProductTranslation_productId_fkey";

-- DropForeignKey
ALTER TABLE "ProductVariant" DROP CONSTRAINT "ProductVariant_productId_fkey";

-- DropForeignKey
ALTER TABLE "SupplierCatalog" DROP CONSTRAINT "SupplierCatalog_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "SupplierPrice" DROP CONSTRAINT "SupplierPrice_supplierProductId_fkey";

-- DropForeignKey
ALTER TABLE "SupplierProduct" DROP CONSTRAINT "SupplierProduct_productId_fkey";

-- DropForeignKey
ALTER TABLE "SupplierProduct" DROP CONSTRAINT "SupplierProduct_supplierId_fkey";

-- DropIndex
DROP INDEX "Product_active_idx";

-- DropIndex
DROP INDEX "Product_brand_idx";

-- DropIndex
DROP INDEX "Product_sku_key";

-- DropIndex
DROP INDEX "Product_slug_key";

-- DropIndex
DROP INDEX "ProductVariant_active_idx";

-- DropIndex
DROP INDEX "ProductVariant_colorName_idx";

-- DropIndex
DROP INDEX "ProductVariant_ean_key";

-- DropIndex
DROP INDEX "ProductVariant_sizeName_idx";

-- DropIndex
DROP INDEX "Supplier_name_key";

-- DropIndex
DROP INDEX "Supplier_slug_key";

-- DropIndex
DROP INDEX "SupplierCatalog_fileHash_key";

-- DropIndex
DROP INDEX "SupplierCatalog_importedAt_idx";

-- AlterTable
ALTER TABLE "Product" DROP CONSTRAINT "Product_pkey",
DROP COLUMN "active",
DROP COLUMN "aiAttributes",
DROP COLUMN "brand",
DROP COLUMN "defaultCurrency",
DROP COLUMN "dimensionsRaw",
DROP COLUMN "materialSummary",
DROP COLUMN "searchMetadata",
DROP COLUMN "shortDescription",
DROP COLUMN "sku",
DROP COLUMN "slug",
DROP COLUMN "weightGrams",
ADD COLUMN     "internalSku" TEXT NOT NULL,
ADD COLUMN     "supplierId" TEXT,
ADD COLUMN     "supplierSku" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "name" SET DATA TYPE TEXT,
ADD CONSTRAINT "Product_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Product_id_seq";

-- AlterTable
ALTER TABLE "ProductVariant" DROP CONSTRAINT "ProductVariant_pkey",
DROP COLUMN "colorCode",
DROP COLUMN "colorName",
DROP COLUMN "ean",
DROP COLUMN "sizeCode",
DROP COLUMN "sizeName",
DROP COLUMN "supplierReference",
ADD COLUMN     "costPrice" DECIMAL(12,4),
ADD COLUMN     "salePrice" DECIMAL(12,4),
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "productId" SET DATA TYPE TEXT,
ALTER COLUMN "sku" SET DATA TYPE TEXT,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "name" SET DATA TYPE TEXT,
ADD CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "ProductVariant_id_seq";

-- AlterTable
ALTER TABLE "Supplier" DROP CONSTRAINT "Supplier_pkey",
DROP COLUMN "countryCode",
DROP COLUMN "defaultCurrency",
DROP COLUMN "slug",
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "legalName" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "taxId" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "name" SET DATA TYPE TEXT,
ALTER COLUMN "website" SET DATA TYPE TEXT,
ADD CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Supplier_id_seq";

-- AlterTable
ALTER TABLE "SupplierCatalog" DROP CONSTRAINT "SupplierCatalog_pkey",
DROP COLUMN "fileHash",
DROP COLUMN "importedAt",
DROP COLUMN "metadata",
DROP COLUMN "sourceName",
DROP COLUMN "version",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastSyncAt" TIMESTAMP(3),
ADD COLUMN     "sourceUrl" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "supplierId" SET DATA TYPE TEXT,
ALTER COLUMN "name" SET DATA TYPE TEXT,
DROP COLUMN "sourceType",
ADD COLUMN     "sourceType" "CatalogSourceType" NOT NULL,
ADD CONSTRAINT "SupplierCatalog_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "SupplierCatalog_id_seq";

-- DropTable
DROP TABLE "AuditLog";

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "ChannelListing";

-- DropTable
DROP TABLE "ImportItem";

-- DropTable
DROP TABLE "ImportJob";

-- DropTable
DROP TABLE "MediaAsset";

-- DropTable
DROP TABLE "ProductCategory";

-- DropTable
DROP TABLE "ProductMedia";

-- DropTable
DROP TABLE "ProductTranslation";

-- DropTable
DROP TABLE "SupplierPrice";

-- DropTable
DROP TABLE "SupplierProduct";

-- DropEnum
DROP TYPE "ChannelType";

-- DropEnum
DROP TYPE "ImportItemStatus";

-- DropEnum
DROP TYPE "ImportStatus";

-- DropEnum
DROP TYPE "MediaType";

-- DropEnum
DROP TYPE "SyncStatus";

-- CreateIndex
CREATE UNIQUE INDEX "Product_internalSku_key" ON "Product"("internalSku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_supplierId_supplierSku_key" ON "Product"("supplierId", "supplierSku");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_code_key" ON "Supplier"("code");

-- CreateIndex
CREATE INDEX "Supplier_name_idx" ON "Supplier"("name");

-- AddForeignKey
ALTER TABLE "SupplierCatalog" ADD CONSTRAINT "SupplierCatalog_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
