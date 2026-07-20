"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { slugify } from "@/lib/utils";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

interface CategoryFormProps {
  category?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    parentId: string | null;
    requiresLensSelection: boolean;
  };
  categories: CategoryOption[];
}

export function CategoryForm({ category, categories }: CategoryFormProps) {
  const router = useRouter();
  const isEditing = !!category;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    description: category?.description ?? "",
    parentId: category?.parentId ?? "",
    requiresLensSelection: category?.requiresLensSelection ?? false,
  });

  // Hierarchical parent options (depth-first, indented)
  const childrenOf = new Map<string | null, CategoryOption[]>();
  for (const cat of categories) {
    const key = cat.parentId ?? null;
    if (!childrenOf.has(key)) childrenOf.set(key, []);
    childrenOf.get(key)!.push(cat);
  }
  const parentOptions: { cat: CategoryOption; depth: number }[] = [];
  const walk = (parentId: string | null, depth: number) => {
    for (const cat of childrenOf.get(parentId) ?? []) {
      parentOptions.push({ cat, depth });
      walk(cat.id, depth + 1);
    }
  };
  walk(null, 0);
  const indent = (depth: number) => (depth > 0 ? " ".repeat(depth * 2) + "↳ " : "");

  const handleNameChange = (name: string) => {
    // Auto-slug while creating; keep manual slug when editing
    setForm((f) => ({ ...f, name, slug: isEditing ? f.slug : slugify(name) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = isEditing ? `/api/categories/${category.id}` : "/api/categories";
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          description: form.description,
          parentId: form.parentId || null,
          requiresLensSelection: form.requiresLensSelection,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error desconocido");
      }
      toast.success(isEditing ? "Categoría actualizada" : "Categoría creada");
      router.push("/admin/categorias");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <Link
        href="/admin/categorias"
        className="inline-flex items-center gap-1.5 text-[11px] text-[#111111]/50 hover:text-[#111111] transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver a categorías
      </Link>

      <div className="bg-white border border-[#111111]/6">
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          <Input
            id="cat-name"
            label="Nombre"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Ej: Lentes de sol"
            required
          />
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                id="cat-slug"
                label="Slug"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="lentes-de-sol"
                required
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setForm((f) => ({ ...f, slug: slugify(f.name) }))}
              title="Generar desde el nombre"
            >
              Regenerar
            </Button>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-medium text-[#111111]/60 uppercase tracking-[0.15em]">
              Categoría padre
            </label>
            <select
              value={form.parentId}
              onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-white border border-[#111111]/15 text-sm text-[#111111] focus:outline-none focus:border-[#d4af37] transition-colors duration-200 appearance-none"
            >
              <option value="">Sin padre (categoría raíz)</option>
              {parentOptions
                .filter(({ cat }) => !isEditing || cat.id !== category.id)
                .map(({ cat, depth }) => (
                  <option key={cat.id} value={cat.id}>
                    {indent(depth)}
                    {cat.name} — {cat.slug}
                  </option>
                ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-medium text-[#111111]/60 uppercase tracking-[0.15em]">
              Descripción
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Descripción opcional..."
              rows={4}
              className="w-full px-3.5 py-2.5 bg-white border border-[#111111]/15 text-sm text-[#111111] placeholder:text-[#111111]/25 focus:outline-none focus:border-[#d4af37] transition-colors duration-200 resize-none"
            />
          </div>
          <div className="flex items-center gap-3 py-1">
            <button
              type="button"
              role="switch"
              aria-checked={form.requiresLensSelection}
              onClick={() => setForm((f) => ({ ...f, requiresLensSelection: !f.requiresLensSelection }))}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                form.requiresLensSelection ? "bg-[#d4af37]" : "bg-[#111111]/15"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
                  form.requiresLensSelection ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            <label
              className="text-sm text-[#111111]/70 select-none cursor-pointer"
              onClick={() => setForm((f) => ({ ...f, requiresLensSelection: !f.requiresLensSelection }))}
            >
              Requiere selección de lunas
            </label>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#111111]/6">
            <Link href="/admin/categorias">
              <Button type="button" variant="ghost" size="sm">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" size="sm" loading={loading}>
              {isEditing ? "Guardar cambios" : "Crear categoría"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
