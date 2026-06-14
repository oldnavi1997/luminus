"use client";

import { usePathname } from "next/navigation";

export function StoreChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/links")) return null;
  return <>{children}</>;
}
