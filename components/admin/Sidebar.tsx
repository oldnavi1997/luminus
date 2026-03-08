"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#1a1a2e] text-white flex flex-col min-h-screen">
      <div className="p-6 border-b border-white/10">
        <Link href="/" className="text-xl font-bold text-[#c9a84c]">Luminus</Link>
        <p className="text-xs text-gray-400 mt-1">Panel de administración</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === href
                ? "bg-[#c9a84c] text-white"
                : "text-gray-300 hover:bg-white/10 hover:text-white"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors w-full"
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
