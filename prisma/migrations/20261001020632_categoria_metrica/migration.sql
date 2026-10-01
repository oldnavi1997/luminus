-- CreateTable
CREATE TABLE "CategoriaMetrica" (
    "dia" DATE NOT NULL,
    "categoryId" TEXT NOT NULL,
    "evento" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CategoriaMetrica_pkey" PRIMARY KEY ("dia","categoryId","evento")
);

-- AddForeignKey
ALTER TABLE "CategoriaMetrica" ADD CONSTRAINT "CategoriaMetrica_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
