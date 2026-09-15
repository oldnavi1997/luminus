import { esVideo, posterDeVideo } from "./media";

interface LoaderProps {
  src: string;
  width: number;
  quality?: number;
}

export default function cloudinaryLoader({ src, width, quality }: LoaderProps): string {
  // Un video dentro de <Image> se sirve como su still. Sin esto el <img> recibe
  // el video (o el playlist HLS de Bunny) y la tarjeta queda rota: es la red de
  // seguridad para las ~10 vistas que renderizan images[0] sin saber si les tocó
  // una foto o un video. Va antes del chequeo de host porque los de Bunny no
  // viven en Cloudinary.
  if (esVideo(src)) return posterDeVideo(src, width);
  if (!src.includes("res.cloudinary.com")) return src;
  // Insert Cloudinary transformation params right after /upload/.
  // c_limit is critical: without it Cloudinary upscales past the original
  // (a 1200px product image asked for w_3840 costs 177 KB instead of 24 KB).
  // q_auto lets Cloudinary pick per-image instead of a flat q_75.
  const q = quality ? `q_${quality}` : "q_auto";
  return src.replace("/upload/", `/upload/w_${width},${q},c_limit,f_auto/`);
}
