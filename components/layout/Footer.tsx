import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#0a0a0a] text-white mt-auto">
      {/* Gold top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <span
              className="text-base tracking-[0.3em] text-white/90 uppercase font-light"
              style={{ fontFamily: "var(--font-playfair, serif)" }}
            >
              Luminus
            </span>
            <p className="text-white/40 text-sm mt-4 leading-relaxed max-w-xs">
              Lentes de calidad para cada estilo de vida. Diseño, protección y visión clara en Perú.
            </p>
          </div>

          {/* Tienda */}
          <div>
            <p className="text-[10px] font-medium text-[#d4af37]/70 uppercase tracking-[0.2em] mb-4">Tienda</p>
            <ul className="space-y-3 text-sm text-white/40">
              <li>
                <Link href="/lentes" className="hover:text-white/80 transition-colors">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link href="/carrito" className="hover:text-white/80 transition-colors">
                  Carrito
                </Link>
              </li>
            </ul>
          </div>

          {/* Cuenta */}
          <div>
            <p className="text-[10px] font-medium text-[#d4af37]/70 uppercase tracking-[0.2em] mb-4">Cuenta</p>
            <ul className="space-y-3 text-sm text-white/40">
              <li>
                <Link href="/auth/login" className="hover:text-white/80 transition-colors">
                  Iniciar sesión
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="hover:text-white/80 transition-colors">
                  Registrarse
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-white/25 tracking-wide">
            © {new Date().getFullYear()} Luminus. Todos los derechos reservados.
          </p>
          <p className="text-[11px] text-white/20">Hecho con cuidado en Perú</p>
        </div>
      </div>
    </footer>
  );
}
