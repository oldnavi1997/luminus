import { prisma } from "@/lib/prisma";
import { aprobarOrden } from "@/lib/fulfillment";
import {
  aCentimos,
  esPagado,
  mapIzipayPayMethod,
  transaccionPrincipal,
  validarKrHash,
  type KrAnswer,
} from "@/lib/izipay";

export type ResultadoIzipay =
  | { ok: false; status: number; error: string }
  | {
      ok: true;
      aprobado: boolean;
      /** true si la otra vía (navegador o IPN) ya había aprobado esta orden. */
      yaProcesada: boolean;
      orderId: string;
      orderNumber: string;
      paymentId?: string;
      statusDetail?: string;
      comprobante?: string;
    };

/**
 * Valida y aplica el resultado de un pago Izipay. La usan tanto la respuesta del
 * navegador (`/confirm`) como la URL de notificación (`/webhook`), que compiten
 * en cada venta: `aprobarOrden` es idempotente por compare-and-swap, así que el
 * segundo en llegar no descuenta stock otra vez.
 *
 * `krAnswer` se valida como CADENA antes de parsearse. Parsearlo primero y
 * firmar el objeto reserializado rompería la comparación: la firma cubre los
 * bytes exactos que envió Izipay.
 */
export async function procesarResultadoIzipay(args: {
  krAnswer: string;
  krHash: string;
  krHashKey?: string;
}): Promise<ResultadoIzipay> {
  if (!validarKrHash(args)) {
    return { ok: false, status: 401, error: "Firma inválida" };
  }

  let answer: KrAnswer;
  try {
    answer = JSON.parse(args.krAnswer);
  } catch {
    return { ok: false, status: 400, error: "kr-answer ilegible" };
  }

  const orderNumber = answer.orderDetails?.orderId;
  if (!orderNumber) {
    return { ok: false, status: 400, error: "kr-answer sin orderId" };
  }

  const order = await prisma.order.findUnique({ where: { orderNumber } });
  if (!order) return { ok: false, status: 404, error: "Orden no encontrada" };

  // El importe se compara contra la BD, nunca contra lo que diga el navegador.
  if (answer.orderDetails?.orderTotalAmount !== aCentimos(Number(order.total))) {
    return { ok: false, status: 400, error: "El importe no coincide con la orden" };
  }
  if (answer.orderDetails?.orderCurrency !== "PEN") {
    return { ok: false, status: 400, error: "Moneda inesperada" };
  }

  const tx = transaccionPrincipal(answer);
  const paymentId = tx?.uuid;
  const base = { ok: true as const, orderId: order.id, orderNumber: order.orderNumber, paymentId };

  if (!esPagado(answer)) {
    // Igual que con Mercado Pago: se refleja el pago sin tocar `orderStatus`,
    // para no pisar hacia atrás un PAID que la otra vía pudo haber escrito ya.
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentProvider: "izipay",
        mpPaymentId: paymentId ?? order.mpPaymentId,
        mpStatus: answer.orderStatus ?? "UNPAID",
        paymentStatus: "REJECTED",
      },
    });
    return {
      ...base,
      aprobado: false,
      yaProcesada: false,
      statusDetail: tx?.errorMessage || tx?.detailedStatus || answer.orderStatus,
    };
  }

  const resultado = await aprobarOrden(order.id, {
    provider: "izipay",
    providerPaymentId: paymentId,
    providerStatus: answer.orderStatus,
    paymentMethod: mapIzipayPayMethod(tx?.paymentMethodType),
  });

  return {
    ...base,
    aprobado: true,
    yaProcesada: resultado.yaProcesada,
    comprobante: resultado.fullNumber,
    statusDetail: tx?.detailedStatus,
  };
}
