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
  const openDrawer = useCartStore((s) => s.openDrawer);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav
        className={`sticky top-0 z-40 transition-all duration-500 ${
          scrolled
            ? "bg-[#F8F7F4]/95 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.06)]"
            : "bg-[#F8F7F4]"
        }`}
        style={{ borderBottom: "1px solid #d5d5d5" }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between h-[60px]">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <span
                className="text-[15px] tracking-[0.25em] text-[#1e293b] font-light uppercase"
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
                className="text-[11px] font-medium text-[#334155]/60 hover:text-[#1e293b] tracking-[0.2em] uppercase transition-colors duration-200"
              >
                Catálogo
              </Link>

              <div className="w-px h-3 bg-[#d5d5d5]" />

              {session ? (
                <div className="flex items-center gap-5">
                  {session.user.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-1.5 text-[11px] font-medium text-[#d4af37]/80 hover:text-[#d4af37] transition-colors tracking-[0.15em] uppercase"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-[#334155]/40 hover:text-[#1e293b] transition-colors"
                    title="Cerrar sesión"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="text-[#334155]/50 hover:text-[#1e293b] transition-colors"
                  title="Iniciar sesión"
                >
                  <User className="h-4 w-4" />
                </Link>
              )}

              <button
                onClick={openDrawer}
                className="relative text-[#334155]/60 hover:text-[#1e293b] transition-colors"
                title="Carrito"
                aria-label="Abrir carrito"
              >
                <ShoppingBag className="h-4.5 w-4.5" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#1e293b] text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center leading-none">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile row */}
            <div className="flex items-center gap-5 md:hidden">
              <button
                onClick={openDrawer}
                className="relative text-[#334155]/70"
                aria-label="Abrir carrito"
              >
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#1e293b] text-white text-[9px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
              <button
                className="text-[#334155]/70 hover:text-[#1e293b] transition-colors"
                onClick={() => setMenuOpen(true)}
                aria-label="Abrir menú"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ backgroundColor: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)" }}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Mobile drawer panel */}
      <div
        className={`fixed top-0 left-0 h-full z-50 md:hidden flex flex-col transition-transform duration-300 ease-in-out ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          width: "72vw",
          maxWidth: "300px",
          backgroundColor: "#F8F7F4",
          borderRight: "1px solid #d5d5d5",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-6 h-[60px]"
          style={{ borderBottom: "1px solid #d5d5d5" }}
        >
          <Link href="/" className="flex items-center gap-2 group" onClick={closeMenu}>
            <span
              className="text-[13px] tracking-[0.3em] text-[#1e293b] font-light uppercase"
              style={{ fontFamily: "var(--font-playfair, serif)" }}
            >
              Luminus
            </span>
            <span className="w-1 h-1 rounded-full bg-[#d4af37] opacity-70" />
          </Link>
          <button
            onClick={closeMenu}
            className="text-[#334155]/40 hover:text-[#1e293b] transition-colors p-1"
            aria-label="Cerrar menú"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Drawer nav links */}
        <nav className="flex-1 px-6 py-8 flex flex-col gap-1">
          <div className="mb-6 h-px bg-gradient-to-r from-[#d4af37]/40 to-transparent" />

          <Link
            href="/lentes"
            className="group flex items-center gap-3 py-3 text-[11px] font-medium text-[#334155]/60 hover:text-[#1e293b] uppercase tracking-[0.3em] transition-colors duration-200"
            onClick={closeMenu}
          >
            <span className="w-0 group-hover:w-4 h-px bg-[#d4af37] transition-all duration-300 ease-out" aria-hidden="true" />
            Catálogo
          </Link>

          {session ? (
            <>
              {session.user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="group flex items-center gap-3 py-3 text-[11px] text-[#d4af37]/70 hover:text-[#d4af37] uppercase tracking-[0.25em] transition-colors duration-200"
                  onClick={closeMenu}
                >
                  <Settings className="h-3.5 w-3.5 shrink-0" />
                  Panel admin
                </Link>
              )}
            </>
          ) : (
            <Link
              href="/auth/login"
              className="group flex items-center gap-3 py-3 text-[11px] text-[#334155]/60 hover:text-[#1e293b] uppercase tracking-[0.3em] transition-colors duration-200"
              onClick={closeMenu}
            >
              <User className="h-3.5 w-3.5 shrink-0" />
              Iniciar sesión
            </Link>
          )}
        </nav>

        {/* Drawer footer */}
        {session && (
          <div className="px-6 py-6" style={{ borderTop: "1px solid #d5d5d5" }}>
            <button
              onClick={() => { closeMenu(); signOut({ callbackUrl: "/" }); }}
              className="flex items-center gap-2.5 text-[10px] text-[#334155]/40 hover:text-[#1e293b] uppercase tracking-[0.25em] transition-colors duration-200"
            >
              <LogOut className="h-3.5 w-3.5" />
              Cerrar sesión
            </button>
          </div>
        )}

        {/* Decorative accent */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 w-24 h-24 pointer-events-none"
          style={{
            background: "radial-gradient(circle at bottom left, rgba(212,175,55,0.08) 0%, transparent 70%)",
          }}
        />
      </div>
    </>
  );
}
