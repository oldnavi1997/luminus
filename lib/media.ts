/**
 * `Product.images` guarda fotos y videos mezclados: la galería del admin ofrece
 * los dos y el formulario sube los dos. Todo lo que necesite un still —una
 * tarjeta, una tabla, el feed de Merchant, el JSON-LD— pasa la URL por
 * `miniatura()` y recibe una imagen cuando resulta ser un video.
 *
 * Conviven dos orígenes de video:
 * - **Cloudinary** (`/video/upload/…mp4`): los que se subieron antes de Bunny.
 * - **Bunny Stream** (`https://{host}/{guid}/playlist.m3u8`): los nuevos. Es HLS,
 *   ver `VideoItem` en `components/product/ImageGallery.tsx`.
 *
 * El caso de una foto es siempre la identidad, así que envolver una URL de más
 * no cuesta nada.
 */

/** Cloudinary siempre devuelve `secure_url` con extensión y sin querystring. */
const EXT_VIDEO = /\.(mp4|webm|mov|m4v|ogv|m3u8)$/i;

/** Bunny Stream publica cada video como `{guid}/playlist.m3u8` y su miniatura al lado. */
const BUNNY_PLAYLIST = /\/playlist\.m3u8$/i;

export function esVideo(url: string): boolean {
  return EXT_VIDEO.test(url);
}

/** HLS: Safari lo reproduce nativo, el resto necesita hls.js. */
export function esHls(url: string): boolean {
  return /\.m3u8$/i.test(url);
}

/**
 * Un still del video en JPG.
 *
 * Bunny: `thumbnail.jpg`, que ya genera al codificar. Viene al tamaño del video
 * y `ancho` no aplica — no hay transformaciones que pagar ni que pedir.
 *
 * Cloudinary: frame 0. `so_0` y el resize van en el **mismo** componente de
 * transformación. Si se encadenan (`/w_640/so_0/`) Cloudinary reescala el video
 * entero antes de sacar el frame, y eso se factura a 2 transformaciones por
 * segundo de video en vez de como una imagen suelta.
 */
export function posterDeVideo(url: string, ancho = 800): string {
  if (BUNNY_PLAYLIST.test(url)) return url.replace(BUNNY_PLAYLIST, "/thumbnail.jpg");
  if (!url.includes("/video/upload/")) return url;
  return (
    url
      .replace("/video/upload/", `/video/upload/so_0,w_${ancho},c_limit,q_auto,f_jpg/`)
      // La extensión también define el formato de salida y le gana a f_jpg.
      .replace(EXT_VIDEO, ".jpg")
  );
}

/** La URL tal cual si es una foto; un still si es un video. */
export function miniatura(url: string, ancho?: number): string {
  return esVideo(url) ? posterDeVideo(url, ancho) : url;
}

/**
 * La primera posición de `Product.images` tiene que ser una foto. El POS, el
 * buscador y las variantes de color la pintan en un `<img>` crudo, sin pasar por
 * `miniatura()`, y un video ahí se ve como una imagen rota.
 */
export function primeraEsFoto(images: string[]): boolean {
  return images.length === 0 || !esVideo(images[0]);
}

export const MENSAJE_PRIMERA_FOTO =
  "La primera posición tiene que ser una foto, no un video";
