-- CreateTable
CREATE TABLE "CatalogBanner" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT,
    "imageUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogBanner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CatalogBanner_categoryId_key" ON "CatalogBanner"("categoryId");

-- AddForeignKey
ALTER TABLE "CatalogBanner" ADD CONSTRAINT "CatalogBanner_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
