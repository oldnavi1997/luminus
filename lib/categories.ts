import type { Category } from "@/app/generated/prisma/client";

export function flattenCategoryHierarchy<T extends Pick<Category, "id" | "parentId">>(
  categories: T[]
): T[] {
  const byParent = new Map<string | null, T[]>();
  const ids = new Set<string>();

  for (const cat of categories) {
    ids.add(cat.id);
  }

  for (const cat of categories) {
    const key = cat.parentId && ids.has(cat.parentId) ? cat.parentId : null;
    const bucket = byParent.get(key);
    if (bucket) bucket.push(cat);
    else byParent.set(key, [cat]);
  }

  const result: T[] = [];
  const visit = (parentId: string | null) => {
    const children = byParent.get(parentId);
    if (!children) return;
    for (const child of children) {
      result.push(child);
      visit(child.id);
    }
  };
  visit(null);
  return result;
}
