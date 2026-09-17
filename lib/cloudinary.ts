import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * El master se guarda a 4000 px y calidad fija, no `q_auto`.
 *
 * Cloudinary guarda el RESULTADO de esta transformación y descarta el archivo
 * original (la cuenta no tiene backup), así que lo que se recorte acá no se
 * recupera nunca: arreglarlo obliga a resubir foto por foto. Estaba en 1200 px
 * con `q_auto`, que dejaba masters de ~29 KB — 0.19 bits por píxel, cinco veces
 * por debajo de lo razonable — y borraba el grabado de los aros.
 *
 * 4000 es el cuadrado real de la cámara con la que se fotografía el catálogo
 * (Sony A6400, 6000x4000): más arriba serían píxeles interpolados, y el plan
 * Free topa las transformaciones en 50 MP sumando origen y destino, que a
 * 6662 px ya queda en 48. Lo que se sirve al cliente no depende de esto —
 * `lib/cloudinary-loader.ts` pide el ancho de cada vista, y el mayor que existe
 * es 1920.
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
    transformation: [{ width: 4000, height: 4000, crop: "limit" }, { quality: 88 }],
  });
  return { publicId: result.public_id, url: result.secure_url };
}

export async function deleteProductImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export default cloudinary;
