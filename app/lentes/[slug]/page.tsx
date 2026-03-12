import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { ImageGallery } from "@/components/product/ImageGallery";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { formatPEN } from "@/lib/utils";
import { ColorVariantProduct } from "@/types";

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

const variantSelect = {
  id: true,
  name: true,
  slug: true,
  frameColor: true,
  images: true,
  active: true,
} as const;

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug, active: true },
    include: {
      category: true,
      colorVariants: { select: { variant: { select: variantSelect } } },
      isVariantOf: { select: { product: { select: variantSelect } } },
    },
  });

  if (!product) notFound();

  const seen = new Set<string>();
  const variants: ColorVariantProduct[] = [
    ...product.colorVariants.map((cv) => cv.variant),
    ...product.isVariantOf.map((cv) => cv.product),
  ].filter((v) => {
    if (!v.active || seen.has(v.id)) return false;
    seen.add(v.id);
    return true;
  });

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
    <div className="max-w-7xl mx-auto px-5 sm:px-8 sm:py-10">
      {/* Breadcrumb */}
      <nav className="hidden sm:flex items-center gap-2 mb-8 text-[10px] uppercase tracking-[0.2em] text-[#111111]/35">
        <Link href="/lentes" className="hover:text-[#111111]/60 transition-colors">
          Catálogo
        </Link>
        <span>/</span>
        <span className="text-[#111111]/55">{product.category.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-16">
        {/* Gallery */}
        <div className="-mx-5 sm:mx-0">
          <ImageGallery images={product.images} name={product.name} />
        </div>

        {/* Details */}
        <div className="space-y-4">
          {/* Category & name */}
          <div>
            <p className="text-[9px] font-medium text-[#111111]/40 uppercase tracking-[0.3em] mb-3">
              {product.category.name}
            </p>
            <h4 className="text-2xl md:text-3xl font-semibold text-[#111111] leading-tight">
              {product.name}
            </h4>
            {product.brand && (
              <p className="text-sm text-[#111111]/40 mt-2 uppercase tracking-[0.1em]">
                {product.brand}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-4">
            <span className="text-xl font-normal text-[#111111]">
              {formatPEN(Number(product.price))}
            </span>
            {hasDiscount && (
              <>
                <span className="text-base text-[#111111]/25 line-through">
                  {formatPEN(Number(product.comparePrice))}
                </span>
                <span className="bg-[#111111] text-white text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-1 rounded-full">
                  -{discount}%
                </span>
              </>
            )}
          </div>

          {/* Color variants */}
          {variants.length > 0 && (
            <div className="space-y-2">
              <p className="text-[9px] font-medium text-[#111111]/40 uppercase tracking-[0.3em]">
                Colores disponibles
              </p>
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: product.id, name: product.name, slug: product.slug, frameColor: product.frameColor, images: product.images, active: product.active },
                  ...variants,
                ]
                  .sort((a, b) => a.name.localeCompare(b.name, "es"))
                  .map((v) =>
                    v.id === product.id ? (
                      <div
                        key={v.id}
                        className="relative w-17 h-17 rounded overflow-hidden border-2 border-[#111111] flex-shrink-0"
                        title={v.frameColor ?? v.name}
                      >
                        {v.images[0] && (
                          <Image
                            src={v.images[0]}
                            alt={v.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        )}
                      </div>
                    ) : (
                      <Link
                        key={v.id}
                        href={`/lentes/${v.slug}`}
                        className="relative w-17 h-17 rounded overflow-hidden border border-[#111111]/20 hover:border-[#111111] transition-colors flex-shrink-0"
                        title={v.frameColor ?? v.name}
                      >
                        {v.images[0] && (
                          <Image
                            src={v.images[0]}
                            alt={v.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        )}
                      </Link>
                    )
                  )}
              </div>
            </div>
          )}

          {/* Lens type tag */}
          {product.lensType && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#111111]/50">Lente:</span>
              <span className="border border-[#111111]/20 text-xs text-[#111111]/70 px-3 py-1 rounded-full">
                {product.lensType}
              </span>
            </div>
          )}

          {/* Description inline */}
          {product.description && (
            <p className="text-sm text-[#111111]/60 leading-relaxed">{product.description}</p>
          )}

          {/* Divider */}
          <div className="border-t border-[#111111]/8" />

          {/* Add to cart */}
          <AddToCartButton product={product} />

          {/* Divider */}
          <div className="border-t border-[#111111]/8" />

          {/* Accordions */}
          {specs.length > 0 && (
            <details className="group border-t border-[#dadadd]">
              <summary className="flex items-center justify-between py-4 cursor-pointer text-sm font-medium text-[#111111] list-none select-none">
                Especificaciones
                <span className="text-lg transition-transform duration-200 group-open:rotate-45">+</span>
              </summary>
              <div className="pb-4 grid grid-cols-2 gap-x-6 gap-y-3">
                {specs.map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] text-[#111111]/35 uppercase tracking-[0.15em] mb-0.5">
                      {label}
                    </p>
                    <p className="text-sm text-[#111111]">{value}</p>
                  </div>
                ))}
              </div>
            </details>
          )}

          <details className="group border-t border-[#dadadd]">
            <summary className="flex items-center justify-between py-4 cursor-pointer text-sm font-medium text-[#111111] list-none select-none">
              Envío
              <span className="text-lg transition-transform duration-200 group-open:rotate-45">+</span>
            </summary>
            <div className="pb-4 text-sm text-[#111111]/60 leading-relaxed space-y-3">
              <p><span className="font-medium text-[#111111]/80">Método de envío:</span> Olva Courier y Shalom. El envío a ciertas zonas puede verse restringido o cancelado debido a circunstancias locales, como condiciones climáticas adversas, emergencias, huelgas y situaciones similares.</p>
              <p><span className="font-medium text-[#111111]/80">Área de envío:</span> Nacional.</p>
              <div>
                <p className="font-medium text-[#111111]/80 mb-1">Tarifa de envío:</p>
                <ul className="space-y-0.5 pl-3">
                  <li>Shalom: 8 soles.</li>
                  <li>Olva Courier: 10–18 soles, puede variar según la región destino.</li>
                  <li>Olva Courier vía aérea: 25 soles.</li>
                </ul>
              </div>
              <p><span className="font-medium text-[#111111]/80">Plazo de procesamiento del pedido:</span> 1–2 días laborables, excepto fines de semana y festivos nacionales.</p>
              <p><span className="font-medium text-[#111111]/80">Plazo de envío:</span> 2–3 días después del procesamiento.</p>
            </div>
          </details>

          <div className="border-t border-[#dadadd]" />
        </div>
      </div>
    </div>
  );
}
