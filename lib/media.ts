/**
 * `Product.images` guarda fotos y videos mezclados: la galería del admin ofrece
 * los dos y el formulario sube los dos. Todo lo que necesite un still —una
 * tarjeta, una tabla, el feed de Merchant, el JSON-LD— pasa la URL por
 * `miniatura()` y recibe el frame 0 en JPG cuando resulta ser un video.
 *
 * El caso de una foto es siempre la identidad, así que envolver una URL de más
 * no cuesta nada.
 */

/** Cloudinary siempre devuelve `secure_url` con extensión y sin querystring. */
const EXT_VIDEO = /\.(mp4|webm|mov|m4v|ogv)$/i;

export function esVideo(url: string): boolean {
  return EXT_VIDEO.test(url);
}

/**
 * Frame 0 en JPG.
 *
 * `so_0` y el resize van en el **mismo** componente de transformación. Si se
 * encadenan (`/w_640/so_0/`) Cloudinary reescala el video entero antes de sacar
 * el frame, y eso se factura a 2 transformaciones por segundo de video en vez
 * de como una imagen suelta.
 */
export function posterDeVideo(url: string, ancho = 800): string {
  if (!url.includes("/video/upload/")) return url;
  return (
    url
      .replace("/video/upload/", `/video/upload/so_0,w_${ancho},c_limit,q_auto,f_jpg/`)
      // La extensión también define el formato de salida y le gana a f_jpg.
      .replace(EXT_VIDEO, ".jpg")
  );
}

/** La URL tal cual si es una foto; el frame 0 si es un video. */
export function miniatura(url: string, ancho?: number): string {
  return esVideo(url) ? posterDeVideo(url, ancho) : url;
}
