-- CreateTable
CREATE TABLE "PedidoCompartido" (
    "id" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "createdById" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PedidoCompartido_pkey" PRIMARY KEY ("id")
);
