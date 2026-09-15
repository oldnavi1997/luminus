"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Category } from "@/app/generated/prisma/client";
import { ProductWithCategory, ColorVariantProduct } from "@/types";
import { slugify } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CldUploadWidget } from "next-cloudinary";
import { MediaLibraryModal } from "@/components/admin/MediaLibraryModal";
import { esVideo, primeraEsFoto, MENSAJE_PRIMERA_FOTO } from "@/lib/media";

/** Bunny no cobra por codificar; el tope es sólo para no subir por error un archivo crudo de cámara. */
const MAX_VIDEO_BUNNY = 1_000_000_000;
const TUS_ENDPOINT = "https://video.bunnycdn.com/tusupload";

interface SubidaVideo {
  id: string;
  nombre: string;
  fase: "subiendo" | "error";
  progreso: number;
  mensaje?: string;
}

function mensajeDeError(err: unknown): string {
  if (typeof err === "string") return err;
  if (Array.isArray(err) && typeof err[0]?.message === "string") return err[0].message;
  return "Error al guardar";
}

function SortableImage({
  url,
  index,
  onRemove,
}: {
  url: string;
  index: number;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: url });
  // Un video de Bunny recién subido no tiene miniatura hasta que sale de la cola.
  const [sinMiniatura, setSinMiniatura] = useState(false);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative group w-24 h-24 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
        isDragging ? "opacity-50 border-[#111111]" : "border-gray-200"
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 cursor-grab active:cursor-grabbing z-10"
      />
      {sinMiniatura ? (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-center text-[10px] leading-tight text-gray-500 px-1">
          {esVideo(url) ? "Procesando en Bunny" : "Sin vista previa"}
        </div>
      ) : (
        <Image
          src={url}
          alt={`Imagen ${index + 1}`}
          fill
          className="object-cover"
          sizes="96px"
          onError={() => setSinMiniatura(true)}
        />
      )}
      {esVideo(url) && (
        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded z-20 pointer-events-none">
          ▶ Video
        </span>
      )}
      {index === 0 && (
        <span className="absolute top-1 left-1 bg-[#111111] text-white text-[9px] px-1.5 py-0.5 rounded z-20 pointer-events-none">
          Principal
        </span>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 text-xs"
      >
        ×
      </button>
    </div>
  );
}

const productSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  slug: z.string().min(2, "Slug requerido"),
  description: z.string().optional(),
  price: z.string().min(1, "Precio requerido"),
  comparePrice: z.string().optional(),
  stockAlmacen: z.string(),
  stockTienda: z.string(),
  brand: z.string().optional(),
  frameType: z.string().optional(),
  frameMaterial: z.string().optional(),
  frameColor: z.string().optional(),
  lensType: z.string().optional(),
  gender: z.string().optional(),
  dimTotalWidth: z.string().optional(),
  dimLensWidth: z.string().optional(),
  dimFrameHeight: z.string().optional(),
  dimBridgeWidth: z.string().optional(),
  dimTempleLength: z.string().optional(),
  featured: z.boolean(),
  skipCharges: z.boolean(),
  active: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

type ProductWithVariants = ProductWithCategory & { variants?: ColorVariantProduct[] };

interface ProductFormProps {
  categories: Category[];
  product?: ProductWithVariants;
  /** Con Bunny configurado los videos van ahí; sin él, a Cloudinary como antes. */
  bunnyHabilitado?: boolean;
}

export function ProductForm({ categories, product, bunnyHabilitado = false }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [subidas, setSubidas] = useState<SubidaVideo[]>([]);
  const inputVideoRef = useRef<HTMLInputElement>(null);

  const videosPendientes = subidas.some((s) => s.fase === "subiendo");

  const actualizarSubida = (id: string, cambios: Partial<SubidaVideo>) =>
    setSubidas((prev) => prev.map((s) => (s.id === id ? { ...s, ...cambios } : s)));

  const subirVideoBunny = async (file: File) => {
    const id = `${file.name}-${file.size}-${Date.now()}`;
    if (file.size > MAX_VIDEO_BUNNY) {
      toast.error(`${file.name}: supera 1 GB`);
      return;
    }
    setSubidas((prev) => [...prev, { id, nombre: file.name, fase: "subiendo", progreso: 0 }]);

    let guid: string | null = null;
    try {
      const res = await fetch("/api/admin/bunny/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: product?.name ? `${product.name} — ${file.name}` : file.name }),
      });
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.error || "No se pudo crear el video");
      guid = datos.guid as string;
      const { url, libraryId, firma, expira } = datos as {
        url: string;
        libraryId: string;
        firma: string;
        expira: number;
      };

      const { Upload } = await import("tus-js-client");
      const upload = new Upload(file, {
        endpoint: TUS_ENDPOINT,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          AuthorizationSignature: firma,
          AuthorizationExpire: String(expira),
          VideoId: guid,
          LibraryId: String(libraryId),
        },
        metadata: { filetype: file.type, title: file.name },
        onProgress: (enviados, total) =>
          actualizarSubida(id, { progreso: Math.round((enviados / total) * 100) }),
        onError: (err) => {
          console.error("Subida a Bunny:", err);
          actualizarSubida(id, { fase: "error", mensaje: "Falló la subida" });
          if (guid) void fetch(`/api/admin/bunny/videos?guid=${guid}`, { method: "DELETE" });
        },
        // Se agrega apenas termina la subida. Bunny lo codifica en cola (15–25
        // min) y mientras tanto la ficha del producto lo oculta sola, así que
        // no hace falta dejar la pestaña abierta esperando.
        onSuccess: () => {
          setImages((prev) => (prev.includes(url) ? prev : [...prev, url]));
          setSubidas((prev) => prev.filter((s) => s.id !== id));
          toast.success(
            `${file.name} subido. Bunny lo está procesando: aparece en la tienda en unos minutos. Ya puedes guardar.`
          );
        },
      });
      upload.start();
    } catch (err) {
      actualizarSubida(id, {
        fase: "error",
        mensaje: err instanceof Error ? err.message : "Error al subir",
      });
      if (guid) void fetch(`/api/admin/bunny/videos?guid=${guid}`, { method: "DELETE" });
    }
  };

  // M2M category state
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    product?.categories.map((c) => c.id) ?? []
  );
  const [primaryCategoryId, setPrimaryCategoryId] = useState<string>(
    product?.primaryCategoryId ?? ""
  );
  const [categoryError, setCategoryError] = useState<string>("");

  // Color variants state
  const [selectedVariants, setSelectedVariants] = useState<ColorVariantProduct[]>(
    product?.variants ?? []
  );
  const [variantSearch, setVariantSearch] = useState("");
  const [variantResults, setVariantResults] = useState<ColorVariantProduct[]>([]);
  const [variantSearchLoading, setVariantSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
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
          stockAlmacen: product.stockAlmacen.toString(),
          stockTienda: product.stockTienda.toString(),
          brand: product.brand || "",
          frameType: product.frameType || "",
          frameMaterial: product.frameMaterial || "",
          frameColor: product.frameColor || "",
          lensType: product.lensType || "",
          gender: product.gender || "",
          dimTotalWidth: product.dimTotalWidth || "",
          dimLensWidth: product.dimLensWidth || "",
          dimFrameHeight: product.dimFrameHeight || "",
          dimBridgeWidth: product.dimBridgeWidth || "",
          dimTempleLength: product.dimTempleLength || "",
          featured: product.featured,
          skipCharges: product.skipCharges,
          active: product.active,
        }
      : { active: true, featured: false, skipCharges: false, stockAlmacen: "0", stockTienda: "0" },
  });

  const sensors = useSensors(useSensor(PointerSensor));

  // Depth per category for the hierarchical list (categories arrive parent-first)
  const depthById = new Map<string, number>();
  for (const cat of categories) {
    const depth =
      cat.parentId && depthById.has(cat.parentId) ? depthById.get(cat.parentId)! + 1 : 0;
    depthById.set(cat.id, depth);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setImages((imgs) => {
        const oldIndex = imgs.indexOf(active.id as string);
        const newIndex = imgs.indexOf(over.id as string);
        return arrayMove(imgs, oldIndex, newIndex);
      });
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setValue("name", name);
    if (!product) {
      setValue("slug", slugify(name));
    }
  };

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      // If removing the primary, reset primary to first remaining
      if (!next.includes(primaryCategoryId)) {
        setPrimaryCategoryId(next[0] ?? "");
      }
      return next;
    });
    setCategoryError("");
  };

  const setPrimary = (id: string) => {
    // Ensure the category is selected when marking as primary
    if (!selectedCategoryIds.includes(id)) {
      setSelectedCategoryIds((prev) => [...prev, id]);
    }
    setPrimaryCategoryId(id);
    setCategoryError("");
  };

  // Variant search debounce
  useEffect(() => {
    if (variantSearch.length < 2) {
      setVariantResults([]);
      setShowDropdown(false);
      return;
    }
    setVariantSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/products?search=${encodeURIComponent(variantSearch)}&admin=true&limit=10`
        );
        if (!res.ok) return;
        const data = await res.json();
        const products: ColorVariantProduct[] = (data.products ?? data).filter(
          (p: ColorVariantProduct) =>
            p.id !== product?.id && !selectedVariants.some((sv) => sv.id === p.id)
        );
        setVariantResults(products);
        setShowDropdown(true);
      } finally {
        setVariantSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [variantSearch, product?.id, selectedVariants]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const addVariant = (v: ColorVariantProduct) => {
    setSelectedVariants((prev) => [...prev, v]);
    setVariantSearch("");
    setVariantResults([]);
    setShowDropdown(false);
  };

  const removeVariant = (id: string) => {
    setSelectedVariants((prev) => prev.filter((v) => v.id !== id));
  };

  const onSubmit = async (data: ProductFormData) => {
    if (selectedCategoryIds.length === 0) {
      setCategoryError("Selecciona al menos una categoría");
      return;
    }
    if (videosPendientes) {
      toast.error("Espera a que terminen de subirse los videos");
      return;
    }
    if (!primeraEsFoto(images)) {
      toast.error(MENSAJE_PRIMERA_FOTO);
      return;
    }

    setLoading(true);
    try {
      const body = {
        ...data,
        price: parseFloat(data.price),
        comparePrice: data.comparePrice ? parseFloat(data.comparePrice) : null,
        stockAlmacen: parseInt(data.stockAlmacen),
        stockTienda: parseInt(data.stockTienda),
        images,
        categoryIds: selectedCategoryIds,
        primaryCategoryId: primaryCategoryId || selectedCategoryIds[0],
        variantIds: selectedVariants.map((v) => v.id),
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
        toast.error(mensajeDeError(err.error));
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

        {/* M2M Category checklist */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categorías * <span className="text-[10px] text-gray-400 font-normal">(⭐ = principal)</span>
          </label>
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-72 overflow-y-auto">
            {categories.length === 0 && (
              <p className="px-3 py-4 text-sm text-gray-400">No hay categorías todavía</p>
            )}
            {categories.map((cat) => {
              const isSelected = selectedCategoryIds.includes(cat.id);
              const isPrimary = primaryCategoryId === cat.id;
              const depth = depthById.get(cat.id) ?? 0;
              return (
                <label
                  key={cat.id}
                  style={{ paddingLeft: `${12 + depth * 20}px` }}
                  className={`flex items-center gap-2.5 pr-3 py-2 cursor-pointer text-sm transition-colors ${
                    isSelected
                      ? "bg-[#111111]/5 text-[#111111]"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleCategory(cat.id)}
                    className="accent-[#111111] shrink-0"
                  />
                  {depth > 0 && <span className="text-gray-300 shrink-0">↳</span>}
                  <span className="flex-1 min-w-0 flex items-baseline gap-2">
                    <span className="truncate">{cat.name}</span>
                    <span className="truncate text-[10px] text-gray-400 font-mono">{cat.slug}</span>
                  </span>
                  {isSelected && (
                    <button
                      type="button"
                      title="Marcar como principal"
                      onClick={(e) => {
                        e.preventDefault();
                        setPrimary(cat.id);
                      }}
                      className={`text-base leading-none shrink-0 transition-opacity ${
                        isPrimary ? "opacity-100" : "opacity-25 hover:opacity-60"
                      }`}
                    >
                      ★
                    </button>
                  )}
                </label>
              );
            })}
          </div>
          {categoryError && (
            <p className="text-xs text-red-500 mt-1">{categoryError}</p>
          )}
        </div>
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
            label="Stock Almacén"
            type="number"
            error={errors.stockAlmacen?.message}
            {...register("stockAlmacen")}
          />
          <Input
            label="Stock Tienda"
            type="number"
            error={errors.stockTienda?.message}
            {...register("stockTienda")}
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
        <h2 className="font-semibold text-[#111111]">Dimensiones</h2>
        <p className="text-sm text-gray-500">Medidas en mm (ej: "52" o "52 mm")</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Input label="A — Ancho total"     {...register("dimTotalWidth")} />
          <Input label="B — Ancho de lente"  {...register("dimLensWidth")} />
          <Input label="C — Alto de armazón" {...register("dimFrameHeight")} />
          <Input label="D — Puente"          {...register("dimBridgeWidth")} />
          <Input label="E — Varillas"        {...register("dimTempleLength")} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="font-semibold text-[#111111]">Imágenes y videos</h2>
        <p className="text-sm text-gray-500">
          La primera imagen es la principal y tiene que ser una foto: el POS, el
          buscador y las variantes la muestran tal cual. Arrastrá para reordenar.
        </p>
        <p className="text-sm text-gray-500">
          {bunnyHabilitado
            ? "Videos: se suben a Bunny Stream en su calidad original. Puedes guardar apenas termina la subida; Bunny los procesa en cola (15–25 min) y hasta entonces no aparecen en la tienda. No arrancan solos, el visitante les da play."
            : "Videos: 720p, hasta 15 s y 15 MB. No arrancan solos, el visitante les da play — cada reproducción gasta cuota de Cloudinary."}
        </p>
        {!primeraEsFoto(images) && (
          <p className="text-sm text-red-600">
            {MENSAJE_PRIMERA_FOTO}. Arrastrá una foto al primer lugar.
          </p>
        )}

        {images.length > 0 && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={images} strategy={horizontalListSortingStrategy}>
              <div className="flex flex-wrap gap-3">
                {images.map((url, i) => (
                  <SortableImage
                    key={url}
                    url={url}
                    index={i}
                    onRemove={() => setImages(images.filter((_, idx) => idx !== i))}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {subidas.length > 0 && (
          <ul className="space-y-2">
            {subidas.map((s) => (
              <li key={s.id} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-gray-700">{s.nombre}</span>
                  {s.fase === "error" ? (
                    <button
                      type="button"
                      onClick={() => setSubidas((prev) => prev.filter((x) => x.id !== s.id))}
                      className="text-xs text-gray-400 hover:text-[#111111] shrink-0"
                    >
                      Descartar
                    </button>
                  ) : (
                    <span className="text-xs text-gray-500 shrink-0">Subiendo {s.progreso}%</span>
                  )}
                </div>
                {s.fase === "error" ? (
                  <p className="text-xs text-red-600 mt-1">{s.mensaje}</p>
                ) : (
                  <div className="mt-1.5 h-1 bg-gray-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-[#111111] transition-all"
                      style={{ width: `${s.progreso}%` }}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {bunnyHabilitado && (
          <>
            <input
              ref={inputVideoRef}
              type="file"
              accept="video/*"
              multiple
              hidden
              onChange={(e) => {
                Array.from(e.target.files ?? []).forEach((f) => void subirVideoBunny(f));
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => inputVideoRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-[#111111] hover:text-[#111111] transition-colors"
            >
              + Subir video
            </button>
          </>
        )}

        <CldUploadWidget
          uploadPreset="luminus-products"
          options={{
            multiple: true,
            // Con Bunny los videos van por su propio botón y Cloudinary queda
            // sólo para fotos. Sin Bunny, "auto" enruta el video a Cloudinary.
            resourceType: bunnyHabilitado ? "image" : "auto",
            clientAllowedFormats: bunnyHabilitado
              ? ["png", "jpg", "jpeg", "webp", "avif"]
              : ["png", "jpg", "jpeg", "webp", "avif", "mp4", "webm", "mov"],
            maxImageFileSize: 10_000_000,
            // La cuenta admite hasta 100 MB, pero el tope real no es ese: en el
            // plan gratuito cada reproducción descarga el archivo entero contra
            // la cuota de ancho de banda, así que 1 GiB = 410 reproducciones de
            // un archivo de 2,5 MB y sólo 70 de uno de 15. 15 MB son ~60 s a
            // 720p, de sobra para un producto, y evita que un clip de 100 MB
            // se coma la cuota del mes en cien visitas.
            maxVideoFileSize: 15_000_000,
          }}
          onSuccess={(result) => {
            const info = result.info as { secure_url: string };
            if (info?.secure_url) setImages((prev) => [...prev, info.secure_url]);
          }}
        >
          {({ open }) => (
            <button
              type="button"
              onClick={() => open()}
              className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-[#111111] hover:text-[#111111] transition-colors"
            >
              {bunnyHabilitado ? "+ Subir imagen" : "+ Subir imagen o video"}
            </button>
          )}
        </CldUploadWidget>

        <button
          type="button"
          onClick={() => setShowMediaLibrary(true)}
          className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-[#111111] hover:text-[#111111] transition-colors"
        >
          + Seleccionar de galería
        </button>

        <MediaLibraryModal
          open={showMediaLibrary}
          onClose={() => setShowMediaLibrary(false)}
          currentImages={images}
          onConfirm={(newUrls) => setImages((prev) => [...prev, ...newUrls])}
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

        <label className="mt-5 flex items-start gap-3 cursor-pointer border border-amber-300 bg-amber-50 p-4 rounded-lg">
          <input
            type="checkbox"
            {...register("skipCharges")}
            className="mt-0.5 accent-[#b45309]"
          />
          <span className="text-sm">
            <span className="font-medium text-[#111111]">Vender sin envío ni comisión</span>
            <span className="block mt-1 text-gray-600 leading-relaxed">
              El comprador paga exactamente el precio del producto: sin costo de envío y sin
              comisión de la pasarela. Pensado para hacer pagos de prueba reales con importes
              mínimos.
            </span>
            <span className="block mt-1.5 text-amber-800 leading-relaxed">
              Sólo se aplica si <strong>todo</strong> el carrito está marcado así. Recuerda que el
              producto es visible en la tienda mientras esté activo: desactívalo cuando termines de
              probar.
            </span>
          </span>
        </label>
      </div>

      {/* Color variants — only shown when editing an existing product */}
      {product && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-[#111111]">Variantes de color</h2>
          <p className="text-sm text-gray-500">
            Vincula productos que son el mismo armazón en distintos colores.
          </p>

          {/* Selected chips */}
          {selectedVariants.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedVariants.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5"
                >
                  {v.images[0] && (
                    <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0">
                      <Image
                        src={v.images[0]}
                        alt={v.name}
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#111111] truncate max-w-[120px]">
                      {v.name}
                    </p>
                    {v.frameColor && (
                      <p className="text-[10px] text-gray-400">{v.frameColor}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVariant(v.id)}
                    className="text-gray-400 hover:text-[#111111] ml-1 text-sm leading-none"
                    aria-label="Quitar variante"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative" ref={dropdownRef}>
            <Input
              label="Buscar producto para vincular"
              value={variantSearch}
              onChange={(e) => setVariantSearch(e.target.value)}
              placeholder="Escribe al menos 2 caracteres..."
              autoComplete="off"
            />
            {variantSearchLoading && (
              <p className="text-xs text-gray-400 mt-1">Buscando...</p>
            )}
            {showDropdown && variantResults.length > 0 && (
              <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {variantResults.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => addVariant(v)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left"
                  >
                    {v.images[0] && (
                      <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={v.images[0]}
                          alt={v.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-[#111111]">{v.name}</p>
                      {v.frameColor && (
                        <p className="text-xs text-gray-400">{v.frameColor}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {showDropdown && variantResults.length === 0 && !variantSearchLoading && (
              <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2">
                <p className="text-sm text-gray-400">Sin resultados</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading} disabled={videosPendientes}>
          {product ? "Actualizar producto" : "Crear producto"}
        </Button>
      </div>
    </form>
  );
}
