"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ShoppingBag, User, LogOut, Settings, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useCartStore } from "@/stores/cart";

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const itemCount = useCartStore((s) => s.itemCount());

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-40 transition-all duration-500 ${
        scrolled
          ? "bg-[#111111]/95 backdrop-blur-md shadow-[0_1px_0_rgba(201,168,76,0.15)]"
          : "bg-[#111111]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-[60px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <span
              className="text-[15px] tracking-[0.25em] text-white font-light uppercase"
              style={{ fontFamily: "var(--font-playfair, serif)" }}
            >
              Luminus
            </span>
            <span className="w-1 h-1 rounded-full bg-[#d4af37] opacity-80 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/lentes"
              className="text-[11px] font-medium text-white/60 hover:text-white tracking-[0.2em] uppercase transition-colors duration-200"
            >
              Catálogo
            </Link>

            <div className="w-px h-3 bg-white/15" />

            {session ? (
              <div className="flex items-center gap-5">
                {session.user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 text-[11px] font-medium text-[#d4af37]/70 hover:text-[#d4af37] transition-colors tracking-[0.15em] uppercase"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-white/40 hover:text-white/70 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="text-white/50 hover:text-white transition-colors"
                title="Iniciar sesión"
              >
                <User className="h-4 w-4" />
              </Link>
            )}

            <Link
              href="/carrito"
              className="relative text-white/60 hover:text-white transition-colors"
              title="Carrito"
            >
              <ShoppingBag className="h-4.5 w-4.5" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#d4af37] text-[#111111] text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center leading-none">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile row */}
          <div className="flex items-center gap-5 md:hidden">
            <Link href="/carrito" className="relative text-white/70">
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#d4af37] text-[#111111] text-[9px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
            <button
              className="text-white/70 hover:text-white transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menú"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0a0a0a] border-t border-[#d4af37]/10">
          <div className="px-6 py-7 space-y-6">
            <Link
              href="/lentes"
              className="block text-[11px] font-medium text-white/60 hover:text-white uppercase tracking-[0.25em] transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Catálogo
            </Link>
            {session ? (
              <>
                {session.user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="block text-[11px] text-[#d4af37]/70 hover:text-[#d4af37] uppercase tracking-[0.2em] transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Panel admin
                  </Link>
                )}
                <button
                  onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                  className="block text-[11px] text-white/40 hover:text-white/70 uppercase tracking-[0.2em] transition-colors"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="block text-[11px] text-white/60 hover:text-white uppercase tracking-[0.25em] transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
