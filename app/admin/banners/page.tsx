import { prisma } from "@/lib/prisma";
import { BannerEditor } from "@/components/admin/BannerEditor";

export const metadata = { title: "Banners | Admin" };
export const dynamic = "force-dynamic";

const SELECT_BANNER = {
  imageUrl: true,
  mobileImageUrl: true,
  title: true,
  text: true,
  active: true,
} as const;

export default async function AdminBannersPage() {
  const [todo, categorias] = await Promise.all([
    prisma.catalogBanner.findFirst({ where: { categoryId: null }, select: SELECT_BANNER }),
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        parent: { select: { name: true } },
        banner: { select: SELECT_BANNER },
      },
    }),
  ]);

  // Como el menú: cada categoría raíz y debajo sus hijas, cada grupo en su orden.
  const hijas = (id: string | null) => categorias.filter((c) => c.parentId === id);
  const ordenadas = hijas(null).flatMap((raiz) => [raiz, ...hijas(raiz.id)]);
  // Las de más de dos niveles, o con un padre que ya no existe, al final.
  const sueltas = categorias.filter((c) => !ordenadas.includes(c));

  return (
    <div>
      <div className="mb-8">
        <p className="text-[9px] font-medium text-[#d4af37] uppercase tracking-[0.3em] mb-2">
          Catálogo
        </p>
        <h1
          className="text-2xl font-light text-[#111111]"
          style={{ fontFamily: "var(--font-inter, sans-serif)" }}
        >
          Banners
        </h1>
        <p className="mt-2 text-sm text-[#111111]/50 max-w-xl">
          La franja de imagen y texto que va arriba de cada listado. Una categoría
          sin franja muestra los productos directamente.
        </p>
      </div>

      <div className="space-y-2">
        <BannerEditor categoryId={null} nombre="Ver todo" href="/lentes" inicial={todo} />
        {[...ordenadas, ...sueltas].map((c) => (
          <BannerEditor
            key={c.id}
            categoryId={c.id}
            nombre={c.parent ? `${c.parent.name} › ${c.name}` : c.name}
            href={`/lentes?category=${c.slug}`}
            inicial={c.banner}
          />
        ))}
      </div>
    </div>
  );
}
