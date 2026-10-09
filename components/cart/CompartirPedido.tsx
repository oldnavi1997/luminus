"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Check, Copy, Link2 } from "lucide-react";
import type { CartItem } from "@/types";

/**
 * Sólo para el admin: guarda el carrito actual y devuelve un enlace (`/p/…`)
 * para mandárselo a un cliente, que lo abre con estos productos ya cargados y
 * llena él sus datos en el checkout. El enlace dura 7 días.
 */
export function CompartirPedido({ items }: { items: CartItem[] }) {
  const { data: session } = useSession();
  const [url, setUrl] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  if (session?.user.role !== "ADMIN" || items.length === 0) return null;

  async function generar() {
    setCargando(true);
    try {
      const res = await fetch("/api/pedidos-compartidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            id: i.id,
            cartKey: i.cartKey,
            quantity: i.quantity,
            lensType: i.lensType,
            lensSubType: i.lensSubType,
            lensVariant: i.lensVariant,
            lensPrice: i.lensPrice,
            lensPriceRange: i.lensPriceRange,
            prescriptionUrl: i.prescriptionUrl,
            prescription: i.prescription,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "No se pudo crear el enlace");
        return;
      }
      setUrl(data.url);
      setCopiado(false);
    } catch {
      toast.error("Error de conexión");
    } finally {
      setCargando(false);
    }
  }

  async function copiar() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
    } catch {
      toast.error("No se pudo copiar; selecciona el enlace a mano");
    }
  }

  const textoWhatsApp = url
    ? `Hola, te dejo tu pedido en Luminus. Solo completa tus datos y elige cómo pagar: ${url}`
    : "";

  return (
    <div className="bg-white border border-dashed border-[#c9a84c]/70 p-4 space-y-3">
      <p className="text-[10px] font-medium text-[#111111]/50 uppercase tracking-[0.2em]">
        Admin · Compartir pedido
      </p>

      {!url ? (
        <button
          type="button"
          onClick={generar}
          disabled={cargando}
          className="w-full flex items-center justify-center gap-2 border border-[#111111] py-2.5 text-xs font-medium text-[#111111] hover:bg-[#111111] hover:text-white transition-colors disabled:opacity-50"
        >
          <Link2 className="h-3.5 w-3.5" />
          {cargando ? "Generando…" : "Generar enlace para el cliente"}
        </button>
      ) : (
        <>
          <div className="flex">
            <input
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 min-w-0 border border-[#d5d5d5] px-3 py-2 text-xs text-[#111111] bg-[#f8f7f4]"
            />
            <button
              type="button"
              onClick={copiar}
              className="flex items-center gap-1.5 border border-l-0 border-[#d5d5d5] px-3 text-xs text-[#111111] hover:bg-[#f8f7f4]"
            >
              {copiado ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copiado ? "Copiado" : "Copiar"}
            </button>
          </div>
          <div className="flex items-center justify-between gap-3">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(textoWhatsApp)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-emerald-700 hover:underline"
            >
              Enviar por WhatsApp
            </a>
            <button
              type="button"
              onClick={generar}
              disabled={cargando}
              className="text-[11px] text-[#111111]/45 hover:text-[#111111]"
            >
              Generar otro
            </button>
          </div>
          <p className="text-[11px] text-[#111111]/45">
            Vence en 7 días. Si cambias el carrito, genera uno nuevo: el enlace guarda el carrito de este momento.
          </p>
        </>
      )}
    </div>
  );
}
