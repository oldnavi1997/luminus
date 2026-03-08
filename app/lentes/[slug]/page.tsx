import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ImageGallery } from "@/components/product/ImageGallery";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { Badge } from "@/components/ui/Badge";
import { formatARS } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  });
  if (!product) return { title: "Producto no encontrado" };

  return {
    title: product.name,
    description: product.description || `${product.name} – ${product.category.name}`,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug, active: true },
    include: { category: true },
  });

  if (!product) notFound();

  const hasDiscount = product.comparePrice && Number(product.comparePrice) > Number(product.price);
  const discount = hasDiscount
    ? Math.round((1 - Number(product.price) / Number(product.comparePrice)) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <ImageGallery images={product.images} name={product.name} />

        <div className="space-y-5">
          <div>
            <p className="text-sm text-gray-500 mb-1">{product.category.name}</p>
            <h1 className="text-3xl font-bold text-[#1a1a2e]">{product.name}</h1>
            {product.brand && <p className="text-gray-500 mt-1">{product.brand}</p>}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-[#1a1a2e]">{formatARS(Number(product.price))}</span>
            {hasDiscount && (
              <>
                <span className="text-xl text-gray-400 line-through">{formatARS(Number(product.comparePrice))}</span>
                <Badge variant="danger">-{discount}%</Badge>
              </>
            )}
          </div>

          {product.description && (
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            {product.frameType && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Tipo de armazón</p>
                <p className="font-medium text-[#1a1a2e]">{product.frameType}</p>
              </div>
            )}
            {product.frameMaterial && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Material</p>
                <p className="font-medium text-[#1a1a2e]">{product.frameMaterial}</p>
              </div>
            )}
            {product.frameColor && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Color</p>
                <p className="font-medium text-[#1a1a2e]">{product.frameColor}</p>
              </div>
            )}
            {product.lensType && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Tipo de lente</p>
                <p className="font-medium text-[#1a1a2e]">{product.lensType}</p>
              </div>
            )}
            {product.gender && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Género</p>
                <p className="font-medium text-[#1a1a2e]">{product.gender}</p>
              </div>
            )}
          </div>

          <AddToCartButton product={product} />
        </div>
      </div>
    </div>
  );
}
