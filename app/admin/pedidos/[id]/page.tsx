"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OrderWithItems } from "@/types";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/OrderStatusBadge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { formatARS } from "@/lib/utils";
import { OrderStatus } from "@/app/generated/prisma/client";

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
          <h1 className="text-2xl font-bold text-[#1a1a2e]">{order.orderNumber}</h1>
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
          <h2 className="font-semibold text-[#1a1a2e] mb-4">Datos de envío</h2>
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
          <h2 className="font-semibold text-[#1a1a2e] mb-4">Actualizar estado</h2>
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
        <h2 className="font-semibold text-[#1a1a2e] mb-4">Productos</h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm py-2 border-b border-gray-50 last:border-0">
              <span className="text-gray-700">
                {item.product.name} <span className="text-gray-400">x{item.quantity}</span>
              </span>
              <span className="font-medium">{formatARS(Number(item.total))}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-1 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatARS(Number(order.subtotal))}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Envío</span>
            <span>{formatARS(Number(order.shippingCost))}</span>
          </div>
          <div className="flex justify-between font-bold text-[#1a1a2e] text-base mt-2">
            <span>Total</span>
            <span>{formatARS(Number(order.total))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
