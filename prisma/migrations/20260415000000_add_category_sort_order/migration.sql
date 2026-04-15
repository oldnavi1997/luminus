-- AlterTable
ALTER TABLE "Category" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Initialize sortOrder based on current alphabetical order within each parent group
WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE("parentId", '')
      ORDER BY name
    ) - 1 AS rn
  FROM "Category"
)
UPDATE "Category" c
SET "sortOrder" = r.rn
FROM ranked r
WHERE c.id = r.id;
