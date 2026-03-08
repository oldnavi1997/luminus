import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function HeroSection() {
  return (
    <section className="relative bg-[#1a1a2e] text-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a2e] to-[#2d2d5e] opacity-90" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Ve el mundo con <span className="text-[#c9a84c]">claridad</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8">
            Descubre nuestra colección de lentes premium. Diseño, calidad y protección para cada momento de tu vida.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/lentes">
              <Button variant="secondary" size="lg">
                Ver catálogo
              </Button>
            </Link>
            <Link href="/lentes?featured=true">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-[#1a1a2e]">
                Destacados
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
