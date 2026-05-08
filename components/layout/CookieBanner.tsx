"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function getCookieConsent(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)luminus_cookie_consent=([^;]*)/);
  return match ? match[1] : null;
}

function persistConsent(value: "accepted" | "rejected") {
  document.cookie = `luminus_cookie_consent=${value}; max-age=31536000; path=/; SameSite=Lax`;
  window.dispatchEvent(new Event("luminus:cookie-consent"));
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getCookieConsent()) setVisible(true);
  }, []);

  if (!visible) return null;

  const handle = (value: "accepted" | "rejected") => {
    persistConsent(value);
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 flex justify-center pointer-events-none">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-lg max-w-2xl w-full p-5 shadow-2xl pointer-events-auto">
        <div className="h-px bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent mb-4" />
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <p className="text-white/60 text-sm leading-relaxed flex-1">
            Usamos cookies para mejorar tu experiencia en Luminus. Algunas son estrictamente necesarias para el
            funcionamiento del sitio; otras nos ayudan a entender cómo lo usas.{" "}
            <Link href="/politica-de-cookies" className="text-[#d4af37] hover:underline whitespace-nowrap">
              Ver política de cookies
            </Link>
          </p>
          <div className="flex gap-3 shrink-0">
            <button
              onClick={() => handle("rejected")}
              className="px-4 py-2 text-sm text-white/50 hover:text-white/80 border border-white/10 rounded-md transition-colors"
            >
              Rechazar
            </button>
            <button
              onClick={() => handle("accepted")}
              className="px-4 py-2 text-sm bg-[#d4af37] text-[#0a0a0a] hover:bg-[#d4af37]/90 rounded-md font-medium transition-colors"
            >
              Aceptar todo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
