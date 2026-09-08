import { esVideo, posterDeVideo } from "./media";

interface LoaderProps {
  src: string;
  width: number;
  quality?: number;
}

export default function cloudinaryLoader({ src, width, quality }: LoaderProps): string {
  if (!src.includes("res.cloudinary.com")) return src;
  // Un video dentro de <Image> se sirve como su frame 0. Sin esto Cloudinary
  // responde el video (content-type video/mp4) a un <img> y la tarjeta queda
  // rota: es la red de seguridad para las ~10 vistas que renderizan images[0]
  // sin saber si les tocó una foto o un video.
  if (esVideo(src)) return posterDeVideo(src, width);
  // Insert Cloudinary transformation params right after /upload/.
  // c_limit is critical: without it Cloudinary upscales past the original
  // (a 1200px product image asked for w_3840 costs 177 KB instead of 24 KB).
  // q_auto lets Cloudinary pick per-image instead of a flat q_75.
  const q = quality ? `q_${quality}` : "q_auto";
  return src.replace("/upload/", `/upload/w_${width},${q},c_limit,f_auto/`);
}
