-- CreateEnum
CREATE TYPE "AccesorioVenta" AS ENUM ('ESTUCHE', 'LIQUIDO');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoMovimientoStock" ADD VALUE 'ACCESORIO_POS';
ALTER TYPE "TipoMovimientoStock" ADD VALUE 'ANULACION_ACCESORIO_POS';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "accesorioVenta" "AccesorioVenta",
ADD COLUMN     "incluyeEstuche" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "incluyeLiquido" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "StockMovimiento" ADD COLUMN     "saleDocumentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Product_accesorioVenta_key" ON "Product"("accesorioVenta");

-- CreateIndex
CREATE INDEX "StockMovimiento_saleDocumentId_idx" ON "StockMovimiento"("saleDocumentId");

-- AddForeignKey
ALTER TABLE "StockMovimiento" ADD CONSTRAINT "StockMovimiento_saleDocumentId_fkey" FOREIGN KEY ("saleDocumentId") REFERENCES "SaleDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Backfill: el estuche acompaña a lo que tiene inventario (monturas). Las
-- lunas, servicios y consumibles van sin control de inventario y no lo llevan.
UPDATE "Product" SET "incluyeEstuche" = false WHERE "trackInventory" = false;
