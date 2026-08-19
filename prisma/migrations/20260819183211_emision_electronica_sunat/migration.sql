-- CreateEnum
CREATE TYPE "TipoEnvioSunat" AS ENUM ('INDIVIDUAL', 'RESUMEN_DIARIO', 'COMUNICACION_BAJA');

-- CreateEnum
CREATE TYPE "EstadoEnvioSunat" AS ENUM ('PENDIENTE', 'GENERADO', 'ENVIADO', 'ACEPTADO', 'ACEPTADO_CON_OBSERVACIONES', 'RECHAZADO', 'ERROR_ENVIO');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DocumentStatus" ADD VALUE 'ACCEPTED_WITH_OBSERVATIONS';
ALTER TYPE "DocumentStatus" ADD VALUE 'SEND_ERROR';

-- CreateTable
CREATE TABLE "SunatEnvio" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "tipoEnvio" "TipoEnvioSunat" NOT NULL DEFAULT 'INDIVIDUAL',
    "estado" "EstadoEnvioSunat" NOT NULL DEFAULT 'PENDIENTE',
    "nombreArchivo" TEXT NOT NULL,
    "xmlFirmado" TEXT NOT NULL,
    "hashXml" TEXT,
    "ticketId" TEXT,
    "cdrXml" TEXT,
    "codigoRespuesta" TEXT,
    "mensajeRespuesta" TEXT,
    "observaciones" TEXT[],
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "ultimoError" TEXT,
    "emitidoPorId" TEXT,
    "enviadoAt" TIMESTAMP(3),
    "respondidoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SunatEnvio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SunatTicket" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "fechaReferencia" DATE NOT NULL,
    "correlativo" INTEGER NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "xmlFirmado" TEXT NOT NULL,
    "ticket" TEXT,
    "estado" "EstadoEnvioSunat" NOT NULL DEFAULT 'PENDIENTE',
    "cdrXml" TEXT,
    "codigoRespuesta" TEXT,
    "mensajeRespuesta" TEXT,
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "ultimoError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resueltoAt" TIMESTAMP(3),

    CONSTRAINT "SunatTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SunatEnvio_documentId_idx" ON "SunatEnvio"("documentId");

-- CreateIndex
CREATE INDEX "SunatEnvio_estado_idx" ON "SunatEnvio"("estado");

-- CreateIndex
CREATE INDEX "SunatEnvio_createdAt_idx" ON "SunatEnvio"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SunatTicket_ticket_key" ON "SunatTicket"("ticket");

-- CreateIndex
CREATE INDEX "SunatTicket_estado_idx" ON "SunatTicket"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "SunatTicket_tipo_fechaReferencia_correlativo_key" ON "SunatTicket"("tipo", "fechaReferencia", "correlativo");

-- AddForeignKey
ALTER TABLE "SunatEnvio" ADD CONSTRAINT "SunatEnvio_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "SaleDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SunatEnvio" ADD CONSTRAINT "SunatEnvio_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SunatTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SunatEnvio" ADD CONSTRAINT "SunatEnvio_emitidoPorId_fkey" FOREIGN KEY ("emitidoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
