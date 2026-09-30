-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "showsPhotochromic" BOOLEAN NOT NULL DEFAULT false;

-- Hasta ahora el comportamiento dependía del slug: la categoría que ya lo tenía
-- lo conserva. En una base sin esa categoría no toca nada.
UPDATE "Category" SET "showsPhotochromic" = true WHERE "slug" = 'fotocromaticos';
