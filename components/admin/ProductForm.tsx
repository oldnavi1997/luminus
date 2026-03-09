"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Category } from "@/app/generated/prisma/client";
import { ProductWithCategory } from "@/types";
import { slugify } from "@/lib/utils";

const productSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  slug: z.string().min(2, "Slug requerido"),
  description: z.string().optional(),
  price: z.string().min(1, "Precio requerido"),
  comparePrice: z.string().optional(),
  stock: z.string(),
  brand: z.string().optional(),
  frameType: z.string().optional(),
  frameMaterial: z.string().optional(),
  frameColor: z.string().optional(),
  lensType: z.string().optional(),
  gender: z.string().optional(),
  categoryId: z.string().min(1, "Categoría requerida"),
  featured: z.boolean(),
  active: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  categories: Category[];
  product?: ProductWithCategory;
}

export function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>(product?.images || []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          slug: product.slug,
          description: product.description || "",
          price: product.price.toString(),
          comparePrice: product.comparePrice?.toString() || "",
          stock: product.stock.toString(),
          brand: product.brand || "",
          frameType: product.frameType || "",
          frameMaterial: product.frameMaterial || "",
          frameColor: product.frameColor || "",
          lensType: product.lensType || "",
          gender: product.gender || "",
          categoryId: product.categoryId,
          featured: product.featured,
          active: product.active,
        }
      : { active: true, featured: false, stock: "0" },
  });

  const nameValue = watch("name");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setValue("name", name);
    if (!product) {
      setValue("slug", slugify(name));
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true);
    try {
      const body = {
        ...data,
        price: parseFloat(data.price),
        comparePrice: data.comparePrice ? parseFloat(data.comparePrice) : null,
        stock: parseInt(data.stock),
        images,
      };

      const url = product ? `/api/products/${product.id}` : "/api/products";
      const method = product ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error al guardar");
        return;
      }

      toast.success(product ? "Producto actualizado" : "Producto creado");
      router.push("/admin/productos");
      router.refresh();
    } catch {
      toast.error("Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="font-semibold text-[#111111]">Información básica</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre *"
            error={errors.name?.message}
            {...register("name")}
            onChange={handleNameChange}
          />
          <Input
            label="Slug *"
            error={errors.slug?.message}
            {...register("slug")}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#111111] min-h-[100px]"
            {...register("description")}
          />
        </div>
        <Select
          label="Categoría *"
          error={errors.categoryId?.message}
          {...register("categoryId")}
        >
          <option value="">Selecciona...</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </Select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="font-semibold text-[#111111]">Precio y stock</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Precio (PEN) *"
            type="number"
            step="0.01"
            error={errors.price?.message}
            {...register("price")}
          />
          <Input
            label="Precio de lista (PEN)"
            type="number"
            step="0.01"
            error={errors.comparePrice?.message}
            {...register("comparePrice")}
          />
          <Input
            label="Stock"
            type="number"
            error={errors.stock?.message}
            {...register("stock")}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="font-semibold text-[#111111]">Atributos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Marca" {...register("brand")} />
          <Input label="Tipo de armazón" {...register("frameType")} />
          <Input label="Material" {...register("frameMaterial")} />
          <Input label="Color" {...register("frameColor")} />
          <Input label="Tipo de lente" {...register("lensType")} />
          <Select label="Género" {...register("gender")}>
            <option value="">Todos</option>
            <option value="Hombre">Hombre</option>
            <option value="Mujer">Mujer</option>
            <option value="Unisex">Unisex</option>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="font-semibold text-[#111111]">Imágenes</h2>
        <p className="text-sm text-gray-500">Pegá las URLs de Cloudinary separadas por líneas</p>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#111111] min-h-[80px] font-mono"
          value={images.join("\n")}
          onChange={(e) => setImages(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
          placeholder="https://res.cloudinary.com/..."
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-[#111111] mb-4">Visibilidad</h2>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register("active")} className="accent-[#111111]" />
            <span className="text-sm">Activo (visible en tienda)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register("featured")} className="accent-[#111111]" />
            <span className="text-sm">Destacado</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {product ? "Actualizar producto" : "Crear producto"}
        </Button>
      </div>
    </form>
  );
}
