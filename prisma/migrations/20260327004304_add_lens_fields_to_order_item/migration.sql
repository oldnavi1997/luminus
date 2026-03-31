-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "lensPrice" DECIMAL(10,2),
ADD COLUMN     "lensPriceRange" TEXT,
ADD COLUMN     "lensSubType" TEXT,
ADD COLUMN     "lensType" TEXT,
ADD COLUMN     "lensVariant" TEXT,
ADD COLUMN     "prescription" JSONB,
ADD COLUMN     "prescriptionUrl" TEXT;
