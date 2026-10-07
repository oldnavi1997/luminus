import { prisma } from "@/lib/prisma";
import { sendOrderConfirmation } from "@/lib/email";
import { enviarPushNuevaVenta } from "@/lib/push";

/**
 * Avisos de una venta recién aprobada: el correo al comprador y el push a los
 * admins. Lo llama quien gane el CAS de `aprobarOrden()` (`yaProcesada: false`),
 * sea el navegador o el webhook — con Izipay el IPN suele llegar primero, y si
 * sólo el navegador mandara el correo, esa venta se quedaría sin él.
 *
 * Se invoca dentro de `after()` de `next/server`: en Vercel la función se
 * congela al devolver la respuesta, y una promesa suelta muere a medio enviar.
 * Nunca lanza.
 */
export async function notificarVentaAprobada(orderId: string): Promise<void> {
  await Promise.all([
    sendOrderConfirmation(orderId),
    (async () => {
      try {
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          select: { id: true, orderNumber: true, total: true, shippingName: true },
        });
        if (order) await enviarPushNuevaVenta(order);
      } catch (error) {
        console.error("notificarVentaAprobada push error:", error);
      }
    })(),
  ]);
}
