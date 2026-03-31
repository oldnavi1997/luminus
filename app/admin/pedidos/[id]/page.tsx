"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OrderWithItems } from "@/types";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/OrderStatusBadge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { formatPEN } from "@/lib/utils";
import { OrderStatus } from "@/app/generated/prisma/client";
import { PrescriptionData } from "@/types";

const LENS_LABELS: Record<string, string> = {
  descanso: "Descanso",
  con_medida: "Con medida",
  solo_montura: "Solo montura",
  nk: "Lunas NK",
  policarbonato: "Policarbonato",
  fotocromatico: "Fotocromático clásico",
  transition: "Transition Gen S",
  alto_indice: "Alto índice",
  convencional: "Convencional",
  crizal_sapphire: "Crizal Sapphire",
  sin_medida: "Sin medida",
  con_ficha: "Con ficha",
  ar16: "Base Kodak",
  sapphire: "Sapphire",
};

function buildLensLabel(type?: string | null, sub?: string | null, variant?: string | null): string | null {
  const parts = [type, sub, variant].filter(Boolean);
  if (parts.length === 0) return null;
  return parts.map((k) => LENS_LABELS[k!] ?? k).join(" · ");
}

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus | "">("");
  const router = useRouter();

  useEffect(() => {
    params.then(({ id }) => {
      fetch(`/api/orders/${id}`)
        .then((r) => r.json())
        .then((data) => {
          setOrder(data);
          setNewStatus(data.orderStatus);
          setLoading(false);
        });
    });
  }, [params]);

  const handleUpdateStatus = async () => {
    if (!order || !newStatus) return;
    setUpdating(true);
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderStatus: newStatus }),
    });
    setUpdating(false);
    if (res.ok) {
      toast.success("Estado actualizado");
      router.refresh();
    } else {
      toast.error("Error al actualizar");
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Cargando...</div>;
  if (!order) return <div className="text-center py-12 text-gray-400">Orden no encontrada</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">{order.orderNumber}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(order.createdAt).toLocaleDateString("es-PE", { dateStyle: "full" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PaymentStatusBadge status={order.paymentStatus} />
          <OrderStatusBadge status={order.orderStatus} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-[#111111] mb-4">Datos de envío</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Nombre</dt>
              <dd className="font-medium">{order.shippingName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Email</dt>
              <dd className="font-medium">{order.shippingEmail}</dd>
            </div>
            {order.shippingPhone && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Teléfono</dt>
                <dd className="font-medium">{order.shippingPhone}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500">Dirección</dt>
              <dd className="font-medium text-right max-w-[200px]">
                {order.shippingAddress}, {order.shippingCity}, {order.shippingProvince} ({order.shippingPostal})
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-[#111111] mb-4">Actualizar estado</h2>
          <div className="space-y-3">
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
            >
              <option value="PENDING">Pendiente</option>
              <option value="PAID">Pagado</option>
              <option value="PROCESSING">Procesando</option>
              <option value="SHIPPED">Enviado</option>
              <option value="DELIVERED">Entregado</option>
              <option value="CANCELLED">Cancelado</option>
              <option value="REFUNDED">Reembolsado</option>
            </Select>
            <Button onClick={handleUpdateStatus} loading={updating} className="w-full">
              Actualizar estado
            </Button>
          </div>
          {order.mpPaymentId && (
            <div className="mt-4 pt-4 border-t border-gray-100 text-sm">
              <p className="text-gray-500">ID de pago MP: <span className="font-mono">{order.mpPaymentId}</span></p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-[#111111] mb-4">Productos</h2>
        <div className="space-y-4">
          {order.items.map((item) => {
            const lensLabel = buildLensLabel(
              (item as any).lensType,
              (item as any).lensSubType,
              (item as any).lensVariant
            );
            const lensPriceRange = (item as any).lensPriceRange as string | null;
            const prescriptionUrl = (item as any).prescriptionUrl as string | null;
            const prescription = (item as any).prescription as PrescriptionData | null;

            return (
              <div key={item.id} className="border border-gray-100 rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-800">
                    {item.product.name} <span className="text-gray-400 font-normal">x{item.quantity}</span>
                  </span>
                  <span className="font-semibold">{formatPEN(Number(item.total))}</span>
                </div>

                {lensLabel && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                      Luna: {lensLabel}
                    </span>
                    {lensPriceRange && (
                      <span className="text-xs text-gray-500">{lensPriceRange} — precio a confirmar</span>
                    )}
                    {prescriptionUrl && (
                      <a
                        href={prescriptionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 underline"
                      >
                        Ver ficha de prescripción
                      </a>
                    )}
                  </div>
                )}

                {prescription && (
                  <div className="mt-2 text-xs">
                    <p className="text-gray-500 mb-1 font-medium uppercase tracking-wide">Prescripción</p>
                    <table className="w-full border-collapse text-gray-700">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left px-2 py-1 font-medium text-gray-500"></th>
                          <th className="text-center px-2 py-1 font-medium text-gray-500">Esfera</th>
                          <th className="text-center px-2 py-1 font-medium text-gray-500">Cilindro</th>
                          <th className="text-center px-2 py-1 font-medium text-gray-500">Eje</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-gray-100">
                          <td className="px-2 py-1 font-medium text-gray-500">OD</td>
                          <td className="text-center px-2 py-1">{prescription.od?.sphere || "—"}</td>
                          <td className="text-center px-2 py-1">{prescription.od?.cylinder || "—"}</td>
                          <td className="text-center px-2 py-1">{prescription.od?.axis || "—"}</td>
                        </tr>
                        <tr className="border-t border-gray-100">
                          <td className="px-2 py-1 font-medium text-gray-500">OI</td>
                          <td className="text-center px-2 py-1">{prescription.oi?.sphere || "—"}</td>
                          <td className="text-center px-2 py-1">{prescription.oi?.cylinder || "—"}</td>
                          <td className="text-center px-2 py-1">{prescription.oi?.axis || "—"}</td>
                        </tr>
                        {(prescription.add || prescription.pd) && (
                          <tr className="border-t border-gray-100">
                            <td colSpan={4} className="px-2 py-1 text-gray-500">
                              {prescription.add && <span>ADD: {prescription.add}</span>}
                              {prescription.add && prescription.pd && <span className="mx-2">·</span>}
                              {prescription.pd && <span>PD: {prescription.pd}</span>}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-1 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatPEN(Number(order.subtotal))}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Envío</span>
            <span>{formatPEN(Number(order.shippingCost))}</span>
          </div>
          <div className="flex justify-between font-bold text-[#111111] text-base mt-2">
            <span>Total</span>
            <span>{formatPEN(Number(order.total))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
