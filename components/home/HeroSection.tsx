import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative text-white overflow-hidden min-h-[88vh] flex items-center">
      {/* Video background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="https://res.cloudinary.com/dzqns7kss/video/upload/so_0,f_jpg,q_80,w_1280/v1773378566/74d85eab4e586c4fb79b1b6671112eab_1_gj9w4m.jpg"
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source
          src="https://res.cloudinary.com/dzqns7kss/video/upload/f_mp4,q_auto,vc_h264/v1773378566/74d85eab4e586c4fb79b1b6671112eab_1_gj9w4m.mp4"
          type="video/mp4"
        />
        <source
          src="https://res.cloudinary.com/dzqns7kss/video/upload/f_webm,q_auto/v1773378566/74d85eab4e586c4fb79b1b6671112eab_1_gj9w4m.webm"
          type="video/webm"
        />
      </video>
      <div className="absolute inset-0 bg-black/10" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 py-24 md:py-0 w-full">
        <div className="max-w-xl">
          {/* Pre-title */}
          <div className="flex items-center gap-3 mb-8 animate-[fade-in_0.6s_ease-out_both]">
            <div className="h-px w-10 bg-[#d4af37]/60" />
            <span className="text-[10px] font-medium text-[#d4af37]/80 uppercase tracking-[0.3em]">
              Transitions® GEN S™
            </span>
          </div>

          {/* Main heading */}
          <h1
            className="text-5xl md:text-7xl font-light leading-[1.08] mb-7 animate-[slide-up_0.7s_0.1s_cubic-bezier(0.22,1,0.36,1)_both]"
            style={{ fontFamily: "var(--font-playfair, serif)" }}
          >
            Lentes que se adaptan
            <br />
            a tu{" "}
            <em className="not-italic text-[#d4af37]">mundo</em>
          </h1>

          {/* Subtitle */}
          <p className="text-white/60 text-lg leading-relaxed mb-10 font-light animate-[slide-up_0.7s_0.2s_cubic-bezier(0.22,1,0.36,1)_both]">
            Se oscurecen al sol y quedan completamente claros en interiores.<br className="hidden sm:block" />
            Protección total, visión perfecta en cada momento.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 animate-[slide-up_0.7s_0.3s_cubic-bezier(0.22,1,0.36,1)_both]">
            <Link
              href="/lentes"
              className="inline-flex items-center gap-3 bg-[#d4af37] text-[#111111] text-[11px] font-semibold uppercase tracking-[0.2em] px-8 py-4 hover:bg-[#edd98a] transition-colors duration-300"
            >
              Ver colección
            </Link>
            <Link
              href="/transitions"
              className="inline-flex items-center gap-3 border border-white/20 text-white/70 text-[11px] font-medium uppercase tracking-[0.2em] px-8 py-4 hover:border-white/50 hover:text-white transition-all duration-300"
            >
              Conoce más
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
    </section>
  );
}
