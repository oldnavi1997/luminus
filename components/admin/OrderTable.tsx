"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { OrderWithItems } from "@/types";
import { formatARS } from "@/lib/utils";
import { OrderStatusBadge, PaymentStatusBadge } from "./OrderStatusBadge";

interface OrderTableProps {
  orders: OrderWithItems[];
}

export function OrderTable({ orders }: OrderTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-3 px-4 font-medium text-gray-500">Orden</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Cliente</th>
            <th className="text-right py-3 px-4 font-medium text-gray-500">Total</th>
            <th className="text-center py-3 px-4 font-medium text-gray-500">Pago</th>
            <th className="text-center py-3 px-4 font-medium text-gray-500">Estado</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Fecha</th>
            <th className="text-right py-3 px-4 font-medium text-gray-500">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="py-3 px-4 font-mono font-medium">{order.orderNumber}</td>
              <td className="py-3 px-4">
                <p>{order.shippingName}</p>
                <p className="text-xs text-gray-400">{order.shippingEmail}</p>
              </td>
              <td className="py-3 px-4 text-right font-medium">{formatARS(Number(order.total))}</td>
              <td className="py-3 px-4 text-center">
                <PaymentStatusBadge status={order.paymentStatus} />
              </td>
              <td className="py-3 px-4 text-center">
                <OrderStatusBadge status={order.orderStatus} />
              </td>
              <td className="py-3 px-4 text-gray-500">
                {new Date(order.createdAt).toLocaleDateString("es-PE")}
              </td>
              <td className="py-3 px-4">
                <div className="flex justify-end">
                  <Link
                    href={`/admin/pedidos/${order.id}`}
                    className="p-1.5 text-gray-500 hover:text-[#1a1a2e] hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No hay pedidos todavía.
        </div>
      )}
    </div>
  );
}
