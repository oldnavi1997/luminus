-- CreateTable
CREATE TABLE "sale_document_envios" (
    "id" TEXT NOT NULL,
    "saleDocumentId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipoDocumento" TEXT,
    "numeroDocumento" TEXT,
    "celular" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "courier" TEXT NOT NULL,
    "modalidad" TEXT NOT NULL DEFAULT 'AGENCIA',
    "destino" TEXT NOT NULL,
    "mercaderia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sale_document_envios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sale_document_envios_saleDocumentId_key" ON "sale_document_envios"("saleDocumentId");

-- AddForeignKey
ALTER TABLE "sale_document_envios" ADD CONSTRAINT "sale_document_envios_saleDocumentId_fkey" FOREIGN KEY ("saleDocumentId") REFERENCES "SaleDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
