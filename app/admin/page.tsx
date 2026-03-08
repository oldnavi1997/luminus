import { prisma } from "@/lib/prisma";
import { StatsCard } from "@/components/admin/StatsCard";
import { Package, ShoppingCart, DollarSign, Users } from "lucide-react";
import { formatARS } from "@/lib/utils";

export const metadata = { title: "Dashboard | Admin" };

export default async function AdminDashboard() {
  const [totalProducts, totalOrders, totalUsers, revenueData] = await Promise.all([
    prisma.product.count({ where: { active: true } }),
    prisma.order.count(),
    prisma.user.count(),
    prisma.order.aggregate({
      where: { paymentStatus: "APPROVED" },
      _sum: { total: true },
    }),
  ]);

  const revenue = Number(revenueData._sum.total || 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1a1a2e] mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Productos activos"
          value={totalProducts}
          icon={<Package className="h-5 w-5" />}
        />
        <StatsCard
          title="Total pedidos"
          value={totalOrders}
          icon={<ShoppingCart className="h-5 w-5" />}
        />
        <StatsCard
          title="Ventas aprobadas"
          value={formatARS(revenue)}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatsCard
          title="Usuarios"
          value={totalUsers}
          icon={<Users className="h-5 w-5" />}
        />
      </div>
    </div>
  );
}
