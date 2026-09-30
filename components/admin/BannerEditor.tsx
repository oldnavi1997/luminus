"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CldUploadWidget } from "next-cloudinary";
import { ExternalLink, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export interface BannerGuardado {
  imageUrl: string;
  mobileImageUrl: string | null;
  title: string;
  text: string | null;
  active: boolean;
}

interface Props {
  /** null = la franja de "Ver todo". */
  categoryId: string | null;
  nombre: string;
  /** Dónde se ve en el sitio, para el enlace. */
  href: string;
  inicial: BannerGuardado | null;
}

/** Una franja del catálogo: imagen, título, texto y si se muestra. */
export function BannerEditor({ categoryId, nombre, href, inicial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    imageUrl: inicial?.imageUrl ?? "",
    mobileImageUrl: inicial?.mobileImageUrl ?? "",
    title: inicial?.title ?? "",
    text: inicial?.text ?? "",
    active: inicial?.active ?? true,
  });
  const [guardando, setGuardando] = useState(false);
  const [abierto, setAbierto] = useState(false);

  const cambios =
    form.imageUrl !== (inicial?.imageUrl ?? "") ||
    form.mobileImageUrl !== (inicial?.mobileImageUrl ?? "") ||
    form.title !== (inicial?.title ?? "") ||
    form.text !== (inicial?.text ?? "") ||
    form.active !== (inicial?.active ?? true);

  const guardar = async () => {
    if (!form.imageUrl) return toast.error("Sube la imagen de escritorio");
    if (!form.title.trim()) return toast.error("Falta el título");
    setGuardando(true);
    try {
      const res = await fetch("/api/catalog-banners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          ...form,
          text: form.text || null,
          mobileImageUrl: form.mobileImageUrl || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "No se pudo guardar");
      toast.success(`Franja de ${nombre} guardada`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  };

  const quitar = async () => {
    setGuardando(true);
    try {
      const qs = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : "";
      const res = await fetch(`/api/catalog-banners${qs}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setForm({ imageUrl: "", mobileImageUrl: "", title: "", text: "", active: true });
      toast.success(`Franja de ${nombre} quitada`);
      router.refresh();
    } catch {
      toast.error("No se pudo quitar");
    } finally {
      setGuardando(false);
    }
  };

  const estado = !inicial ? "Sin franja" : inicial.active ? "Visible" : "Oculta";

  return (
    <div className="bg-white border border-[#111111]/10">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-[#111111]/[0.02] transition-colors"
      >
        <div className="relative w-16 h-10 flex-shrink-0 bg-[#f5f5f4] overflow-hidden">
          {inicial?.imageUrl ? (
            <Image src={inicial.imageUrl} alt="" fill sizes="64px" className="object-cover" />
          ) : (
            <ImageIcon className="absolute inset-0 m-auto h-4 w-4 text-[#111111]/20" aria-hidden />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#111111] truncate">{nombre}</p>
          <p className="text-xs text-[#111111]/45 truncate">{inicial?.title ?? "—"}</p>
        </div>
        <span
          className={`text-[10px] uppercase tracking-[0.15em] ${
            estado === "Visible" ? "text-emerald-600" : "text-[#111111]/35"
          }`}
        >
          {estado}
        </span>
      </button>

      {abierto && (
        <div className="border-t border-[#111111]/10 p-4 grid gap-5 md:grid-cols-[260px_1fr]">
          <div className="space-y-5">
            <SubirFoto
              etiqueta="Escritorio · 16:9"
              ayuda="Media pantalla de ancho. Ideal 2560 × 1440, lo importante al centro."
              aspecto="aspect-video"
              url={form.imageUrl}
              onCambio={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
            />
            <SubirFoto
              etiqueta="Móvil · 4:3 · opcional"
              ayuda="Arriba del texto en el teléfono. Ideal 1600 × 1200. Sin ella se recorta la de escritorio."
              aspecto="aspect-[4/3]"
              url={form.mobileImageUrl}
              onCambio={(url) => setForm((f) => ({ ...f, mobileImageUrl: url }))}
              quitable
            />
          </div>

          <div className="space-y-4">
            <Input
              label="Título"
              value={form.title}
              maxLength={120}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Feather Fit Line"
            />
            <div className="space-y-1.5">
              <label className="block text-[10px] font-medium text-[#111111]/60 uppercase tracking-[0.15em]">
                Texto
              </label>
              <textarea
                value={form.text}
                maxLength={600}
                rows={4}
                onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                placeholder="Una o dos líneas sobre la colección…"
                className="w-full px-3.5 py-2.5 bg-white border border-[#111111]/15 text-sm text-[#111111] placeholder:text-[#111111]/25 focus:outline-none focus:border-[#d4af37] transition-colors duration-200 resize-none"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-[#111111]/70 cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                className="accent-[#111111]"
              />
              Mostrar en el catálogo
            </label>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button size="sm" onClick={guardar} disabled={guardando || !cambios}>
                {guardando ? "Guardando…" : "Guardar"}
              </Button>
              {inicial && (
                <Button size="sm" variant="outline" onClick={quitar} disabled={guardando}>
                  Quitar franja
                </Button>
              )}
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex items-center gap-1 text-xs text-[#111111]/50 hover:text-[#111111]"
              >
                Ver en el sitio <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SubirFoto({
  etiqueta,
  ayuda,
  aspecto,
  url,
  onCambio,
  quitable = false,
}: {
  etiqueta: string;
  ayuda: string;
  aspecto: string;
  url: string;
  onCambio: (url: string) => void;
  quitable?: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-medium text-[#111111]/60 uppercase tracking-[0.15em]">{etiqueta}</p>
      <div className={`relative ${aspecto} bg-[#f5f5f4] overflow-hidden`}>
        {url ? (
          <Image src={url} alt="" fill sizes="260px" className="object-cover" />
        ) : (
          <ImageIcon className="absolute inset-0 m-auto h-6 w-6 text-[#111111]/20" aria-hidden />
        )}
      </div>
      <div className="flex items-center gap-3">
        <CldUploadWidget
          uploadPreset="luminus-products"
          options={{ multiple: false, sources: ["local", "url"] }}
          onSuccess={(result) => {
            const info = result.info as { secure_url?: string };
            if (info?.secure_url) onCambio(info.secure_url);
          }}
        >
          {({ open }) => (
            <button
              type="button"
              onClick={() => open()}
              className="flex-1 px-4 py-2 border border-dashed border-[#111111]/20 text-xs text-[#111111]/60 hover:border-[#111111] hover:text-[#111111] transition-colors"
            >
              {url ? "Cambiar" : "+ Subir"}
            </button>
          )}
        </CldUploadWidget>
        {quitable && url && (
          <button
            type="button"
            onClick={() => onCambio("")}
            className="text-[11px] text-[#111111]/40 hover:text-red-500 transition-colors"
          >
            Quitar
          </button>
        )}
      </div>
      <p className="text-[11px] leading-snug text-[#111111]/40">{ayuda}</p>
    </div>
  );
}
