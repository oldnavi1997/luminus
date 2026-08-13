interface LoaderProps {
  src: string;
  width: number;
  quality?: number;
}

export default function cloudinaryLoader({ src, width, quality }: LoaderProps): string {
  if (!src.includes("res.cloudinary.com")) return src;
  // Insert Cloudinary transformation params right after /upload/.
  // c_limit is critical: without it Cloudinary upscales past the original
  // (a 1200px product image asked for w_3840 costs 177 KB instead of 24 KB).
  // q_auto lets Cloudinary pick per-image instead of a flat q_75.
  const q = quality ? `q_${quality}` : "q_auto";
  return src.replace("/upload/", `/upload/w_${width},${q},c_limit,f_auto/`);
}
