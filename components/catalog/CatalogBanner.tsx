import Image, { getImageProps } from "next/image";

interface CatalogBannerProps {
  imageUrl: string;
  /** La del teléfono (4:3). Null = el teléfono recorta la de escritorio. */
  mobileImageUrl: string | null;
  title: string;
  text: string | null;
}

/** Desde aquí la franja pasa a dos columnas: `md` de Tailwind. */
const ESCRITORIO = "(min-width: 768px)";

/**
 * La franja de arriba del listado: imagen a la izquierda y el texto al costado
 * en escritorio; en el teléfono la imagen arriba y el texto debajo. Ocupa todo
 * el ancho, fuera del contenedor del catálogo. Se edita en /admin/banners.
 */
export function CatalogBanner({ imageUrl, mobileImageUrl, title, text }: CatalogBannerProps) {
  return (
    <section className="grid md:grid-cols-2 border-b border-[#111111]/10">
      <div className="relative aspect-[4/3] md:aspect-auto md:h-[clamp(320px,32vw,480px)] bg-[#f5f5f4]">
        {mobileImageUrl ? (
          <FotoPorPantalla escritorio={imageUrl} movil={mobileImageUrl} alt={title} />
        ) : (
          <Image
            src={imageUrl}
            alt={title}
            fill
            preload
            sizes={`${ESCRITORIO} 50vw, 100vw`}
            className="object-cover"
          />
        )}
      </div>
      {/* Medidas tomadas de la franja de Carin: Inter; título 16→18 px/600,
          texto 13 px en el teléfono y 11 px desde md, ambos /500 y sin
          espaciado de letras; bloque de 430 px como máximo. */}
      <div className="flex items-center justify-center md:justify-start px-5 py-6 md:px-[clamp(2rem,6vw,6rem)] md:py-12">
        <div className="max-w-[430px] font-display text-[#1c1c1c] text-center md:text-left">
          {/* `!`: el `h1 { font-size; line-height }` de globals.css no está en
              ninguna capa y le gana a cualquier utilidad de Tailwind. */}
          <h1 className="text-[length:clamp(1rem,0.954rem+0.195vw,1.125rem)]! font-semibold leading-[1.6]! tracking-normal uppercase text-balance">
            {title}
          </h1>
          {text && (
            <p className="mt-4 text-[13px] md:text-[11px] font-medium leading-[1.65] whitespace-pre-line text-pretty">
              {text}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Dos fotos, una por pantalla, con `<picture>`: el navegador descarga sólo la
 * que le toca. Dos `<Image>` escondidos con CSS bajarían las dos, porque la
 * franja está arriba de todo y ninguna puede ser lazy.
 */
function FotoPorPantalla({ escritorio, movil, alt }: { escritorio: string; movil: string; alt: string }) {
  const comun = { alt, fill: true, fetchPriority: "high", loading: "eager" } as const;
  const { props: esc } = getImageProps({ ...comun, src: escritorio, sizes: "50vw" });
  const {
    props: { srcSet: srcSetMovil, ...img },
  } = getImageProps({ ...comun, src: movil, sizes: "100vw" });

  return (
    <picture>
      <source media={ESCRITORIO} srcSet={esc.srcSet} sizes={esc.sizes} />
      <img {...img} srcSet={srcSetMovil} alt={alt} className="object-cover" />
    </picture>
  );
}
