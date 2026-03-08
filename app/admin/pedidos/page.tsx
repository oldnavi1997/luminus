import { prisma } from "@/lib/prisma";
import { OrderTable } from "@/components/admin/OrderTable";

export const metadata = { title: "Pedidos | Admin" };

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: {
      items: { include: { product: true } },
      user: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1a1a2e] mb-6">Pedidos</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <OrderTable orders={orders} />
      </div>
    </div>
  );
}
