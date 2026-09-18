import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * El master se guarda a 5000 px y calidad fija, no `q_auto`.
 *
 * Cloudinary guarda el RESULTADO de esta transformación y descarta el archivo
 * original (la cuenta no tiene backup), así que lo que se recorte acá no se
 * recupera nunca: arreglarlo obliga a resubir foto por foto. Estaba en 1200 px
 * con `q_auto`, que dejaba masters de ~29 KB — 0.19 bits por píxel, cinco veces
 * por debajo de lo razonable — y borraba el grabado de los aros.
 *
 * 5000 es el máximo que admite el plan Free por imagen (25 MP), elegido a
 * propósito como margen: el master es lo único que no se puede rehacer sin
 * volver a subir el catálogo entero, mientras que todo lo que se entrega se
 * cambia en un commit. No compra detalle — medido, un master de 5000 contra uno
 * de 4000 entrega al cliente la misma imagen (49.3 dB de PSNR, 4 KB de
 * diferencia), porque el cuadrado real de la cámara del catálogo es 4000x4000
 * (Sony A6400, 6000x4000) y de ahí para arriba son píxeles interpolados.
 *
 * El número que no se puede bajar es 3840: es lo que pide la capa de zoom del
 * lightbox (`ANCHO_ZOOM` en `components/product/ImageGallery.tsx`). Por debajo
 * de eso el cliente empieza a recibir menos de lo que pide.
 *
 * Los mismos valores están en el preset sin firmar `luminus-products`, que es
 * por donde sube el widget del admin. Si cambias uno, cambia el otro.
 */
export async function uploadProductImage(
  file: string,
  folder = "luminus-products"
): Promise<{ publicId: string; url: string }> {
  const result = await cloudinary.uploader.upload(file, {
    folder,
    transformation: [{ width: 5000, height: 5000, crop: "limit" }, { quality: 88 }],
  });
  return { publicId: result.public_id, url: result.secure_url };
}

export async function deleteProductImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export default cloudinary;
