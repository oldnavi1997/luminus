-- CreateTable: join table for M2M Product <-> Category
CREATE TABLE "_ProductCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductCategories_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ProductCategories_B_index" ON "_ProductCategories"("B");

-- AddForeignKey
ALTER TABLE "_ProductCategories" ADD CONSTRAINT "_ProductCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductCategories" ADD CONSTRAINT "_ProductCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing categoryId data into the join table
INSERT INTO "_ProductCategories" ("A", "B")
SELECT "categoryId", "id" FROM "Product" WHERE "categoryId" IS NOT NULL;

-- AlterTable: add primaryCategoryId, populate from categoryId, then drop categoryId
ALTER TABLE "Product" ADD COLUMN "primaryCategoryId" TEXT;
UPDATE "Product" SET "primaryCategoryId" = "categoryId";
ALTER TABLE "Product" DROP COLUMN "categoryId";
