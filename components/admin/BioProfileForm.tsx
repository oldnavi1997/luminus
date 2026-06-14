"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CldUploadWidget } from "next-cloudinary";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Props {
  initial: {
    handle: string;
    tagline: string;
    avatarUrl: string;
    instagramUrl: string;
    tiktokUrl: string;
  };
}

export function BioProfileForm({ initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/bio-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: form.handle,
          tagline: form.tagline || null,
          avatarUrl: form.avatarUrl || null,
          instagramUrl: form.instagramUrl || null,
          tiktokUrl: form.tiktokUrl || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar");
      }
      toast.success("Perfil actualizado");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="block text-[10px] font-medium text-[#111111]/60 uppercase tracking-[0.15em] mb-2">
          Avatar
        </p>
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-[#f8f7f4] border border-[#111111]/10 overflow-hidden flex items-center justify-center">
            {form.avatarUrl ? (
              <Image
                src={form.avatarUrl}
                alt="Avatar"
                width={80}
                height={80}
                className="h-20 w-20 object-cover"
              />
            ) : (
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#111111]/40">
                Luminus
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <CldUploadWidget
              uploadPreset="luminus-products"
              options={{ multiple: false, cropping: true, croppingAspectRatio: 1 }}
              onSuccess={(result) => {
                const info = result.info as { secure_url: string };
                if (info?.secure_url) setForm((f) => ({ ...f, avatarUrl: info.secure_url }));
              }}
            >
              {({ open }) => (
                <button
                  type="button"
                  onClick={() => open()}
                  className="px-4 py-2 border border-dashed border-[#111111]/20 rounded-lg text-xs text-[#111111]/60 hover:border-[#111111] hover:text-[#111111] transition-colors"
                >
                  + Subir avatar
                </button>
              )}
            </CldUploadWidget>
            {form.avatarUrl && (
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, avatarUrl: "" }))}
                className="text-[11px] text-[#111111]/40 hover:text-red-500 transition-colors text-left"
              >
                Quitar avatar
              </button>
            )}
          </div>
        </div>
      </div>

      <Input
        id="bio-handle"
        label="Handle"
        value={form.handle}
        onChange={(e) => setForm((f) => ({ ...f, handle: e.target.value }))}
        placeholder="@luminus.eyewear"
        required
      />

      <Input
        id="bio-tagline"
        label="Tagline (opcional)"
        value={form.tagline}
        onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
        placeholder="Ver bien y verte bien"
      />

      <Input
        id="bio-ig"
        label="URL de Instagram"
        type="url"
        value={form.instagramUrl}
        onChange={(e) => setForm((f) => ({ ...f, instagramUrl: e.target.value }))}
        placeholder="https://instagram.com/luminus.eyewear"
      />

      <Input
        id="bio-tt"
        label="URL de TikTok"
        type="url"
        value={form.tiktokUrl}
        onChange={(e) => setForm((f) => ({ ...f, tiktokUrl: e.target.value }))}
        placeholder="https://tiktok.com/@luminus.eyewear"
      />

      <div className="flex items-center justify-end pt-2">
        <Button type="submit" size="sm" loading={loading}>
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
