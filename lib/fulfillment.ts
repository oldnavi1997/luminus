/**
 * Punto único de aprobación y reversión de una orden web.
 *
 * Al aprobarse el pago (y sólo entonces) se descuenta el stock en cascada
 * —primero almacén, el resto de tienda— y se emite una nota de venta interna
 * (serie NV002) para que la venta aparezca en el POS.
 *
 * Los cuatro caminos que aprueban una orden (dev bypass, checkout directo,
 * webhook de Mercado Pago y el panel admin) pasan todos por `aprobarOrden`.
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { planDeduccion } from "@/lib/stock";
import { calcularIGV, formatCorrelativo } from "@/lib/sunat";
import { buildLensLabel } from "@/lib/lens-label";

/** Serie propia para la web: no compite por el correlativo con NV001 del mostrador. */
const SERIE_WEB = "NV002";
/** Cajero de sistema. `SaleDocument.cashierId` es NOT NULL y el POS lee `cashier.name`. */
const WEB_CASHIER_EMAIL = "web@luminus.pe";
const WEB_CASHIER_NAME = "Tienda Web";

const TX_OPTS = { timeout: 15_000, maxWait: 10_000 };

type ProductoBloqueado = {
  id: string;
  name: string;
  stockAlmacen: number;
  stockTienda: number;
  stock: number;
  trackInventory: boolean;
};

export type ResultadoAprobacion = {
  /** true si la orden ya había sido aprobada antes (reintento de webhook, doble submit…). */
  yaProcesada: boolean;
  orderNumber?: string;
  /** Comprobante emitido, p. ej. "NV002-00000001". */
  fullNumber?: string;
  /** Descripción del faltante si hubo sobreventa. */
  stockIssue?: string | null;
};

type OpcionesAprobacion = {
  mpPaymentId?: string | null;
  mpStatus?: string | null;
  /** `payment_method_id` de Mercado Pago; "yape" mapea a YAPE, el resto a TARJETA. */
  mpPaymentMethodId?: string | null;
};

/**
 * Bloquea las filas de producto dentro de la transacción.
 *
 * El `FOR UPDATE` serializa contra la venta del POS (que actualiza los mismos
 * rows sin lock explícito), así que las cantidades leídas siguen siendo válidas
 * al momento de escribir. `ORDER BY id` evita deadlocks entre transacciones.
 */
async function bloquearProductos(
  tx: Prisma.TransactionClient,
  productIds: string[]
): Promise<ProductoBloqueado[]> {
  if (productIds.length === 0) return [];
  return tx.$queryRaw<ProductoBloqueado[]>`
    SELECT id, name, "stockAlmacen", "stockTienda", "stock", "trackInventory"
    FROM "Product"
    WHERE id IN (${Prisma.join(productIds)})
    ORDER BY id
    FOR UPDATE
  `;
}

/** Crea (si falta) el usuario de sistema que firma los comprobantes web. */
async function getCajeroWeb(tx: Prisma.TransactionClient): Promise<string> {
  const cajero = await tx.user.upsert({
    where: { email: WEB_CASHIER_EMAIL },
    update: {},
    // Sin password: `lib/auth.ts` no autentica sin hash, así que no es una cuenta usable.
    create: { email: WEB_CASHIER_EMAIL, name: WEB_CASHIER_NAME, role: "USER" },
    select: { id: true },
  });
  return cajero.id;
}

/** Reserva el siguiente correlativo de NV002 con lock pesimista. */
async function siguienteCorrelativoWeb(
  tx: Prisma.TransactionClient
): Promise<{ correlativo: number; fullNumber: string }> {
  await tx.documentSerie.upsert({
    where: { type_serie: { type: "NOTA_VENTA", serie: SERIE_WEB } },
    update: {},
    create: { type: "NOTA_VENTA", serie: SERIE_WEB, lastNumber: 0, active: true },
  });

  const [serieRow] = await tx.$queryRaw<{ lastNumber: number }[]>`
    SELECT "lastNumber" FROM "DocumentSerie"
    WHERE type = ${"NOTA_VENTA"}::"DocumentType" AND serie = ${SERIE_WEB}
    FOR UPDATE
  `;

  const correlativo = serieRow.lastNumber + 1;
  await tx.documentSerie.update({
    where: { type_serie: { type: "NOTA_VENTA", serie: SERIE_WEB } },
    data: { lastNumber: correlativo },
  });

  return { correlativo, fullNumber: formatCorrelativo(SERIE_WEB, correlativo) };
}

export async function aprobarOrden(
  orderId: string,
  opts: OpcionesAprobacion = {}
): Promise<ResultadoAprobacion> {
  const resultado = await prisma.$transaction(async (tx) => {
    // 1. Compare-and-swap atómico: un único UPDATE decide quién procesa la orden.
    //    Protege contra los reintentos del webhook de MP y contra el doble submit.
    const { count } = await tx.order.updateMany({
      where: { id: orderId, stockDeducted: false },
      data: {
        stockDeducted: true,
        paymentStatus: "APPROVED",
        orderStatus: "PAID",
        ...(opts.mpPaymentId ? { mpPaymentId: opts.mpPaymentId } : {}),
        ...(opts.mpStatus ? { mpStatus: opts.mpStatus } : {}),
      },
    });
    if (count === 0) return { yaProcesada: true } as ResultadoAprobacion;

    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: { select: { name: true } } } } },
    });
    if (!order) throw new Error(`aprobarOrden: orden ${orderId} no encontrada`);

    // 2. Descuento en cascada: almacén primero, tienda sólo si el almacén no alcanza.
    const productIds = [...new Set(order.items.map((i) => i.productId))];
    const bloqueados = await bloquearProductos(tx, productIds);
    const porProducto = new Map(bloqueados.map((p) => [p.id, p]));

    const cajeroId = await getCajeroWeb(tx);
    const faltantes: string[] = [];
    /** productId → unidades pendientes de repartir entre las líneas del pedido. */
    const repartoAlmacen = new Map<string, number>();
    const repartoTienda = new Map<string, number>();

    for (const productId of productIds) {
      const producto = porProducto.get(productId);
      if (!producto || !producto.trackInventory) continue;

      const pedido = order.items
        .filter((i) => i.productId === productId)
        .reduce((sum, i) => sum + i.quantity, 0);

      const { deAlmacen, deTienda, faltante } = planDeduccion(
        pedido,
        producto.stockAlmacen,
        producto.stockTienda
      );

      if (deAlmacen + deTienda > 0) {
        await tx.product.update({
          where: { id: productId },
          data: {
            stockAlmacen: { decrement: deAlmacen },
            stockTienda: { decrement: deTienda },
            // `stock` es el total legacy que el POS también mantiene.
            stock: { decrement: deAlmacen + deTienda },
          },
        });

        await tx.stockMovimiento.create({
          data: {
            productId,
            tipo: "VENTA_WEB",
            cantidad: deAlmacen + deTienda,
            stockAlmacenResultante: producto.stockAlmacen - deAlmacen,
            stockTiendaResultante: producto.stockTienda - deTienda,
            userId: cajeroId,
            nota: `Pedido ${order.orderNumber} · almacén ${deAlmacen} · tienda ${deTienda}`,
          },
        });
      }

      if (faltante > 0) {
        faltantes.push(`${producto.name}: pedido ${pedido}, descontado ${pedido - faltante}`);
      }
      repartoAlmacen.set(productId, deAlmacen);
      repartoTienda.set(productId, deTienda);
    }

    // 3. Snapshot por línea: permite devolver el stock exactamente de donde salió.
    for (const item of order.items) {
      const dispAlmacen = repartoAlmacen.get(item.productId) ?? 0;
      const dispTienda = repartoTienda.get(item.productId) ?? 0;
      const qtyFromAlmacen = Math.min(item.quantity, dispAlmacen);
      const qtyFromTienda = Math.min(item.quantity - qtyFromAlmacen, dispTienda);
      repartoAlmacen.set(item.productId, dispAlmacen - qtyFromAlmacen);
      repartoTienda.set(item.productId, dispTienda - qtyFromTienda);

      if (qtyFromAlmacen > 0 || qtyFromTienda > 0) {
        await tx.orderItem.update({
          where: { id: item.id },
          data: { qtyFromAlmacen, qtyFromTienda },
        });
      }
    }

    const stockIssue = faltantes.length > 0 ? `Stock insuficiente — ${faltantes.join(" | ")}` : null;
    if (stockIssue) {
      await tx.order.update({ where: { id: orderId }, data: { stockIssue } });
    }

    // 4. Comprobante interno para que la venta exista en el POS.
    const sesionAbierta = await tx.posSession.findFirst({
      where: { status: "OPEN" },
      orderBy: { openedAt: "desc" },
      select: { id: true },
    });

    const { correlativo, fullNumber } = await siguienteCorrelativoWeb(tx);

    const total = Number(order.total);
    const { baseImponible, igv } = calcularIGV(total);
    const subtotalMercaderia = order.items.reduce((sum, i) => sum + Number(i.total), 0);
    const paymentMethod = opts.mpPaymentMethodId === "yape" ? "YAPE" : "TARJETA";
    const recetaItem = order.items.find((i) => i.prescription);

    const detalleMontos = [
      `mercadería ${subtotalMercaderia.toFixed(2)}`,
      `envío ${Number(order.shippingCost).toFixed(2)}`,
      `comisión ${(total - subtotalMercaderia - Number(order.shippingCost) + Number(order.discount)).toFixed(2)}`,
    ].join(" · ");

    await tx.saleDocument.create({
      data: {
        type: "NOTA_VENTA",
        serie: SERIE_WEB,
        correlativo,
        fullNumber,
        // Documento interno: no se envía a SUNAT, nace aceptado.
        status: "ACCEPTED",
        channel: "WEB",
        location: "WEB",
        orderId: order.id,
        cashierId: cajeroId,
        posSessionId: sesionAbierta?.id ?? null,
        buyerDocType: order.documentType ?? "DNI",
        buyerDocNumber: order.documentNumber ?? "00000000",
        buyerName: order.shippingName || "CLIENTE VARIOS",
        buyerAddress: [order.shippingAddress, order.shippingCity, order.shippingProvince]
          .filter(Boolean)
          .join(", "),
        buyerPhone: order.shippingPhone,
        subtotal: new Prisma.Decimal(baseImponible),
        igv: new Prisma.Decimal(igv),
        total: new Prisma.Decimal(total),
        discount: order.discount,
        paymentMethod,
        prescription: recetaItem?.prescription ?? Prisma.DbNull,
        notes: `Venta web · Pedido ${order.orderNumber}${
          order.shippingCourier ? ` · ${order.shippingCourier}` : ""
        } · ${detalleMontos}`,
        items: {
          create: order.items.map((item) => {
            const lineTotal = Number(item.total);
            const unitConIgv = Number(item.unitPrice) + Number(item.lensPrice ?? 0);
            const lensLabel = buildLensLabel(item.lensType, item.lensSubType, item.lensVariant);
            return {
              productId: item.productId,
              description: lensLabel ? `${item.product.name} · ${lensLabel}` : item.product.name,
              quantity: item.quantity,
              unitPrice: new Prisma.Decimal(unitConIgv / 1.18),
              igvAmount: new Prisma.Decimal(calcularIGV(lineTotal).igv),
              lineTotal: new Prisma.Decimal(lineTotal),
              lensType: item.lensType,
              lensSubType: item.lensSubType,
              lensVariant: item.lensVariant,
              lensPrice: item.lensPrice,
            };
          }),
        },
      },
    });

    // 5. La cobranza es electrónica: nunca toca el efectivo esperado del arqueo.
    if (sesionAbierta) {
      await tx.posSession.update({
        where: { id: sesionAbierta.id },
        data: {
          totalVentas: { increment: total },
          countVentas: { increment: 1 },
          ...(paymentMethod === "YAPE"
            ? { totalYape: { increment: total } }
            : { totalTarjeta: { increment: total } }),
        },
      });
    }

    return {
      yaProcesada: false,
      orderNumber: order.orderNumber,
      fullNumber,
      stockIssue,
    } as ResultadoAprobacion;
  }, TX_OPTS);

  return resultado;
}

export type ResultadoReversion = {
  /** true si la orden no tenía stock descontado (nunca se aprobó, o ya se revirtió). */
  yaRevertida: boolean;
  fullNumber?: string;
};

/**
 * Devuelve el stock exactamente a las ubicaciones de donde salió y anula el
 * comprobante. Se usa al cancelar o reembolsar una orden ya pagada.
 */
export async function revertirOrden(
  orderId: string,
  motivo: string
): Promise<ResultadoReversion> {
  return prisma.$transaction(async (tx) => {
    // CAS inverso: sólo revierte quien logra apagar el flag.
    const { count } = await tx.order.updateMany({
      where: { id: orderId, stockDeducted: true },
      data: { stockDeducted: false },
    });
    if (count === 0) return { yaRevertida: true } as ResultadoReversion;

    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true, saleDocument: { select: { id: true, posSessionId: true, total: true, paymentMethod: true, fullNumber: true } } },
    });
    if (!order) throw new Error(`revertirOrden: orden ${orderId} no encontrada`);

    const productIds = [...new Set(order.items.map((i) => i.productId))];
    const bloqueados = await bloquearProductos(tx, productIds);
    const porProducto = new Map(bloqueados.map((p) => [p.id, p]));
    const cajeroId = await getCajeroWeb(tx);

    for (const productId of productIds) {
      const producto = porProducto.get(productId);
      if (!producto) continue;

      const lineas = order.items.filter((i) => i.productId === productId);
      const alAlmacen = lineas.reduce((s, i) => s + i.qtyFromAlmacen, 0);
      const aTienda = lineas.reduce((s, i) => s + i.qtyFromTienda, 0);
      if (alAlmacen + aTienda === 0) continue;

      await tx.product.update({
        where: { id: productId },
        data: {
          stockAlmacen: { increment: alAlmacen },
          stockTienda: { increment: aTienda },
          stock: { increment: alAlmacen + aTienda },
        },
      });

      await tx.stockMovimiento.create({
        data: {
          productId,
          tipo: "ANULACION_WEB",
          cantidad: alAlmacen + aTienda,
          stockAlmacenResultante: producto.stockAlmacen + alAlmacen,
          stockTiendaResultante: producto.stockTienda + aTienda,
          userId: cajeroId,
          nota: `${motivo} · Pedido ${order.orderNumber} · almacén ${alAlmacen} · tienda ${aTienda}`,
        },
      });
    }

    await tx.orderItem.updateMany({
      where: { orderId },
      data: { qtyFromAlmacen: 0, qtyFromTienda: 0 },
    });

    const doc = order.saleDocument;
    if (doc) {
      await tx.saleDocument.update({
        where: { id: doc.id },
        data: { status: "VOIDED", voidReason: motivo, voidedAt: new Date() },
      });

      if (doc.posSessionId) {
        const monto = Number(doc.total);
        await tx.posSession.update({
          where: { id: doc.posSessionId },
          data: {
            totalVentas: { decrement: monto },
            countVentas: { decrement: 1 },
            ...(doc.paymentMethod === "YAPE"
              ? { totalYape: { decrement: monto } }
              : { totalTarjeta: { decrement: monto } }),
          },
        });
      }
    }

    return { yaRevertida: false, fullNumber: doc?.fullNumber };
  }, TX_OPTS);
}
