import type { Metadata } from "next";

/**
 * Metadata compartida por todas las páginas públicas.
 *
 * Existe porque Next fusiona `metadata` de forma **superficial**: si una página
 * declara `openGraph`, reemplaza entero el del layout en vez de completarlo. Sin
 * un helper, cada página tiene que repetir `siteName`, `locale`, `type` e
 * `images`, y basta olvidar uno para que el preview de WhatsApp quede a medias.
 */

const LOCALHOST = /^https?:\/\/(localhost|127\.0\.0\.1)(:|$)/i;

function normalizeBase(raw?: string | null): string | null {
  if (!raw) return null;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withProtocol).origin;
  } catch {
    return null;
  }
}

const configured = normalizeBase(process.env.NEXT_PUBLIC_APP_URL);
// Vercel la inyecta sola en el servidor. Es la red de seguridad para el caso
// en que NEXT_PUBLIC_APP_URL quede sin setear o apuntando a localhost en
// producción: ahí las og:image se resuelven contra un host que el scraper de
// WhatsApp no puede alcanzar y el preview sale sin imagen.
const vercel = normalizeBase(process.env.VERCEL_PROJECT_PRODUCTION_URL);

export const SITE_URL =
  (configured && !LOCALHOST.test(configured) ? configured : null) ??
  vercel ??
  configured ??
  "http://localhost:3000";

export const SITE_NAME = "Luminus";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

/** Frame 0 del video del hero — la única imagen de marca que ya vive en Cloudinary. */
export const DEFAULT_OG_IMAGE =
  "https://res.cloudinary.com/sztba5xb/video/upload/so_0,c_pad,b_auto,w_1200,h_630,f_jpg,q_auto/74d85eab4e586c4fb79b1b6671112eab_1_gj9w4m.jpg";

/**
 * Normaliza cualquier imagen a un JPG de 1200x630.
 *
 * WhatsApp descarta el preview si la imagen es muy pesada y no muestra WebP de
 * forma confiable, así que se fuerza `f_jpg` + `q_auto` (queda en 15–25 KB).
 * `c_pad,b_auto` rellena en vez de recortar: en fotos de producto un `c_fill`
 * corta la montura. Lo que no es de Cloudinary (las URLs de Unsplash del seed)
 * se devuelve tal cual.
 */
export function toOgImage(src?: string | null): string {
  if (!src) return DEFAULT_OG_IMAGE;
  if (!src.includes("res.cloudinary.com")) return src;

  const marker = src.includes("/video/upload/") ? "/video/upload/" : "/image/upload/";
  if (!src.includes(marker)) return src;

  const frame = marker === "/video/upload/" ? "so_0," : "";
  return src
    .replace(marker, `${marker}${frame}c_pad,b_auto,w_${OG_WIDTH},h_${OG_HEIGHT},f_jpg,q_auto/`)
    // La extensión también define el formato de salida y le gana a f_jpg.
    .replace(/\.(webp|avif|png|jpeg|mp4|webm|mov)$/i, ".jpg");
}

interface PageSeoInput {
  /** Sin el sufijo "| Luminus": el template del layout lo agrega al <title>. */
  title: string;
  description: string;
  /** Ruta con querystring incluido, empezando con "/". */
  path: string;
  /** URL cruda de Cloudinary; se transforma sola. Sin ella se usa la del hero. */
  image?: string | null;
  /** Para saltear el template del layout (la home no quiere "Luminus | Luminus"). */
  absoluteTitle?: string;
  index?: boolean;
}

export function pageMetadata({
  title,
  description,
  path,
  image,
  absoluteTitle,
  index = true,
}: PageSeoInput): Metadata {
  const url = `${SITE_URL}${path}`;
  const ogImage = toOgImage(image);

  return {
    title: absoluteTitle ? { absolute: absoluteTitle } : title,
    description,
    alternates: { canonical: url },
    ...(index ? {} : { robots: { index: false, follow: false } }),
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: "es_PE",
      type: "website",
      images: [{ url: ogImage, width: OG_WIDTH, height: OG_HEIGHT, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
