"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Plus, LinkIcon, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface BioLink {
  id: string;
  label: string;
  url: string;
  icon: string | null;
  sortOrder: number;
  active: boolean;
}

const ICON_OPTIONS = [
  { value: "", label: "— Sin ícono —" },
  { value: "message-circle", label: "WhatsApp / Mensaje" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "shopping-bag", label: "Tienda / Compra" },
  { value: "link", label: "Link genérico" },
];

export function BioLinkTable({ links }: { links: BioLink[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BioLink | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    label: "",
    url: "",
    icon: "",
    sortOrder: 0,
    active: true,
  });

  const openCreate = () => {
    setEditing(null);
    const nextSort = links.length > 0 ? Math.max(...links.map((l) => l.sortOrder)) + 10 : 0;
    setForm({ label: "", url: "", icon: "", sortOrder: nextSort, active: true });
    setModalOpen(true);
  };

  const openEdit = (link: BioLink) => {
    setEditing(link);
    setForm({
      label: link.label,
      url: link.url,
      icon: link.icon ?? "",
      sortOrder: link.sortOrder,
      active: link.active,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editing ? `/api/bio-links/${editing.id}` : "/api/bio-links";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: form.label,
          url: form.url,
          icon: form.icon || null,
          sortOrder: Number(form.sortOrder),
          active: form.active,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error desconocido");
      }
      toast.success(editing ? "Link actualizado" : "Link creado");
      setModalOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (link: BioLink) => {
    const res = await fetch(`/api/bio-links/${link.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !link.active }),
    });
    if (res.ok) {
      toast.success(link.active ? "Link desactivado" : "Link activado");
      router.refresh();
    } else {
      toast.error("Error al actualizar");
    }
  };

  const handleDelete = async (link: BioLink) => {
    if (!confirm(`¿Eliminar el link "${link.label}"?`)) return;
    const res = await fetch(`/api/bio-links/${link.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Link eliminado");
      router.refresh();
    } else {
      toast.error("Error al eliminar");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#111111]/6">
        <div>
          <p className="text-[10px] text-[#111111]/40 uppercase tracking-[0.2em]">
            {links.length} {links.length === 1 ? "link" : "links"}
          </p>
          <p className="text-[10px] text-[#111111]/30 mt-0.5">
            Ordená con el campo "Orden" (menor número aparece primero)
          </p>
        </div>
        <Button size="sm" onClick={openCreate} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Nuevo link
        </Button>
      </div>

      {links.length === 0 ? (
        <div className="text-center py-16 text-[#111111]/30">
          <LinkIcon className="h-8 w-8 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-light">No hay links todavía</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#111111]/6">
                <th className="text-left py-3 px-5 text-[9px] font-medium text-[#111111]/40 uppercase tracking-[0.2em] w-16">
                  Orden
                </th>
                <th className="text-left py-3 px-5 text-[9px] font-medium text-[#111111]/40 uppercase tracking-[0.2em]">
                  Etiqueta
                </th>
                <th className="text-left py-3 px-5 text-[9px] font-medium text-[#111111]/40 uppercase tracking-[0.2em]">
                  URL
                </th>
                <th className="text-left py-3 px-5 text-[9px] font-medium text-[#111111]/40 uppercase tracking-[0.2em]">
                  Ícono
                </th>
                <th className="text-center py-3 px-5 text-[9px] font-medium text-[#111111]/40 uppercase tracking-[0.2em]">
                  Estado
                </th>
                <th className="py-3 px-5" />
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr
                  key={link.id}
                  className="border-b border-[#111111]/4 hover:bg-[#f8f7f4]/60 transition-colors"
                >
                  <td className="py-3.5 px-5 text-[#111111]/40 font-mono text-xs">
                    {link.sortOrder}
                  </td>
                  <td className="py-3.5 px-5 font-medium text-[#111111] max-w-[260px]">
                    <span className="line-clamp-1">{link.label}</span>
                  </td>
                  <td className="py-3.5 px-5 max-w-[280px]">
                    <span className="font-mono text-xs text-[#111111]/50 line-clamp-1">
                      {link.url}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-xs text-[#111111]/60">
                    {link.icon ?? <span className="text-[#111111]/25">—</span>}
                  </td>
                  <td className="py-3.5 px-5 text-center">
                    <button
                      onClick={() => toggleActive(link)}
                      className={
                        link.active
                          ? "text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5"
                          : "text-[10px] font-medium text-[#111111]/40 bg-[#f8f7f4] px-2 py-0.5"
                      }
                    >
                      {link.active ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleActive(link)}
                        className="p-1.5 text-[#111111]/30 hover:text-[#111111] hover:bg-[#f8f7f4] transition-colors"
                        title={link.active ? "Desactivar" : "Activar"}
                      >
                        {link.active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => openEdit(link)}
                        className="p-1.5 text-[#111111]/30 hover:text-[#111111] hover:bg-[#f8f7f4] transition-colors"
                        title="Editar"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(link)}
                        className="p-1.5 text-[#111111]/30 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar link" : "Nuevo link"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="link-label"
            label="Etiqueta (texto del botón)"
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            placeholder="Ej: WhatsApp"
            required
          />
          <Input
            id="link-url"
            label="URL"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            placeholder="https://... o /lentes"
            required
          />
          <div className="space-y-1.5">
            <label className="block text-[10px] font-medium text-[#111111]/60 uppercase tracking-[0.15em]">
              Ícono
            </label>
            <select
              value={form.icon}
              onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-white border border-[#111111]/15 text-sm text-[#111111] focus:outline-none focus:border-[#d4af37] transition-colors duration-200 appearance-none"
            >
              {ICON_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <Input
            id="link-order"
            label="Orden (menor = primero)"
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
            required
          />
          <div className="flex items-center gap-3 py-1">
            <button
              type="button"
              role="switch"
              aria-checked={form.active}
              onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                form.active ? "bg-[#d4af37]" : "bg-[#111111]/15"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
                  form.active ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            <label
              className="text-sm text-[#111111]/70 select-none cursor-pointer"
              onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
            >
              Activo (visible en /links)
            </label>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" loading={loading}>
              {editing ? "Guardar cambios" : "Crear link"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
