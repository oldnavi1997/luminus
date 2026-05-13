-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('BOLETA', 'FACTURA', 'NOTA_VENTA');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'PENDING', 'ACCEPTED', 'REJECTED', 'VOIDED', 'VOID_PENDING', 'PARTIAL');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('EFECTIVO', 'TARJETA', 'YAPE', 'MIXTO');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('OPEN', 'CLOSED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'CASHIER';
ALTER TYPE "Role" ADD VALUE 'SUPERVISOR';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "documentNumber" TEXT,
ADD COLUMN     "documentType" TEXT,
ADD COLUMN     "shippingCourier" TEXT,
ALTER COLUMN "shippingCountry" SET DEFAULT 'Perú';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "sku" TEXT,
ADD COLUMN     "stockAlmacen" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stockTienda" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "storePrice" DECIMAL(10,2),
ADD COLUMN     "trackInventory" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "PosSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'OPEN',
    "openingBalance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "closingBalance" DECIMAL(10,2),
    "totalEfectivo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalTarjeta" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalYape" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalVentas" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "countVentas" INTEGER NOT NULL DEFAULT 0,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "PosSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "docType" TEXT NOT NULL DEFAULT 'DNI',
    "docNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentSerie" (
    "id" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "serie" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentSerie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleDocument" (
    "id" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "serie" TEXT NOT NULL,
    "correlativo" INTEGER NOT NULL,
    "fullNumber" TEXT NOT NULL,
    "posSessionId" TEXT,
    "cashierId" TEXT NOT NULL,
    "customerId" TEXT,
    "buyerDocType" TEXT,
    "buyerDocNumber" TEXT,
    "buyerName" TEXT,
    "buyerAddress" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "igv" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "montoRecibido" DECIMAL(10,2),
    "cambio" DECIMAL(10,2),
    "montoAdelanto" DECIMAL(10,2),
    "montoEfectivo" DECIMAL(10,2),
    "montoTarjeta" DECIMAL(10,2),
    "montoYape" DECIMAL(10,2),
    "location" TEXT NOT NULL DEFAULT 'TIENDA',
    "notes" TEXT,
    "saldoCobradoPorId" TEXT,
    "saldoCobradoEn" TIMESTAMP(3),
    "saldoPaymentMethod" "PaymentMethod",
    "saldoMontoEfectivo" DECIMAL(10,2),
    "saldoMontoTarjeta" DECIMAL(10,2),
    "saldoMontoYape" DECIMAL(10,2),
    "buyerPhone" TEXT,
    "prescription" JSONB,
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "nubefactId" TEXT,
    "nubefactResponse" JSONB,
    "pdfUrl" TEXT,
    "xmlUrl" TEXT,
    "qrCode" TEXT,
    "sunatCdrCode" TEXT,
    "sunatCdrDesc" TEXT,
    "voidReason" TEXT,
    "voidedAt" TIMESTAMP(3),
    "voidCdrCode" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastRetryAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaleDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleDocumentItem" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCode" TEXT NOT NULL DEFAULT 'NIU',
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "igvAmount" DECIMAL(10,2) NOT NULL,
    "lineTotal" DECIMAL(10,2) NOT NULL,
    "lensType" TEXT,
    "lensSubType" TEXT,
    "lensVariant" TEXT,
    "lensPrice" DECIMAL(10,2),

    CONSTRAINT "SaleDocumentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CajaConfig" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "nextOpeningOverride" DECIMAL(10,2),
    "lastRetiroAt" TIMESTAMP(3),
    "lastRetiroFondo" DECIMAL(10,2),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CajaConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CajaRetiro" (
    "id" TEXT NOT NULL,
    "montoRetirado" DECIMAL(10,2) NOT NULL,
    "fondoQueQueda" DECIMAL(10,2) NOT NULL,
    "location" TEXT NOT NULL DEFAULT 'TIENDA',
    "registradoBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CajaRetiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentQueue" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "nextRetryAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lens_catalog" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "nota" TEXT,
    "ar16" DECIMAL(10,2),
    "arsy" DECIMAL(10,2),
    "arshapire" DECIMAL(10,2),
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "lens_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lunas_sin_medida" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "lunas_sin_medida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fabrication_costs" (
    "id" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "cost_od" DECIMAL(10,2) NOT NULL,
    "cost_oi" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "fabrication_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarifas_luna" (
    "id" SERIAL NOT NULL,
    "esf_min" DECIMAL(4,2) NOT NULL,
    "esf_max" DECIMAL(4,2) NOT NULL,
    "cil_min" DECIMAL(4,2) NOT NULL,
    "cil_max" DECIMAL(4,2) NOT NULL,
    "poli" DECIMAL(6,2) NOT NULL,
    "foto" DECIMAL(6,2) NOT NULL,

    CONSTRAINT "tarifas_luna_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PosSession_status_idx" ON "PosSession"("status");

-- CreateIndex
CREATE INDEX "PosSession_userId_status_idx" ON "PosSession"("userId", "status");

-- CreateIndex
CREATE INDEX "Customer_docNumber_idx" ON "Customer"("docNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_docType_docNumber_key" ON "Customer"("docType", "docNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentSerie_type_serie_key" ON "DocumentSerie"("type", "serie");

-- CreateIndex
CREATE UNIQUE INDEX "SaleDocument_fullNumber_key" ON "SaleDocument"("fullNumber");

-- CreateIndex
CREATE INDEX "SaleDocument_type_serie_correlativo_idx" ON "SaleDocument"("type", "serie", "correlativo");

-- CreateIndex
CREATE INDEX "SaleDocument_status_idx" ON "SaleDocument"("status");

-- CreateIndex
CREATE INDEX "SaleDocument_cashierId_idx" ON "SaleDocument"("cashierId");

-- CreateIndex
CREATE INDEX "SaleDocument_posSessionId_idx" ON "SaleDocument"("posSessionId");

-- CreateIndex
CREATE INDEX "SaleDocument_buyerDocNumber_idx" ON "SaleDocument"("buyerDocNumber");

-- CreateIndex
CREATE INDEX "SaleDocumentItem_documentId_idx" ON "SaleDocumentItem"("documentId");

-- CreateIndex
CREATE INDEX "CajaRetiro_createdAt_idx" ON "CajaRetiro"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentQueue_documentId_key" ON "DocumentQueue"("documentId");

-- AddForeignKey
ALTER TABLE "PosSession" ADD CONSTRAINT "PosSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleDocument" ADD CONSTRAINT "SaleDocument_posSessionId_fkey" FOREIGN KEY ("posSessionId") REFERENCES "PosSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleDocument" ADD CONSTRAINT "SaleDocument_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleDocument" ADD CONSTRAINT "SaleDocument_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleDocument" ADD CONSTRAINT "SaleDocument_saldoCobradoPorId_fkey" FOREIGN KEY ("saldoCobradoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleDocumentItem" ADD CONSTRAINT "SaleDocumentItem_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "SaleDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleDocumentItem" ADD CONSTRAINT "SaleDocumentItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CajaRetiro" ADD CONSTRAINT "CajaRetiro_registradoBy_fkey" FOREIGN KEY ("registradoBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

