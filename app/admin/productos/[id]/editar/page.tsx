import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/ProductForm";
import { ColorVariantProduct } from "@/types";

export const metadata = { title: "Editar producto | Admin" };

const variantSelect = {
  id: true,
  name: true,
  slug: true,
  frameColor: true,
  images: true,
  active: true,
} as const;

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [rawProduct, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        colorVariants: { select: { variant: { select: variantSelect } } },
        isVariantOf: { select: { product: { select: variantSelect } } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!rawProduct) notFound();

  const seen = new Set<string>();
  const variants: ColorVariantProduct[] = [
    ...rawProduct.colorVariants.map((cv) => cv.variant),
    ...rawProduct.isVariantOf.map((cv) => cv.product),
  ].filter((v) => {
    if (seen.has(v.id)) return false;
    seen.add(v.id);
    return true;
  });

  const { colorVariants: _cv, isVariantOf: _iv, ...productRest } = rawProduct;
  const product = JSON.parse(JSON.stringify({ ...productRest, variants }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#111111] mb-6">Editar producto</h1>
      <ProductForm categories={categories} product={product} />
    </div>
  );
}
