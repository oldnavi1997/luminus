-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "showsBlueLight" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "blueLightPrice" DECIMAL(10,2);
