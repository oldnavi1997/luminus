import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ImageGallery } from "@/components/product/ImageGallery";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { formatPEN } from "@/lib/utils";

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

  const specs = [
    { label: "Tipo de armazón", value: product.frameType },
    { label: "Material", value: product.frameMaterial },
    { label: "Color", value: product.frameColor },
    { label: "Tipo de lente", value: product.lensType },
    { label: "Género", value: product.gender },
  ].filter((s) => s.value);

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-8 text-[10px] uppercase tracking-[0.2em] text-[#111111]/35">
        <Link href="/lentes" className="hover:text-[#d4af37] transition-colors">
          Catálogo
        </Link>
        <span>/</span>
        <span className="text-[#111111]/55">{product.category.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
        {/* Gallery */}
        <ImageGallery images={product.images} name={product.name} />

        {/* Details */}
        <div className="space-y-7">
          {/* Category & name */}
          <div>
            <p className="text-[9px] font-medium text-[#d4af37] uppercase tracking-[0.3em] mb-3">
              {product.category.name}
            </p>
            <h1
              className="text-3xl md:text-4xl font-light text-[#111111] leading-tight"
              style={{ fontFamily: "var(--font-playfair, serif)" }}
            >
              {product.name}
            </h1>
            {product.brand && (
              <p className="text-sm text-[#111111]/40 mt-2 uppercase tracking-[0.1em]">
                {product.brand}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-4 pb-7 border-b border-[#111111]/8">
            <span className="text-3xl font-light text-[#111111]">
              {formatPEN(Number(product.price))}
            </span>
            {hasDiscount && (
              <>
                <span className="text-lg text-[#111111]/25 line-through">
                  {formatPEN(Number(product.comparePrice))}
                </span>
                <span className="bg-[#d4af37] text-[#111111] text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-1">
                  -{discount}%
                </span>
              </>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-[#111111]/60 leading-relaxed text-sm">
              {product.description}
            </p>
          )}

          {/* Specs */}
          {specs.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {specs.map(({ label, value }) => (
                <div key={label} className="bg-[#f8f7f4] px-4 py-3">
                  <p className="text-[9px] text-[#111111]/35 uppercase tracking-[0.2em] mb-1">
                    {label}
                  </p>
                  <p className="text-sm font-medium text-[#111111]">{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add to cart */}
          <AddToCartButton product={product} />
        </div>
      </div>
    </div>
  );
}
