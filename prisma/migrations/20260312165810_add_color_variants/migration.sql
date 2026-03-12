-- CreateTable
CREATE TABLE "ProductColorVariant" (
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,

    CONSTRAINT "ProductColorVariant_pkey" PRIMARY KEY ("productId","variantId")
);

-- AddForeignKey
ALTER TABLE "ProductColorVariant" ADD CONSTRAINT "ProductColorVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductColorVariant" ADD CONSTRAINT "ProductColorVariant_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
