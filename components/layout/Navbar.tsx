"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Menu, X, ChevronDown, ChevronRight, ChevronLeft, Plus, Minus } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";
import { useState, useEffect, useRef } from "react";
import { useCartStore } from "@/stores/cart";

type NavLeaf = { id: string; name: string; slug: string };

type NavChild = NavLeaf & { children: NavLeaf[] };

type NavPromo = { image: string; slug: string; name: string };

export type NavCategory = {
  id: string;
  name: string;
  slug: string;
  children: NavChild[];
  promos?: NavPromo[];
};

interface NavbarProps {
  categories: NavCategory[];
}

export function Navbar({ categories }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openCatId, setOpenCatId] = useState<string | null>(null);
  // Mobile two-level navigation
  const [mobileCatId, setMobileCatId] = useState<string | null>(null);
  const [openSubIds, setOpenSubIds] = useState<Set<string>>(new Set());
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
    // Reset a nivel 1 tras cerrar (deja terminar la animación)
    setTimeout(() => {
      setMobileCatId(null);
      setOpenSubIds(new Set());
    }, 350);
  };

  const openMenu = () => {
    setMenuOpen(true);
    setSearchOpen(false);
  };

  const backToLevel1 = () => {
    setMobileCatId(null);
    setOpenSubIds(new Set());
  };

  const toggleSub = (id: string) => {
    setOpenSubIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const activeCat = categories.find((c) => c.id === openCatId) ?? null;
  const mobileCat = categories.find((c) => c.id === mobileCatId) ?? null;

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
                    style={{ fontFamily: "var(--font-inter, sans-serif)" }}
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
                  triggerOnly
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
            <div className="hidden md:flex items-center w-full">
              {/* Logo — izquierda */}
              <div className="flex-1 flex justify-start">
                <Link href="/" className="flex items-center gap-2.5 group">
                  <span
                    className="text-[15px] tracking-[0.25em] text-[#1e293b] font-light uppercase"
                    style={{ fontFamily: "var(--font-inter, sans-serif)" }}
                  >
                    Luminus
                  </span>
                  <span className="w-1 h-1 rounded-full bg-[#d4af37] opacity-80 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300" />
                </Link>
              </div>

            {/* Desktop nav — centro */}
            <div ref={navRef} className="flex items-center gap-8" onMouseLeave={handleCatLeave}>
              {/* Per-category items */}
              {categories.map((cat) =>
                cat.children.length > 0 ? (
                  <button
                    key={cat.id}
                    onMouseEnter={() => handleCatEnter(cat.id)}
                    onClick={() => setOpenCatId((v) => (v === cat.id ? null : cat.id))}
                    className={`relative flex items-center gap-1 text-[11px] font-medium tracking-[0.2em] uppercase transition-colors duration-200 ${
                      openCatId === cat.id ? "text-[#1e293b]" : "text-[#334155]/60 hover:text-[#1e293b]"
                    }`}
                  >
                    {cat.name}
                    <ChevronDown
                      className={`h-3 w-3 transition-transform duration-200 ${openCatId === cat.id ? "rotate-180" : ""}`}
                    />
                    <span
                      className={`absolute -bottom-2 left-0 h-px bg-[#1e293b] transition-all duration-200 ${
                        openCatId === cat.id ? "w-full" : "w-0"
                      }`}
                    />
                  </button>
                ) : (
                  <Link
                    key={cat.id}
                    href={`/lentes?category=${cat.slug}`}
                    onMouseEnter={() => setOpenCatId(null)}
                    className="text-[11px] font-medium text-[#334155]/60 hover:text-[#1e293b] tracking-[0.2em] uppercase transition-colors duration-200"
                  >
                    {cat.name}
                  </Link>
                )
              )}

              {/* Ver todo */}
              <Link
                href="/lentes"
                onMouseEnter={() => setOpenCatId(null)}
                className="text-[11px] font-medium text-[#334155]/40 hover:text-[#1e293b] tracking-[0.2em] uppercase transition-colors duration-200"
              >
                Ver todo
              </Link>
            </div>

              {/* Iconos — derecha */}
              <div className="flex-1 flex justify-end items-center gap-5">
                <div className="w-px h-3 bg-[#d5d5d5]" />
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

        {/* Mega menu panel (desktop) */}
        {activeCat && activeCat.children.length > 0 && (
          <div
            className="hidden md:block absolute left-0 top-full w-full bg-[#F8F7F4] shadow-[0_12px_24px_rgba(0,0,0,0.08)] z-40"
            style={{ borderTop: "1px solid #d5d5d5", borderBottom: "1px solid #d5d5d5" }}
            onMouseEnter={() => handleCatEnter(activeCat.id)}
            onMouseLeave={handleCatLeave}
          >
            <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 flex gap-10">
              {/* Columnas de subcategorías */}
              <div className="flex flex-wrap gap-x-12 gap-y-8 flex-1">
                {/* 1ª columna: raíz + Ver todo + hijos sueltos */}
                <div className="min-w-[140px]">
                  <p className="text-[10px] font-semibold text-[#1e293b] uppercase tracking-[0.2em] mb-4">
                    {activeCat.name}
                  </p>
                  <div className="flex flex-col gap-2.5">
                    <Link
                      href={`/lentes?category=${activeCat.slug}`}
                      onClick={() => setOpenCatId(null)}
                      className="text-[12px] text-[#334155]/60 hover:text-[#1e293b] transition-colors"
                    >
                      Ver todo
                    </Link>
                    {activeCat.children
                      .filter((c) => c.children.length === 0)
                      .map((child) => (
                        <Link
                          key={child.id}
                          href={`/lentes?category=${child.slug}`}
                          onClick={() => setOpenCatId(null)}
                          className="text-[12px] text-[#334155]/60 hover:text-[#1e293b] transition-colors"
                        >
                          {child.name}
                        </Link>
                      ))}
                  </div>
                </div>

                {/* Columnas por hijo con nietos */}
                {activeCat.children
                  .filter((c) => c.children.length > 0)
                  .map((child) => (
                    <div key={child.id} className="min-w-[140px]">
                      <p className="text-[10px] font-semibold text-[#1e293b] uppercase tracking-[0.2em] mb-4">
                        {child.name}
                      </p>
                      <div className="flex flex-col gap-2.5">
                        {child.children.map((gc) => (
                          <Link
                            key={gc.id}
                            href={`/lentes?category=${gc.slug}`}
                            onClick={() => setOpenCatId(null)}
                            className="text-[12px] text-[#334155]/60 hover:text-[#1e293b] transition-colors"
                          >
                            {gc.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Imágenes promocionales */}
              {activeCat.promos && activeCat.promos.length > 0 && (
                <div className="flex gap-4 flex-shrink-0">
                  {activeCat.promos.map((promo) => (
                    <Link
                      key={promo.slug}
                      href={`/lentes/${promo.slug}`}
                      onClick={() => setOpenCatId(null)}
                      className="group relative block w-52 h-60 overflow-hidden bg-white"
                    >
                      <Image
                        src={promo.image}
                        alt={promo.name}
                        fill
                        sizes="208px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute bottom-0 left-0 right-0 px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-white bg-gradient-to-t from-black/50 to-transparent line-clamp-1">
                        {promo.name}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
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
        className={`fixed top-0 left-0 h-full z-50 md:hidden flex flex-col transition-transform duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          width: "88vw",
          maxWidth: "400px",
          backgroundColor: "#F8F7F4",
          borderRight: "1px solid #d5d5d5",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        {/* Drawer header — solo cerrar */}
        <div className="flex items-center h-[60px] px-5 flex-shrink-0">
          <button
            onClick={closeMenu}
            className="text-[#1e293b] hover:text-[#334155] transition-colors p-1 -ml-1"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Track de dos niveles con deslizamiento */}
        <div className="flex-1 overflow-hidden">
          <div
            className="flex h-full w-[200%] transition-transform duration-400 ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{ transform: mobileCatId ? "translateX(-50%)" : "translateX(0)" }}
          >
            {/* ── Nivel 1: categorías principales ── */}
            <div className="w-1/2 h-full overflow-y-auto px-5 pb-10">
              {categories.map((cat) =>
                cat.children.length > 0 ? (
                  <button
                    key={cat.id}
                    onClick={() => setMobileCatId(cat.id)}
                    className="flex items-center justify-between w-full py-4 text-[15px] text-[#1e293b] border-b border-[#d5d5d5]/70 transition-colors"
                  >
                    {cat.name}
                    <ChevronRight className="h-4 w-4 text-[#334155]/40" />
                  </button>
                ) : (
                  <Link
                    key={cat.id}
                    href={`/lentes?category=${cat.slug}`}
                    onClick={closeMenu}
                    className="flex items-center justify-between w-full py-4 text-[15px] text-[#1e293b] border-b border-[#d5d5d5]/70"
                  >
                    {cat.name}
                  </Link>
                )
              )}
              <Link
                href="/lentes"
                onClick={closeMenu}
                className="flex items-center w-full py-4 text-[15px] text-[#334155]/60 hover:text-[#1e293b] transition-colors"
              >
                Ver todo
              </Link>
            </div>

            {/* ── Nivel 2: subcategorías de la categoría activa ── */}
            <div className="w-1/2 h-full overflow-y-auto px-5 pb-10">
              {mobileCat && (
                <>
                  {/* Volver */}
                  <button
                    onClick={backToLevel1}
                    className="flex items-center gap-2 w-full py-3 text-[13px] text-[#334155]/55 hover:text-[#1e293b] border-b border-[#d5d5d5]/70 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {mobileCat.name}
                  </button>

                  {/* Ver todo de la categoría */}
                  <Link
                    href={`/lentes?category=${mobileCat.slug}`}
                    onClick={closeMenu}
                    className="block py-4 text-[15px] text-[#1e293b] border-b border-[#d5d5d5]/70"
                  >
                    Ver todo
                  </Link>

                  {/* Hijos: acordeón (con nietos) o enlace directo */}
                  {mobileCat.children.map((child) =>
                    child.children.length > 0 ? (
                      <div key={child.id} className="border-b border-[#d5d5d5]/70">
                        <button
                          onClick={() => toggleSub(child.id)}
                          className="flex items-center justify-between w-full py-4 text-[15px] text-[#1e293b]"
                        >
                          {child.name}
                          {openSubIds.has(child.id) ? (
                            <Minus className="h-4 w-4 text-[#334155]/40" />
                          ) : (
                            <Plus className="h-4 w-4 text-[#334155]/40" />
                          )}
                        </button>
                        <div
                          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                            openSubIds.has(child.id) ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                          }`}
                        >
                          <div className="overflow-hidden">
                            <div className="ml-1 pl-4 border-l border-[#d5d5d5] flex flex-col pb-3">
                              {child.children.map((gc) => (
                                <Link
                                  key={gc.id}
                                  href={`/lentes?category=${gc.slug}`}
                                  onClick={closeMenu}
                                  className="py-2 text-[14px] text-[#334155]/70 hover:text-[#1e293b] transition-colors"
                                >
                                  {gc.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Link
                        key={child.id}
                        href={`/lentes?category=${child.slug}`}
                        onClick={closeMenu}
                        className="block py-4 text-[15px] text-[#1e293b] border-b border-[#d5d5d5]/70"
                      >
                        {child.name}
                      </Link>
                    )
                  )}

                  {/* Imágenes promocionales */}
                  {mobileCat.promos && mobileCat.promos.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 mt-6">
                      {mobileCat.promos.map((promo) => (
                        <Link
                          key={promo.slug}
                          href={`/lentes/${promo.slug}`}
                          onClick={closeMenu}
                          className="group relative block aspect-[3/4] overflow-hidden bg-white"
                        >
                          <Image
                            src={promo.image}
                            alt={promo.name}
                            fill
                            sizes="45vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
