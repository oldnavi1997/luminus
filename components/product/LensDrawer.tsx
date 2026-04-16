"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ArrowLeft, ChevronRight, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cart";
import { ProductWithCategory, PrescriptionData } from "@/types";
import { formatPEN } from "@/lib/utils";
import { calcularDesglose } from "@/hooks/useCalculoLunas";

// ─── Lens tree data ────────────────────────────────────────────────────────────

type LensAction = "direct" | "form";

interface SubVariant {
  id: string;
  label: string;
  description?: string | string[];
  price?: number;
  priceRange?: string;
  note?: string;
  action: LensAction;
}

interface SubType {
  id: string;
  label: string;
  description?: string | string[];
  price?: number;
  priceRange?: string;
  action: LensAction;
  variants?: SubVariant[];
}

interface Level1Option {
  id: "sin_medida" | "con_medida" | "solo_montura";
  label: string;
  description: string;
  price?: number;
  action: LensAction;
  subTypes?: SubType[];
}

const LENS_TREE: Level1Option[] = [
  {
    id: "sin_medida",
    label: "Sin medida",
    description: "Lunas sin graduación para uso cotidiano",
    action: "direct",
    subTypes: [
      {
        id: "descanso",
        label: "Descanso",
        description: "Luna sin graduación para descanso visual, poseen Filtro de luz azul, Antireflex y UV400",
        price: 80,
        action: "direct",
      },
      {
        id: "fotocromatico",
        label: "Fotocromático clásico",
        description: [
          "Luna fotocromática sin graduación",
          "Se oscurece automáticamente con la luz solar",
          "Regresa a claro en interiores",
          "Protección UV integrada",
        ],
        price: 200,
        action: "direct",
      },
      {
        id: "transition",
        label: "Transition Gen S",
        description: [
          "Última generación de lentes fotocromáticos",
          "Activación y recuperación más rápida",
          "Disponible con antirreflejo Base Kodak o Sapphire",
        ],
        action: "direct",
        variants: [
          {
            id: "ar16",
            label: "Base Kodak",
            description: [
              "Se oscurecen al aire libre y recuperan el tono en interiores",
              "Se oscurecen en segundos y vuelven a ser claros más rápido que nunca",
              "Ideales para personas con exposición a dispositivos digitales",
              "Bloquean el 100% de los rayos UV y UVB",
            ],
            price: 650,
            action: "direct",
          },
          {
            id: "sapphire",
            label: "Sapphire",
            description: [
              "Capa adicional de protección sobre tus lentes",
              "Elimina los reflejos molestos",
              "Hidrofóbico y oleofóbico: repele agua, suciedad y grasa",
              "Lentes más limpios por más tiempo",
              "Visión clara y nítida, limpieza más rápida y sencilla",
            ],
            price: 850,
            action: "direct",
          },
        ],
      },
    ],
  },
  {
    id: "con_medida",
    label: "Con medida",
    description: "Luna graduada según tu prescripción óptica",
    action: "direct",
    subTypes: [
      {
        id: "nk",
        label: "Lunas NK",
        description: [
          "Luna orgánica de alta calidad",
          "Ligera y resistente a los impactos",
          "Buena claridad óptica",
        ],
        priceRange: "S/140 - S/230",
        action: "form",
      },
      {
        id: "policarbonato",
        label: "Policarbonato",
        description: [
          "Material resistente a impactos",
          "Ideal para uso diario y actividades activas",
          "Liviano y duradero",
        ],
        action: "form",
        variants: [
          {
            id: "convencional",
            label: "Convencional",
            description: [
              "Luna policarbonato estándar",
              "Tratamiento básico de dureza",
              "Excelente relación calidad-precio",
            ],
            priceRange: "S/190 - S/280",
            action: "form",
          },
          {
            id: "crizal_sapphire",
            label: "Crizal Sapphire",
            description: [
              "Antirreflejo premium de alta tecnología",
              "Protección UV superior",
              "Mayor resistencia a rayaduras",
            ],
            price: 330,
            note: "Disponible hasta Cilindro -2",
            action: "form",
          },
        ],
      },
      {
        id: "fotocromatico",
        label: "Fotocromático clásico",
        description: [
          "Se oscurece automáticamente con la luz solar",
          "Regresa a claro en interiores",
          "Protección UV integrada",
        ],
        action: "form",
        variants: [
          {
            id: "con_ficha",
            label: "Con ficha",
            description: [
              "Luna fotocromática con tu graduación",
              "Lente correctivo y de sol en uno",
              "Comodidad visual en todo momento",
            ],
            priceRange: "S/250 - S/320",
            action: "form",
          },
        ],
      },
      {
        id: "transition",
        label: "Transition Gen S",
        description: [
          "Última generación de lentes fotocromáticos",
          "Activación y recuperación más rápida",
          "Disponible con antirreflejo Base Kodak o Sapphire",
        ],
        action: "form",
        variants: [
          {
            id: "ar16",
            label: "Base Kodak",
            description: [
              "Se oscurecen al aire libre y recuperan el tono en interiores",
              "Se oscurecen en segundos y vuelven a ser claros más rápido que nunca",
              "Ideales para personas con exposición a dispositivos digitales",
              "Bloquean el 100% de los rayos UV y UVB",
              "Lentes con medida y de sol a la vez",
            ],
            price: 650,
            action: "form",
          },
          {
            id: "sapphire",
            label: "Sapphire",
            description: [
              "Capa adicional de protección sobre tus lentes",
              "Elimina los reflejos molestos",
              "Hidrofóbico y oleofóbico: repele agua, suciedad y grasa",
              "Lentes más limpios por más tiempo",
              "Visión clara y nítida, limpieza más rápida y sencilla",
            ],
            price: 850,
            action: "form",
          },
        ],
      },
      {
        id: "alto_indice",
        label: "Alto índice",
        description: [
          "Para graduaciones altas (esfera > ±4.00)",
          "Lentes más delgadas y ligeras que las convencionales",
          "Mayor confort y estética en armazones de cualquier tipo",
        ],
        price: 650,
        action: "form",
      },
    ],
  },
  {
    id: "solo_montura",
    label: "Solo montura",
    description: "Solo montura — se recomienda el cambio de las lunas base del marco",
    action: "direct",
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function DescriptionList({ desc }: { desc: string | string[] }) {
  if (Array.isArray(desc)) {
    return (
      <ul className="space-y-0.5 mt-1">
        {desc.map((line, i) => (
          <li key={i} className="flex items-start gap-1.5 text-[11px] text-[#334155]/50 leading-snug">
            <span className="text-[#d4af37]/70 mt-[2px] flex-shrink-0">·</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    );
  }
  return <p className="text-[11px] text-[#334155]/50 leading-snug mt-1">{desc}</p>;
}

function getLensLabel(
  lensType: string,
  subType: string | null,
  variant: string | null
): string {
  const parts: string[] = [];
  const l1 = LENS_TREE.find((o) => o.id === lensType);
  if (!l1) return "";
  parts.push(l1.label);
  if (subType) {
    const st = l1.subTypes?.find((s) => s.id === subType);
    if (st) {
      parts.push(st.label);
      if (variant) {
        const v = st.variants?.find((v) => v.id === variant);
        if (v) parts.push(v.label);
      }
    }
  }
  return parts.join(" · ");
}

function resolvePricing(
  lensType: string,
  subType: string | null,
  variant: string | null
): { lensPrice: number; lensPriceRange?: string } {
  const l1 = LENS_TREE.find((o) => o.id === lensType);
  if (!l1) return { lensPrice: 0 };

  if (lensType === "solo_montura") return { lensPrice: 0 };

  if (!subType) return { lensPrice: 0 };
  const st = l1.subTypes?.find((s) => s.id === subType);
  if (!st) return { lensPrice: 0 };

  if (!variant || !st.variants) {
    // leaf subtype
    if (st.price !== undefined) return { lensPrice: st.price };
    if (st.priceRange) return { lensPrice: 0, lensPriceRange: st.priceRange };
    return { lensPrice: 0 };
  }

  const v = st.variants.find((v) => v.id === variant);
  if (!v) return { lensPrice: 0 };
  if (v.price !== undefined) return { lensPrice: v.price };
  if (v.priceRange) return { lensPrice: 0, lensPriceRange: v.priceRange };
  return { lensPrice: 0 };
}

const EMPTY_PRESCRIPTION: PrescriptionData = {
  od: { sphere: "", cylinder: "", axis: "" },
  oi: { sphere: "", cylinder: "", axis: "" },
  add: "",
  pd: "",
};

// ─── Prescription select options ───────────────────────────────────────────────

const SPHERE_OPTIONS = (() => {
  const opts: string[] = [];
  for (let v = -600; v <= 500; v += 25) {
    const n = v / 100;
    opts.push(n > 0 ? `+${n.toFixed(2)}` : n.toFixed(2));
  }
  return opts;
})();

const CYLINDER_OPTIONS = (() => {
  const opts: string[] = [];
  for (let v = 0; v >= -600; v -= 25) {
    opts.push((v / 100).toFixed(2));
  }
  return opts;
})();

const AXIS_OPTIONS = Array.from({ length: 180 }, (_, i) => String(i + 1));

const PD_OPTIONS = (() => {
  const opts: string[] = [];
  for (let v = 50; v <= 80; v += 1) {
    opts.push(String(v));
  }
  return opts;
})();

const SELECT_CLASS =
  "w-full px-2 py-2 text-[12px] border border-[#d5d5d5] focus:border-[#d4af37] focus:outline-none bg-white rounded-sm transition-colors appearance-none cursor-pointer text-[#334155]";

// ─── Main component ────────────────────────────────────────────────────────────

interface LensDrawerProps {
  product: ProductWithCategory;
  isOpen: boolean;
  onClose: () => void;
}

type Step = "level1" | "level2" | "level3" | "form";

export function LensDrawer({ product, isOpen, onClose }: LensDrawerProps) {
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);

  const [step, setStep] = useState<Step>("level1");
  const [lensType, setLensType] = useState<string | null>(null);
  const [subType, setSubType] = useState<string | null>(null);
  const [variant, setVariant] = useState<string | null>(null);
  const [prescription, setPrescription] = useState<PrescriptionData>(EMPTY_PRESCRIPTION);
  const [prescriptionUrl] = useState<string>("");

  const reset = useCallback(() => {
    setStep("level1");
    setLensType(null);
    setSubType(null);
    setVariant(null);
    setPrescription(EMPTY_PRESCRIPTION);
  }, []);

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(reset, 400);
  }, [onClose, reset]);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, handleClose]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleAddToCart = useCallback(
    (overrideLensType?: string, overrideSubType?: string | null, overrideVariant?: string | null) => {
      const lt = overrideLensType ?? lensType!;
      const st = overrideSubType !== undefined ? overrideSubType : subType;
      const va = overrideVariant !== undefined ? overrideVariant : variant;

      let { lensPrice, lensPriceRange } = resolvePricing(lt, st, va);

      // Si solo hay rango (no precio fijo) y la receta está completa, calcular precio exacto
      if (lensPrice === 0 && lensPriceRange && isPrescriptionFilled(prescription)) {
        const d = calcularDesglose(
          prescription.od.sphere, prescription.od.cylinder,
          prescription.oi.sphere, prescription.oi.cylinder
        );
        if (d.hasValues && d.total > 0) {
          lensPrice = d.total;
          lensPriceRange = undefined;
        }
      }

      const cartKey = `${product.id}_${lt}_${st ?? ""}_${va ?? ""}`;

      addItem({
        id: product.id,
        cartKey,
        name: product.name,
        price: Number(product.price),
        image: product.images[0],
        imageUrl: product.images[0],
        quantity: 1,
        slug: product.slug,
        stock: product.stock,
        lensType: lt as CartItem["lensType"],
        lensSubType: st ?? undefined,
        lensVariant: va ?? undefined,
        lensPrice,
        lensPriceRange,
        prescriptionUrl: prescriptionUrl || undefined,
        prescription: isPrescriptionFilled(prescription) ? prescription : undefined,
      });

      openDrawer();
      toast.success(`${product.name} agregado al carrito`);
      handleClose();
    },
    [lensType, subType, variant, prescription, prescriptionUrl, product, addItem, openDrawer, handleClose]
  );

  // ── Level 1 selection ────────────────────────────────────────────────────────
  const handleLevel1 = (opt: Level1Option) => {
    setLensType(opt.id);
    if (opt.subTypes && opt.subTypes.length > 0) {
      setStep("level2");
    } else {
      handleAddToCart(opt.id, null, null);
    }
  };

  // ── Level 2 selection ────────────────────────────────────────────────────────
  const handleLevel2 = (st: SubType) => {
    setSubType(st.id);
    if (st.variants && st.variants.length > 0) {
      setStep("level3");
    } else if (st.action === "form") {
      setStep("form");
    } else {
      handleAddToCart(lensType!, st.id, null);
    }
  };

  // ── Level 3 selection ────────────────────────────────────────────────────────
  const handleLevel3 = (v: SubVariant) => {
    setVariant(v.id);
    if (v.action === "form") {
      setStep("form");
    } else {
      handleAddToCart(lensType!, subType, v.id);
    }
  };

  const handleBack = () => {
    if (step === "form") {
      const l1 = LENS_TREE.find((o) => o.id === lensType);
      const st = l1?.subTypes?.find((s) => s.id === subType);
      setStep(st?.variants ? "level3" : "level2");
      setVariant(null);
    } else if (step === "level3") {
      setStep("level2");
      setVariant(null);
    } else if (step === "level2") {
      setStep("level1");
      setSubType(null);
    }
  };

  const l1Option = LENS_TREE.find((o) => o.id === lensType);
  const stOption = l1Option?.subTypes?.find((s) => s.id === subType);
  const currentVariants = stOption?.variants ?? [];
  const activeVariant = currentVariants.find((v) => v.id === variant);
  const { lensPrice: previewPrice, lensPriceRange: previewRange } = step === "form"
    ? resolvePricing(lensType ?? "", subType, variant)
    : { lensPrice: 0, lensPriceRange: undefined };

  const canSubmitForm = isPrescriptionFilled(prescription);

  const stepTitle: Record<Step, string> = {
    level1: "Elige el tipo de luna",
    level2: "Tipo de luna",
    level3: `Variante de ${stOption?.label ?? ""}`,
    form: "Datos de tu receta",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={`fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] transition-opacity duration-400 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Seleccionar lunas"
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[460px] flex flex-col shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ backgroundColor: "#F8F7F4" }}
      >
        {/* Línea dorada superior */}
        <div className="h-[2px] bg-gradient-to-r from-[#d4af37]/0 via-[#d4af37] to-[#d4af37]/0" />

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: "1px solid #d5d5d5" }}
        >
          <div className="flex items-center gap-3">
            {step !== "level1" && (
              <button
                onClick={handleBack}
                className="w-8 h-8 flex items-center justify-center text-[#334155]/50 hover:text-[#1e293b] hover:bg-[#eaeaea] rounded-full transition-all duration-200"
                aria-label="Volver"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div>
              <h6
                className="text-[15px] font-light text-[#1e293b] tracking-[0.15em] uppercase"
                style={{ fontFamily: "var(--font-inter, sans-serif)" }}
              >
                {stepTitle[step]}
              </h6>
              {step !== "level1" && (
                <p className="text-[10px] text-[#334155]/50 tracking-wide mt-0.5">
                  {getLensLabel(lensType ?? "", subType, variant || null)}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center text-[#334155]/40 hover:text-[#1e293b] hover:bg-[#eaeaea] rounded-full transition-all duration-200"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1.5 px-6 py-3">
          {(["level1", "level2", "level3", "form"] as Step[]).map((s, i) => {
            const steps: Step[] = ["level1", "level2", "level3", "form"];
            const currentIdx = steps.indexOf(step);
            const isDone = i < currentIdx;
            const isCurrent = s === step;
            // hide level3 dot if no variants at current path
            if (s === "level3" && currentVariants.length === 0 && step !== "level3") return null;
            return (
              <div
                key={s}
                className={`h-1 rounded-full transition-all duration-300 ${
                  isCurrent
                    ? "w-6 bg-[#d4af37]"
                    : isDone
                    ? "w-3 bg-[#d4af37]/50"
                    : "w-3 bg-[#d5d5d5]"
                }`}
              />
            );
          })}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">

          {/* ── Level 1 ── */}
          {step === "level1" && (
            <div className="space-y-3">
              {LENS_TREE.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleLevel1(opt)}
                  className="w-full text-left p-5 border border-[#d5d5d5] hover:border-[#d4af37] hover:bg-white transition-all duration-200 group rounded-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <p
                        className="text-[14px] font-medium text-[#1e293b] group-hover:text-[#d4af37] transition-colors"
                        style={{ fontFamily: "var(--font-inter, sans-serif)" }}
                      >
                        {opt.label}
                      </p>
                      <p className="text-[11px] text-[#334155]/50 leading-snug">{opt.description}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
                      {opt.price !== undefined ? (
                        <span className="text-[12px] font-semibold text-[#d4af37]">
                          +{formatPEN(opt.price)}
                        </span>
                      ) : opt.id === "con_medida" ? (
                        <span className="text-[10px] text-[#334155]/40 uppercase tracking-wide">
                          desde S/140
                        </span>
                      ) : opt.id === "sin_medida" ? (
                        <span className="text-[10px] text-[#334155]/40 uppercase tracking-wide">
                          desde S/80
                        </span>
                      ) : null}
                      <ChevronRight className="h-4 w-4 text-[#334155]/30 group-hover:text-[#d4af37] transition-colors" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* ── Level 2 ── */}
          {step === "level2" && l1Option?.subTypes && (
            <div className="space-y-2">
              <p className="text-[11px] text-[#334155]/50 uppercase tracking-[0.15em] mb-4">
                Selecciona el material
              </p>
              {l1Option.subTypes.map((st) => (
                <button
                  key={st.id}
                  onClick={() => handleLevel2(st)}
                  className="w-full text-left p-4 border border-[#d5d5d5] hover:border-[#d4af37] hover:bg-white transition-all duration-200 group rounded-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <p
                        className="text-[13px] font-medium text-[#1e293b] group-hover:text-[#d4af37] transition-colors"
                        style={{ fontFamily: "var(--font-inter, sans-serif)" }}
                      >
                        {st.label}
                      </p>
                      {st.description && <DescriptionList desc={st.description} />}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
                      {st.price !== undefined ? (
                        <span className="text-[11px] font-semibold text-[#d4af37]">
                          {formatPEN(st.price)}
                        </span>
                      ) : st.priceRange ? (
                        <span className="text-[10px] text-[#334155]/50">{st.priceRange}</span>
                      ) : null}
                      <ChevronRight className="h-3.5 w-3.5 text-[#334155]/30 group-hover:text-[#d4af37] transition-colors" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* ── Level 3 ── */}
          {step === "level3" && currentVariants.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] text-[#334155]/50 uppercase tracking-[0.15em] mb-4">
                Selecciona la variante
              </p>
              {currentVariants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleLevel3(v)}
                  className="w-full text-left px-4 py-3.5 border border-[#d5d5d5] hover:border-[#d4af37] hover:bg-white transition-all duration-200 group rounded-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <p
                        className="text-[13px] font-medium text-[#1e293b] group-hover:text-[#d4af37] transition-colors"
                        style={{ fontFamily: "var(--font-inter, sans-serif)" }}
                      >
                        {v.label}
                      </p>
                      {v.description && <DescriptionList desc={v.description} />}
                      {v.note && (
                        <p className="text-[10px] text-amber-600/70 font-medium">{v.note}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
                      {v.price !== undefined ? (
                        <span className="text-[11px] font-semibold text-[#d4af37]">
                          {formatPEN(v.price)}
                        </span>
                      ) : v.priceRange ? (
                        <span className="text-[10px] text-[#334155]/50">{v.priceRange}</span>
                      ) : null}
                      <ChevronRight className="h-3.5 w-3.5 text-[#334155]/30 group-hover:text-[#d4af37] transition-colors" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* ── Form / Upload ── */}
          {step === "form" && (
            <div className="space-y-6">
              {/* WhatsApp ficha */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-sm space-y-3">
                <p className="text-[12px] text-emerald-800 leading-snug">
                  ¿Tienes tu ficha de ojos? Envíanosla por WhatsApp y la adjuntamos a tu pedido.
                </p>
                <a
                  href="https://wa.me/51932079598"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white text-[11px] font-semibold uppercase tracking-[0.15em] rounded-sm transition-colors duration-200"
                >
                  <MessageCircle className="h-4 w-4" />
                  Enviar ficha por WhatsApp
                </a>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#d5d5d5]" />
                <span className="text-[10px] text-[#334155]/40 uppercase tracking-[0.15em]">o completa los datos</span>
                <div className="flex-1 h-px bg-[#d5d5d5]" />
              </div>

              {/* Prescription form */}
              <div className="space-y-4">
                {(["od", "oi"] as const).map((eye) => (
                  <div key={eye} className="space-y-2">
                    <p className="text-[11px] font-medium text-[#334155]/60 uppercase tracking-[0.15em]">
                      {eye === "od" ? "Ojo derecho (OD)" : "Ojo izquierdo (OI)"}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {/* Esfera */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-[#334155]/40 uppercase tracking-wide block">Esfera</label>
                        <select
                          value={prescription[eye].sphere}
                          onChange={(e) =>
                            setPrescription((prev) => ({ ...prev, [eye]: { ...prev[eye], sphere: e.target.value } }))
                          }
                          className={SELECT_CLASS}
                        >
                          <option value="">—</option>
                          {SPHERE_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>

                      {/* Cilindro */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-[#334155]/40 uppercase tracking-wide block">Cilindro</label>
                        <select
                          value={prescription[eye].cylinder}
                          onChange={(e) =>
                            setPrescription((prev) => ({ ...prev, [eye]: { ...prev[eye], cylinder: e.target.value } }))
                          }
                          className={SELECT_CLASS}
                        >
                          <option value="">—</option>
                          {CYLINDER_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>

                      {/* Eje */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-[#334155]/40 uppercase tracking-wide block">Eje</label>
                        <select
                          value={prescription[eye].axis}
                          onChange={(e) =>
                            setPrescription((prev) => ({ ...prev, [eye]: { ...prev[eye], axis: e.target.value } }))
                          }
                          className={SELECT_CLASS}
                        >
                          <option value="">—</option>
                          {AXIS_OPTIONS.map((v) => <option key={v} value={v}>{v}°</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Distancia pupilar */}
                <div className="space-y-1">
                  <label className="text-[10px] text-[#334155]/40 uppercase tracking-wide block">
                    Dist. pupilar (PD)
                  </label>
                  <select
                    value={prescription.pd ?? ""}
                    onChange={(e) => setPrescription((prev) => ({ ...prev, pd: e.target.value }))}
                    className={SELECT_CLASS}
                  >
                    <option value="">—</option>
                    {PD_OPTIONS.map((v) => <option key={v} value={v}>{v} mm</option>)}
                  </select>
                </div>

                {/* Price preview */}
                {(() => {
                  const d = calcularDesglose(
                    prescription.od.sphere, prescription.od.cylinder,
                    prescription.oi.sphere, prescription.oi.cylinder
                  );
                  const showCalc = d.hasValues;
                  const monturaCost = Number(product.price);
                  const lensCost = showCalc ? d.total : previewPrice;
                  const totalCost = monturaCost + lensCost;
                  return (
                    <div className="p-4 bg-white border border-[#d5d5d5] rounded-sm space-y-2">
                      {/* Montura */}
                      <div className="flex items-center justify-between text-[11px] text-[#334155]/50">
                        <span className="uppercase tracking-[0.15em]">Montura</span>
                        <span>{formatPEN(monturaCost)}</span>
                      </div>
                      {/* Lunas */}
                      <div className="flex items-center justify-between text-[11px] text-[#334155]/50">
                        <span className="uppercase tracking-[0.15em]">{getLensLabel(lensType ?? "", subType, variant)}</span>
                        <span>
                          {showCalc ? formatPEN(d.total) : previewRange ? previewRange : formatPEN(previewPrice)}
                        </span>
                      </div>
                      {previewRange && !showCalc ? (
                        <p className="text-[10px] text-[#334155]/40">
                          El precio exacto de lunas se confirma según tu graduación
                        </p>
                      ) : null}
                      {/* Total */}
                      {(showCalc || !previewRange) && (
                        <div className="flex items-center justify-between pt-2 border-t border-[#d5d5d5]">
                          <span className="text-[11px] font-semibold text-[#1e293b] uppercase tracking-[0.15em]">Total</span>
                          <span className="text-[14px] font-semibold text-[#d4af37]">{formatPEN(totalCost)}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

              </div>
            </div>
          )}
        </div>

        {/* Footer — form submit */}
        {step === "form" && (
          <div className="px-6 py-5 space-y-3" style={{ borderTop: "1px solid #d5d5d5", backgroundColor: "#eaeaea" }}>
            {!canSubmitForm && (
              <p className="text-[10px] text-[#334155]/50 text-center tracking-wide">
                Completa al menos un campo de la receta para continuar
              </p>
            )}
            <button
              onClick={() => handleAddToCart()}
              disabled={!canSubmitForm}
              className="flex items-center justify-center w-full h-12 bg-[#1e293b] text-white text-[11px] font-bold uppercase tracking-[0.25em] hover:bg-[#334155] transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Agregar al pedido
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Type helper (used inside component) ─────────────────────────────────────

type CartItem = import("@/types").CartItem;

function isPrescriptionFilled(p: PrescriptionData): boolean {
  return !!(
    p.od.sphere || p.od.cylinder || p.od.axis ||
    p.oi.sphere || p.oi.cylinder || p.oi.axis ||
    p.add || p.pd
  );
}
