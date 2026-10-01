import { prisma } from "@/lib/prisma";
import { filtroDeLuna, lunaDeCategoria } from "@/lib/listado";
import { CategoryGridCarousel } from "./CategoryGridCarousel";
import { ProductCard } from "@/components/catalog/ProductCard";

interface Props {
  categorySlug: string;
  label?: string;
}

/**
 * Los modelos de una categoría en una fila deslizable, igual que se ven en su
 * listado: si la categoría muestra una luna puesta (Fotocromáticos, Blue
 * Light), las tarjetas salen con esa luna y sólo los modelos que la venden.
 * Sin la categoría o sin productos no se muestra nada.
 */
export async function CategoriaDeslizable({ categorySlug, label = "Colección" }: Props) {
  const category = await prisma.category.findUnique({
    where: { slug: categorySlug },
    select: { name: true, showsPhotochromic: true, showsBlueLight: true },
  });
  if (!category) return null;

  const luna = lunaDeCategoria(category);
  const products = await prisma.product.findMany({
    where: {
      active: true,
      images: { isEmpty: false },
      categories: { some: { slug: categorySlug } },
      ...filtroDeLuna(luna),
    },
    include: { categories: true },
    take: 12,
    orderBy: { createdAt: "desc" },
  });
  if (products.length === 0) return null;

  return (
    <section className="bg-white">
      <CategoryGridCarousel categorySlug={categorySlug} categoryName={category.name} label={label}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} view="normal" luna={luna} />
        ))}
      </CategoryGridCarousel>
    </section>
  );
}
