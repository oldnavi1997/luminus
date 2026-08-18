-- AlterEnum
-- Nuevos tipos de movimiento para las salidas/reingresos originados en el ecommerce.
ALTER TYPE "TipoMovimientoStock" ADD VALUE 'VENTA_WEB';
ALTER TYPE "TipoMovimientoStock" ADD VALUE 'ANULACION_WEB';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "stockDeducted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stockIssue" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "qtyFromAlmacen" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "qtyFromTienda" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SaleDocument" ADD COLUMN     "channel" TEXT NOT NULL DEFAULT 'POS',
ADD COLUMN     "orderId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "SaleDocument_orderId_key" ON "SaleDocument"("orderId");

-- CreateIndex
CREATE INDEX "SaleDocument_channel_createdAt_idx" ON "SaleDocument"("channel", "createdAt");

-- AddForeignKey
ALTER TABLE "SaleDocument" ADD CONSTRAINT "SaleDocument_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
