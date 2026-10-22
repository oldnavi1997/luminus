-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "stockMinimo" INTEGER;

-- CreateTable
CREATE TABLE "PosConfig" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "stockMinimo" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PosConfig_pkey" PRIMARY KEY ("id")
);
