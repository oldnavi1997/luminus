"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ShoppingBag, User, LogOut, Settings, Menu, X, ChevronDown } from "lucide-react";
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
  const [catsOpen, setCatsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const itemCount = useCartStore((s) => s.itemCount());
  const openDrawer = useCartStore((s) => s.openDrawer);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const closeMenu = () => {
    setMenuOpen(false);
    setCatsOpen(false);
  };

  const hasCategories = categories.length > 0;

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
              {/* Catálogo with dropdown */}
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  onMouseEnter={() => setDropdownOpen(true)}
                  className="flex items-center gap-1 text-[11px] font-medium text-[#334155]/60 hover:text-[#1e293b] tracking-[0.2em] uppercase transition-colors duration-200"
                >
                  Catálogo
                  <ChevronDown
                    className={`h-3 w-3 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown panel */}
                {dropdownOpen && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 bg-[#F8F7F4] shadow-[0_8px_24px_rgba(0,0,0,0.1)] z-50"
                    style={{ border: "1px solid #d5d5d5" }}
                    onMouseLeave={() => setDropdownOpen(false)}
                  >
                    {/* Ver todo */}
                    <Link
                      href="/lentes"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center px-5 py-3 text-[10px] font-medium tracking-[0.2em] uppercase text-[#334155]/50 hover:text-[#1e293b] hover:bg-white transition-colors border-b border-[#d5d5d5]/60"
                    >
                      Ver todo el catálogo
                    </Link>

                    {hasCategories ? (
                      <div className="py-2">
                        {categories.map((cat) =>
                          cat.children.length > 0 ? (
                            <div key={cat.id} className="px-5 py-2">
                              <p className="text-[9px] font-semibold tracking-[0.25em] uppercase text-[#d4af37] mb-1.5">
                                {cat.name}
                              </p>
                              {cat.children.map((child) =>
                                child.children.length > 0 ? (
                                  // Intermediate level → sub-group label + grandchildren
                                  <div key={child.id} className="mb-1.5">
                                    <p className="text-[9px] text-[#334155]/40 uppercase tracking-[0.15em] pl-2 mb-0.5">
                                      {child.name}
                                    </p>
                                    {child.children.map((gc) => (
                                      <Link
                                        key={gc.id}
                                        href={`/lentes?category=${gc.slug}`}
                                        onClick={() => setDropdownOpen(false)}
                                        className="block pl-4 py-1 text-[11px] text-[#334155]/60 hover:text-[#1e293b] transition-colors"
                                      >
                                        {gc.name}
                                      </Link>
                                    ))}
                                  </div>
                                ) : (
                                  <Link
                                    key={child.id}
                                    href={`/lentes?category=${child.slug}`}
                                    onClick={() => setDropdownOpen(false)}
                                    className="block pl-2 py-1 text-[11px] text-[#334155]/60 hover:text-[#1e293b] transition-colors"
                                  >
                                    {child.name}
                                  </Link>
                                )
                              )}
                            </div>
                          ) : (
                            <Link
                              key={cat.id}
                              href={`/lentes?category=${cat.slug}`}
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center px-5 py-2 text-[11px] text-[#334155]/60 hover:text-[#1e293b] hover:bg-white transition-colors"
                            >
                              {cat.name}
                            </Link>
                          )
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

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
        <nav className="flex-1 px-6 py-8 flex flex-col gap-1 overflow-y-auto">
          <div className="mb-6 h-px bg-gradient-to-r from-[#d4af37]/40 to-transparent" />

          {/* Catálogo toggle */}
          <button
            onClick={() => setCatsOpen((v) => !v)}
            className="flex items-center justify-between py-3 text-[11px] font-medium text-[#334155]/60 hover:text-[#1e293b] uppercase tracking-[0.3em] transition-colors duration-200 w-full"
          >
            Catálogo
            <ChevronDown
              className={`h-3 w-3 transition-transform duration-200 ${catsOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Catálogo expanded */}
          {catsOpen && (
            <div className="pl-2 pb-2 flex flex-col gap-0.5">
              {/* Ver todo */}
              <Link
                href="/lentes"
                onClick={closeMenu}
                className="py-2 text-[10px] font-medium tracking-[0.2em] uppercase text-[#334155]/50 hover:text-[#1e293b] transition-colors"
              >
                Ver todo
              </Link>

              {hasCategories && categories.map((cat) =>
                cat.children.length > 0 ? (
                  <div key={cat.id} className="mt-2">
                    <p className="text-[9px] uppercase tracking-[0.25em] text-[#d4af37] mb-1">
                      {cat.name}
                    </p>
                    {cat.children.map((child) =>
                      child.children.length > 0 ? (
                        <div key={child.id} className="mb-1.5">
                          <p className="text-[9px] text-[#334155]/40 uppercase tracking-[0.15em] pl-2 mb-0.5">
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
                ) : (
                  <Link
                    key={cat.id}
                    href={`/lentes?category=${cat.slug}`}
                    onClick={closeMenu}
                    className="py-1.5 text-[11px] text-[#334155]/60 hover:text-[#1e293b] transition-colors"
                  >
                    {cat.name}
                  </Link>
                )
              )}
            </div>
          )}

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
