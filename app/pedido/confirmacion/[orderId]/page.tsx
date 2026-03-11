import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPEN } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orderId: string }>;
}

export default async function OrderConfirmationPage({ params }: Props) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { product: true },
      },
    },
  });

  if (!order) notFound();

  const isApproved = order.paymentStatus === "APPROVED";
  const isPending = order.paymentStatus === "PENDING" || order.paymentStatus === "IN_PROCESS";

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Header */}
      <header className="bg-[#1a1a2e] text-white py-4 px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="text-xl font-bold tracking-widest text-[#c9a84c] uppercase">
            Luminus
          </span>
          <span className="text-sm text-gray-400">Confirmación de pedido</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Status badge */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          {isApproved ? (
            <>
              <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-[#1a1a2e] mb-1">¡Pago aprobado!</h1>
              <p className="text-gray-500 text-sm">Tu pedido fue confirmado exitosamente.</p>
            </>
          ) : (
            <>
              <Clock className="h-14 w-14 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-[#1a1a2e] mb-1">Pago en proceso</h1>
              <p className="text-gray-500 text-sm">
                Tu pago está siendo procesado. Te notificaremos por email cuando se confirme.
              </p>
            </>
          )}
          <p className="mt-4 text-xs text-gray-400 font-mono">
            N.° de pedido: {order.orderNumber}
          </p>
        </div>

        {/* Order items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-[#1a1a2e]">Detalle del pedido</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-[#f8f7f4]">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Producto</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium">Cant.</th>
                <th className="text-right px-6 py-3 text-gray-500 font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 text-[#1a1a2e]">{item.product.name}</td>
                  <td className="px-4 py-4 text-center text-gray-600">x{item.quantity}</td>
                  <td className="px-6 py-4 text-right text-[#1a1a2e] font-medium">
                    {formatPEN(item.total.toString())}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-lg font-bold text-[#c9a84c]">
              {formatPEN(order.total.toString())}
            </span>
          </div>
        </div>

        {/* Shipping address */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-5">
          <h2 className="font-semibold text-[#1a1a2e] mb-3">Dirección de envío</h2>
          <p className="text-sm text-gray-700">{order.shippingName}</p>
          <p className="text-sm text-gray-500">
            {order.shippingAddress}, {order.shippingCity}, {order.shippingProvince}{" "}
            {order.shippingPostal}
          </p>
          <p className="text-sm text-gray-500">{order.shippingCountry}</p>
          {order.shippingEmail && (
            <p className="text-sm text-gray-400 mt-1">{order.shippingEmail}</p>
          )}
        </div>

        {/* Footer note + CTA */}
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-500">
            Te enviaremos un email de confirmación a{" "}
            <span className="font-medium text-[#1a1a2e]">{order.shippingEmail}</span>.
          </p>
          <Link
            href="/lentes"
            className="inline-block bg-[#1a1a2e] text-white text-sm font-semibold px-8 py-3 rounded-lg hover:bg-[#c9a84c] transition-colors"
          >
            Seguir comprando
          </Link>
        </div>
      </main>
    </div>
  );
}
