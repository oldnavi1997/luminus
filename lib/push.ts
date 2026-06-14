import { prisma } from "@/lib/prisma";

interface OrderForPush {
  id: string;
  orderNumber: string;
  total: unknown; // Prisma Decimal or number
  shippingName: string;
}

/**
 * Envía una notificación push a todos los administradores con token registrado
 * cuando se concreta una venta web. Usa la Expo Push API (sin dependencia extra).
 * Cualquier fallo se traga: nunca debe romper el webhook de pago.
 */
export async function enviarPushNuevaVenta(order: OrderForPush): Promise<void> {
  try {
    const tokens = await prisma.pushToken.findMany({
      where: { user: { role: "ADMIN" } },
      select: { token: true },
    });
    if (tokens.length === 0) return;

    const totalStr = Number(order.total).toFixed(2);
    const messages = tokens.map((t) => ({
      to: t.token,
      sound: "default",
      title: "Nueva venta web 🛒",
      body: `Pedido ${order.orderNumber} · S/ ${totalStr} · ${order.shippingName}`,
      data: { orderId: order.id },
      priority: "high",
      channelId: "ventas",
    }));

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages),
    });
  } catch (e) {
    console.error("enviarPushNuevaVenta error:", e);
  }
}
