"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  GripVertical,
  ChevronRight,
  ChevronDown,
  Navigation,
} from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
  _count: { products: number };
}

interface CategoryOrderProps {
  categories: Category[];
}

// ─── Root category row ────────────────────────────────────────────────────────

function SortableRootRow({
  cat,
  childCount,
  expanded,
  onToggle,
}: {
  cat: Category;
  childCount: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: cat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-5 py-3.5 border-b border-[#111111]/6 bg-white hover:bg-[#f8f7f4]/50 transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-[#111111]/20 hover:text-[#111111]/50 transition-colors touch-none flex-shrink-0"
        title="Arrastrar para reordenar"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <p className="flex-1 text-sm font-medium text-[#111111] leading-tight">{cat.name}</p>
      {childCount > 0 ? (
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 text-[10px] text-[#111111]/40 hover:text-[#111111]/70 bg-[#f8f7f4] hover:bg-[#f0ede6] px-2 py-0.5 transition-colors flex-shrink-0"
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {childCount} sub{childCount === 1 ? "cat." : "cats."}
        </button>
      ) : (
        <span className="text-[10px] text-[#111111]/25 bg-[#f8f7f4] px-2 py-0.5 flex-shrink-0">
          {cat._count.products} prod.
        </span>
      )}
    </div>
  );
}

// ─── Subcategory row ──────────────────────────────────────────────────────────

function SortableSubRow({ cat }: { cat: Category }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: cat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 pl-12 pr-5 py-2.5 border-b border-[#111111]/6 bg-[#fafaf8] hover:bg-[#f5f3ef] transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-[#111111]/20 hover:text-[#111111]/50 transition-colors touch-none flex-shrink-0"
        title="Arrastrar para reordenar"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <span className="text-[11px] text-[#111111]/40 flex-shrink-0">↳</span>
      <p className="flex-1 text-sm text-[#111111]/80">{cat.name}</p>
      <span className="text-[10px] text-[#111111]/25">{cat._count.products} prod.</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CategoryOrder({ categories }: CategoryOrderProps) {
  const router = useRouter();
  const [items, setItems] = useState<Category[]>(categories);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const rootItems = items.filter((c) => c.parentId === null);
  const childrenOf = new Map<string | null, Category[]>();
  for (const cat of items) {
    const key = cat.parentId ?? null;
    if (!childrenOf.has(key)) childrenOf.set(key, []);
    childrenOf.get(key)!.push(cat);
  }

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const persist = async (list: Category[]) => {
    try {
      const res = await fetch("/api/categories/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(list.map((c, idx) => ({ id: c.id, sortOrder: idx }))),
      });
      if (!res.ok) throw new Error();
      toast.success("Orden guardado");
      router.refresh();
    } catch {
      toast.error("Error al guardar el orden");
      setItems(categories);
    }
  };

  // Reorder root categories
  const handleRootDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = rootItems.findIndex((c) => c.id === active.id);
    const newIndex = rootItems.findIndex((c) => c.id === over.id);
    const newRootItems = arrayMove(rootItems, oldIndex, newIndex);
    const nonRootItems = items.filter((c) => c.parentId !== null);
    setItems([...newRootItems, ...nonRootItems]);
    persist(newRootItems);
  };

  // Reorder subcategories within a parent
  const handleSubDragEnd = (parentId: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const subs = childrenOf.get(parentId) ?? [];
    const oldIndex = subs.findIndex((c) => c.id === active.id);
    const newIndex = subs.findIndex((c) => c.id === over.id);
    const newSubs = arrayMove(subs, oldIndex, newIndex);

    setItems((prev) => {
      const others = prev.filter((c) => c.parentId !== parentId);
      return [...others, ...newSubs];
    });
    persist(newSubs);
  };

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/categorias"
        className="inline-flex items-center gap-1.5 text-[11px] text-[#111111]/50 hover:text-[#111111] transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver a categorías
      </Link>

      <div className="bg-white border border-[#111111]/6">
        <div className="flex items-start gap-3 px-5 py-4 border-b border-[#111111]/6">
          <Navigation className="h-3.5 w-3.5 text-[#d4af37] mt-0.5" />
          <div>
            <p className="text-[10px] font-medium text-[#111111]/60 uppercase tracking-[0.2em]">
              Orden del menú de navegación
            </p>
            <p className="text-[10px] text-[#111111]/30 mt-0.5">
              Arrastrá para cambiar el orden en que las categorías aparecen en el header del sitio.
              El cambio se guarda automáticamente.
            </p>
          </div>
        </div>

        {rootItems.length === 0 ? (
          <div className="px-5 py-8 text-[11px] text-[#111111]/30">Sin categorías raíz todavía</div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleRootDragEnd}>
            <SortableContext items={rootItems.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              {rootItems.map((cat) => {
                const subs = childrenOf.get(cat.id) ?? [];
                const isExpanded = expanded.has(cat.id);
                return (
                  <div key={cat.id}>
                    <SortableRootRow
                      cat={cat}
                      childCount={subs.length}
                      expanded={isExpanded}
                      onToggle={() => toggleExpand(cat.id)}
                    />
                    {isExpanded && subs.length > 0 && (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(e) => handleSubDragEnd(cat.id, e)}
                      >
                        <SortableContext
                          items={subs.map((c) => c.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {subs.map((sub) => (
                            <SortableSubRow key={sub.id} cat={sub} />
                          ))}
                        </SortableContext>
                      </DndContext>
                    )}
                  </div>
                );
              })}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
