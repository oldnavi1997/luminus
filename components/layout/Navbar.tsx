"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ShoppingBag, User, LogOut, Menu, X, ChevronDown } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";
import { useState, useEffect, useRef } from "react";
import { useCartStore } from "@/stores/cart";

type NavLeaf = { id: string; name: string; slug: string };

type NavChild = NavLeaf & { children: NavLeaf[] };

export type NavCategory = {
  id: string;
  name: string;
  slug: string;
  children: NavChild[];
};

interface NavbarProps {
  categories: NavCategory[];
}

export function Navbar({ categories }: NavbarProps) {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openCatId, setOpenCatId] = useState<string | null>(null);
  const [openMobileCatId, setOpenMobileCatId] = useState<string | null>(null);
  const itemCount = useCartStore((s) => s.itemCount());
  const openDrawer = useCartStore((s) => s.openDrawer);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const navRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCatEnter = (id: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenCatId(id);
  };

  const handleCatLeave = () => {
    closeTimer.current = setTimeout(() => setOpenCatId(null), 120);
  };

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

  // Close desktop dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenCatId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const closeMenu = () => {
    setMenuOpen(false);
    setOpenMobileCatId(null);
  };

  const openMenu = () => {
    setMenuOpen(true);
    setSearchOpen(false);
  };

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
          <div className="h-[60px] flex items-center">

            {/* Mobile layout: menú | logo | carrito */}
            <div className="flex w-full items-center md:hidden">
              <div className="flex-1 flex justify-start">
                <button
                  className="text-[#334155]/70 hover:text-[#1e293b] transition-colors"
                  onClick={openMenu}
                  aria-label="Abrir menú"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 flex justify-center">
                <Link href="/" className="flex items-center gap-2 group">
                  <span
                    className="text-[15px] tracking-[0.25em] text-[#1e293b] font-light uppercase"
                    style={{ fontFamily: "var(--font-playfair, serif)" }}
                  >
                    Luminus
                  </span>
                  <span className="w-1 h-1 rounded-full bg-[#d4af37] opacity-80 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300" />
                </Link>
              </div>
              <div className="flex-1 flex justify-end items-center gap-3">
                <SearchBar
                  className="text-[#334155]/70 hover:text-[#1e293b] transition-colors"
                  open={searchOpen}
                  onOpen={() => setSearchOpen(true)}
                  onClose={() => setSearchOpen(false)}
                />
                <button
                  onClick={() => { openDrawer(); setSearchOpen(false); }}
                  className="relative text-[#334155]/70"
                  aria-label="Abrir carrito"
                >
                  <ShoppingBag className="h-5 w-5" />
                  {mounted && itemCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-[#1e293b] text-white text-[9px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Desktop layout: logo | nav */}
            <div className="hidden md:flex items-center justify-between w-full">
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
            <div ref={navRef} className="flex items-center gap-8">
              {/* Per-category items */}
              {categories.map((cat) =>
                cat.children.length > 0 ? (
                  <div
                    key={cat.id}
                    className="relative"
                    onMouseLeave={handleCatLeave}
                  >
                    <button
                      onMouseEnter={() => handleCatEnter(cat.id)}
                      onClick={() => setOpenCatId((v) => v === cat.id ? null : cat.id)}
                      className="flex items-center gap-1 text-[11px] font-medium text-[#334155]/60 hover:text-[#1e293b] tracking-[0.2em] uppercase transition-colors duration-200"
                    >
                      {cat.name}
                      <ChevronDown
                        className={`h-3 w-3 transition-transform duration-200 ${openCatId === cat.id ? "rotate-180" : ""}`}
                      />
                    </button>

                    {openCatId === cat.id && (
                      <div
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 bg-[#F8F7F4] shadow-[0_8px_24px_rgba(0,0,0,0.1)] z-50"
                        style={{ border: "1px solid #d5d5d5" }}
                        onMouseEnter={() => handleCatEnter(cat.id)}
                      >
                        <Link
                          href={`/lentes?category=${cat.slug}`}
                          onClick={() => setOpenCatId(null)}
                          className="flex items-center px-5 py-3 text-[10px] font-medium tracking-[0.2em] uppercase text-[#334155]/50 hover:text-[#1e293b] hover:bg-white transition-colors border-b border-[#d5d5d5]/60"
                        >
                          Ver todo — {cat.name}
                        </Link>
                        <div className="py-2">
                          {cat.children.map((child) =>
                            child.children.length > 0 ? (
                              <div key={child.id} className="px-5 py-2">
                                <p className="text-[9px] text-[#334155]/40 uppercase tracking-[0.15em] mb-0.5">
                                  {child.name}
                                </p>
                                {child.children.map((gc) => (
                                  <Link
                                    key={gc.id}
                                    href={`/lentes?category=${gc.slug}`}
                                    onClick={() => setOpenCatId(null)}
                                    className="block pl-2 py-1 text-[11px] text-[#334155]/60 hover:text-[#1e293b] transition-colors"
                                  >
                                    {gc.name}
                                  </Link>
                                ))}
                              </div>
                            ) : (
                              <Link
                                key={child.id}
                                href={`/lentes?category=${child.slug}`}
                                onClick={() => setOpenCatId(null)}
                                className="flex items-center px-5 py-2 text-[11px] text-[#334155]/60 hover:text-[#1e293b] hover:bg-white transition-colors"
                              >
                                {child.name}
                              </Link>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={cat.id}
                    href={`/lentes?category=${cat.slug}`}
                    className="text-[11px] font-medium text-[#334155]/60 hover:text-[#1e293b] tracking-[0.2em] uppercase transition-colors duration-200"
                  >
                    {cat.name}
                  </Link>
                )
              )}

              {/* Ver todo */}
              <Link
                href="/lentes"
                className="text-[11px] font-medium text-[#334155]/40 hover:text-[#1e293b] tracking-[0.2em] uppercase transition-colors duration-200"
              >
                Ver todo
              </Link>

              <div className="w-px h-3 bg-[#d5d5d5]" />

              {session ? (
                <div className="flex items-center gap-5">
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

              <SearchBar
                open={searchOpen}
                onOpen={() => setSearchOpen(true)}
                onClose={() => setSearchOpen(false)}
              />

              <button
                onClick={() => { openDrawer(); setSearchOpen(false); }}
                className="relative text-[#334155]/60 hover:text-[#1e293b] transition-colors"
                title="Carrito"
                aria-label="Abrir carrito"
              >
                <ShoppingBag className="h-4.5 w-4.5" />
                {mounted && itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#1e293b] text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center leading-none">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </button>
            </div>
            </div>{/* end desktop layout */}

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
        <nav className="flex-1 px-6 py-8 flex flex-col gap-1 overflow-y-auto">
          <div className="mb-4 h-px bg-gradient-to-r from-[#d4af37]/40 to-transparent" />

          {/* Ver todo */}
          <Link
            href="/lentes"
            onClick={closeMenu}
            className="py-3 text-[11px] font-medium tracking-[0.2em] uppercase text-[#334155]/50 hover:text-[#1e293b] transition-colors"
          >
            Ver todo
          </Link>

          {/* Per-category items */}
          {categories.map((cat) =>
            cat.children.length > 0 ? (
              <div key={cat.id}>
                <button
                  onClick={() => setOpenMobileCatId((v) => v === cat.id ? null : cat.id)}
                  className="flex items-center justify-between w-full py-3 text-[11px] font-medium text-[#334155]/60 hover:text-[#1e293b] uppercase tracking-[0.3em] transition-colors duration-200"
                >
                  {cat.name}
                  <ChevronDown
                    className={`h-3 w-3 transition-transform duration-200 ${openMobileCatId === cat.id ? "rotate-180" : ""}`}
                  />
                </button>

                {openMobileCatId === cat.id && (
                  <div className="pl-2 pb-2 flex flex-col gap-0.5">
                    <Link
                      href={`/lentes?category=${cat.slug}`}
                      onClick={closeMenu}
                      className="py-1.5 text-[10px] font-medium tracking-[0.15em] uppercase text-[#334155]/40 hover:text-[#1e293b] transition-colors"
                    >
                      Ver todo — {cat.name}
                    </Link>
                    {cat.children.map((child) =>
                      child.children.length > 0 ? (
                        <div key={child.id} className="mt-1.5">
                          <p className="text-[9px] uppercase tracking-[0.25em] text-[#d4af37] mb-1">
                            {child.name}
                          </p>
                          {child.children.map((gc) => (
                            <Link
                              key={gc.id}
                              href={`/lentes?category=${gc.slug}`}
                              onClick={closeMenu}
                              className="block pl-4 py-1.5 text-[11px] text-[#334155]/60 hover:text-[#1e293b] transition-colors"
                            >
                              {gc.name}
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <Link
                          key={child.id}
                          href={`/lentes?category=${child.slug}`}
                          onClick={closeMenu}
                          className="block pl-2 py-1.5 text-[11px] text-[#334155]/60 hover:text-[#1e293b] transition-colors"
                        >
                          {child.name}
                        </Link>
                      )
                    )}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={cat.id}
                href={`/lentes?category=${cat.slug}`}
                onClick={closeMenu}
                className="py-3 text-[11px] font-medium text-[#334155]/60 hover:text-[#1e293b] uppercase tracking-[0.3em] transition-colors duration-200"
              >
                {cat.name}
              </Link>
            )
          )}

          <div className="mt-4 h-px bg-[#d5d5d5]/60" />

          {session ? null : (
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
