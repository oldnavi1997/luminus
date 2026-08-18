-- AlterTable
-- Marca que los datos del comprador ya fueron asentados (resueltos contra la API
-- de documentos o corregidos a mano). El lote del POS ignora los que la tengan.
ALTER TABLE "SaleDocument" ADD COLUMN     "buyerResolvedAt" TIMESTAMP(3);
