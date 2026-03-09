import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative bg-[#111111] text-white overflow-hidden min-h-[88vh] flex items-center">
      {/* Atmospheric background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#111111] via-[#111111] to-[#0a0a0a]" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, #d4af37 0%, transparent 60%),
                           radial-gradient(circle at 80% 20%, #d4af37 0%, transparent 40%)`,
        }}
      />

      {/* Decorative geometric lines */}
      <div className="absolute right-0 top-0 w-1/2 h-full pointer-events-none hidden lg:block">
        <svg className="w-full h-full" viewBox="0 0 600 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="150" y1="0" x2="600" y2="600" stroke="#d4af37" strokeOpacity="0.07" strokeWidth="1" />
          <line x1="0" y1="200" x2="600" y2="800" stroke="#d4af37" strokeOpacity="0.05" strokeWidth="1" />
          <circle cx="420" cy="300" r="180" stroke="#d4af37" strokeOpacity="0.06" strokeWidth="1" />
          <circle cx="420" cy="300" r="120" stroke="#d4af37" strokeOpacity="0.04" strokeWidth="1" />
          <circle cx="420" cy="300" r="60" stroke="#d4af37" strokeOpacity="0.08" strokeWidth="1" />
          <path d="M280 180 L560 180 L560 420 L280 420 Z" stroke="#d4af37" strokeOpacity="0.04" strokeWidth="1" fill="none" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 py-24 md:py-0 w-full">
        <div className="max-w-xl">
          {/* Pre-title */}
          <div className="flex items-center gap-3 mb-8 animate-[fade-in_0.6s_ease-out_both]">
            <div className="h-px w-10 bg-[#d4af37]/60" />
            <span className="text-[10px] font-medium text-[#d4af37]/80 uppercase tracking-[0.3em]">
              Colección Premium
            </span>
          </div>

          {/* Main heading */}
          <h1
            className="text-5xl md:text-7xl font-light leading-[1.08] mb-7 animate-[slide-up_0.7s_0.1s_cubic-bezier(0.22,1,0.36,1)_both]"
            style={{ fontFamily: "var(--font-playfair, serif)" }}
          >
            Ve el mundo
            <br />
            con{" "}
            <em className="not-italic text-[#d4af37]">claridad</em>
          </h1>

          {/* Subtitle */}
          <p className="text-white/50 text-lg leading-relaxed mb-10 font-light animate-[slide-up_0.7s_0.2s_cubic-bezier(0.22,1,0.36,1)_both]">
            Lentes premium diseñados para cada momento.<br className="hidden sm:block" />
            Calidad, estilo y protección auténtica.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 animate-[slide-up_0.7s_0.3s_cubic-bezier(0.22,1,0.36,1)_both]">
            <Link
              href="/lentes"
              className="inline-flex items-center gap-3 bg-[#d4af37] text-[#111111] text-[11px] font-semibold uppercase tracking-[0.2em] px-8 py-4 hover:bg-[#edd98a] transition-colors duration-300"
            >
              Explorar catálogo
            </Link>
            <Link
              href="/lentes?featured=true"
              className="inline-flex items-center gap-3 border border-white/20 text-white/70 text-[11px] font-medium uppercase tracking-[0.2em] px-8 py-4 hover:border-white/50 hover:text-white transition-all duration-300"
            >
              Destacados
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#f8f7f4]/5 to-transparent pointer-events-none" />
    </section>
  );
}
