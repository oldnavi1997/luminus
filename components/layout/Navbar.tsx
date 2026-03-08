"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ShoppingBag, User, LogOut, Settings, Menu, X } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/stores/cart";

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const itemCount = useCartStore((s) => s.itemCount());

  return (
    <nav className="bg-[#1a1a2e] text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-[#c9a84c]">
            Luminus
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/lentes" className="text-sm hover:text-[#c9a84c] transition-colors">
              Catálogo
            </Link>

            <Link href="/carrito" className="relative flex items-center gap-1 hover:text-[#c9a84c] transition-colors">
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#c9a84c] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>

            {session ? (
              <div className="flex items-center gap-3">
                {session.user.role === "ADMIN" && (
                  <Link href="/admin" className="text-sm hover:text-[#c9a84c] transition-colors flex items-center gap-1">
                    <Settings className="h-4 w-4" />
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center gap-1 text-sm hover:text-[#c9a84c] transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Salir
                </button>
              </div>
            ) : (
              <Link href="/auth/login" className="flex items-center gap-1 text-sm hover:text-[#c9a84c] transition-colors">
                <User className="h-4 w-4" />
                Ingresar
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-700 px-4 py-3 space-y-3">
          <Link href="/lentes" className="block text-sm hover:text-[#c9a84c]" onClick={() => setMenuOpen(false)}>
            Catálogo
          </Link>
          <Link href="/carrito" className="block text-sm hover:text-[#c9a84c]" onClick={() => setMenuOpen(false)}>
            Carrito {itemCount > 0 && `(${itemCount})`}
          </Link>
          {session ? (
            <>
              {session.user.role === "ADMIN" && (
                <Link href="/admin" className="block text-sm hover:text-[#c9a84c]" onClick={() => setMenuOpen(false)}>
                  Admin
                </Link>
              )}
              <button
                onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                className="block text-sm hover:text-[#c9a84c]"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <Link href="/auth/login" className="block text-sm hover:text-[#c9a84c]" onClick={() => setMenuOpen(false)}>
              Iniciar sesión
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
