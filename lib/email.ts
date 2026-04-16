import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

function formatPEN(amount: number): string {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(amount);
}

const LENS_LABELS: Record<string, string> = {
  sin_medida: "Sin medida",
  con_medida: "Con medida",
  solo_montura: "Solo montura",
  descanso: "Descanso",
  nk: "Lunas NK",
  policarbonato: "Policarbonato",
  fotocromatico: "Fotocromático clásico",
  transition: "Transition Gen S",
  alto_indice: "Alto índice",
  convencional: "Convencional",
  crizal_sapphire: "Crizal Sapphire",
  con_ficha: "Con ficha",
  ar16: "Base Kodak",
  sapphire: "Sapphire",
};

function buildLensLabel(type?: string | null, sub?: string | null, variant?: string | null): string | null {
  const parts = [type, sub, variant].filter(Boolean);
  if (parts.length === 0) return null;
  return parts.map((k) => LENS_LABELS[k!] ?? k).join(" · ");
}

export async function sendOrderConfirmation(orderId: string): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      console.error(`sendOrderConfirmation: order ${orderId} not found`);
      return;
    }

    const itemRows = order.items
      .map((item) => {
        const lensLabel = buildLensLabel(
          (item as any).lensType,
          (item as any).lensSubType,
          (item as any).lensVariant
        );
        const lensPriceRange = (item as any).lensPriceRange as string | null;
        const prescriptionUrl = (item as any).prescriptionUrl as string | null;

        const lensRow = lensLabel
          ? `<tr>
              <td colspan="4" style="padding:2px 12px 8px;font-size:11px;color:#888;">
                Luna: ${lensLabel}${lensPriceRange ? ` &nbsp;·&nbsp; ${lensPriceRange}` : ""}
                ${prescriptionUrl ? ` &nbsp;·&nbsp; <a href="${prescriptionUrl}" style="color:#c9a84c;">Ver ficha</a>` : ""}
              </td>
            </tr>`
          : "";

        return `
        <tr>
          <td style="padding:8px 12px 2px;border-bottom:${lensLabel ? "none" : "1px solid #f0ede8"};">${item.product.name}</td>
          <td style="padding:8px 12px 2px;border-bottom:${lensLabel ? "none" : "1px solid #f0ede8"};text-align:center;">${item.quantity}</td>
          <td style="padding:8px 12px 2px;border-bottom:${lensLabel ? "none" : "1px solid #f0ede8"};text-align:right;">${formatPEN(Number(item.unitPrice))}</td>
          <td style="padding:8px 12px 2px;border-bottom:${lensLabel ? "none" : "1px solid #f0ede8"};text-align:right;">${formatPEN(Number(item.total))}</td>
        </tr>
        ${lensRow}
        ${lensLabel ? '<tr><td colspan="4" style="border-bottom:1px solid #f0ede8;"></td></tr>' : ""}`;
      })
      .join("");

    const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f7f4;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7f4;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#1a1a2e;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#c9a84c;font-size:28px;letter-spacing:2px;font-weight:300;">LUMINUS</h1>
            <p style="margin:8px 0 0;color:#c9a84c;font-size:12px;letter-spacing:3px;text-transform:uppercase;">Óptica & Estilo</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 8px;color:#1a1a2e;font-size:22px;font-weight:600;">¡Gracias por tu compra!</h2>
            <p style="margin:0 0 24px;color:#555;font-size:15px;">Hola <strong>${order.shippingName}</strong>, hemos recibido tu pedido correctamente.</p>

            <!-- Order number -->
            <div style="background:#f8f7f4;border-radius:8px;padding:16px 20px;margin-bottom:28px;">
              <p style="margin:0;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:1px;">Número de pedido</p>
              <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#1a1a2e;">${order.orderNumber}</p>
            </div>

            <!-- Products table -->
            <h3 style="margin:0 0 12px;font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#888;">Detalle del pedido</h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:20px;">
              <thead>
                <tr style="background:#f8f7f4;">
                  <th style="padding:10px 12px;text-align:left;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Producto</th>
                  <th style="padding:10px 12px;text-align:center;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Cant.</th>
                  <th style="padding:10px 12px;text-align:right;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Precio</th>
                  <th style="padding:10px 12px;text-align:right;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Subtotal</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>

            <!-- Total -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              ${Number(order.shippingCost) > 0 ? `
              <tr>
                <td style="padding:6px 12px;color:#555;">Subtotal</td>
                <td style="padding:6px 12px;text-align:right;color:#555;">${formatPEN(Number(order.subtotal))}</td>
              </tr>
              <tr>
                <td style="padding:6px 12px;color:#555;">Envío</td>
                <td style="padding:6px 12px;text-align:right;color:#555;">${formatPEN(Number(order.shippingCost))}</td>
              </tr>` : ""}
              <tr>
                <td style="padding:12px 12px 6px;font-weight:700;font-size:16px;color:#1a1a2e;border-top:2px solid #1a1a2e;">Total pagado</td>
                <td style="padding:12px 12px 6px;text-align:right;font-weight:700;font-size:16px;color:#c9a84c;border-top:2px solid #1a1a2e;">${formatPEN(Number(order.total))}</td>
              </tr>
            </table>

            <!-- Shipping address -->
            <h3 style="margin:0 0 12px;font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#888;">Dirección de envío</h3>
            <div style="background:#f8f7f4;border-radius:8px;padding:16px 20px;margin-bottom:32px;">
              <p style="margin:0;line-height:1.7;color:#333;">
                ${order.shippingName}<br>
                ${order.shippingAddress}<br>
                ${order.shippingCity}, ${order.shippingProvince} ${order.shippingPostal}<br>
                ${order.shippingCountry}
              </p>
            </div>

            <p style="margin:0;color:#555;font-size:14px;line-height:1.6;">
              Nos pondremos en contacto contigo cuando tu pedido sea despachado.<br>
              Si tienes alguna consulta, responde a este correo.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8f7f4;padding:24px 40px;text-align:center;border-top:1px solid #eee;">
            <p style="margin:0;font-size:12px;color:#aaa;">© ${new Date().getFullYear()} Luminus. Todos los derechos reservados.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await getResend().emails.send({
      from: process.env.EMAIL_FROM!,
      to: order.shippingEmail,
      subject: `Confirmación de pedido ${order.orderNumber} — Luminus`,
      html,
    });
  } catch (error) {
    console.error("sendOrderConfirmation error:", error);
  }
}
