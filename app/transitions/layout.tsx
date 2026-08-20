import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

// La page es "use client", así que no puede exportar metadata: va acá.
export const metadata: Metadata = pageMetadata({
  title: "Transitions® GEN S™",
  description:
    "Lentes que se oscurecen al sol y quedan completamente claros en interiores. 8 colores exclusivos, protección UV total. Disponibles en Luminus.",
  path: "/transitions",
  image:
    "https://res.cloudinary.com/sztba5xb/video/upload/gen-s-genstyle_bvpgyx.mp4",
});

export default function TransitionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
