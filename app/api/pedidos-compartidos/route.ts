import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { crearPedidoCompartido, lineaCompartidaSchema } from "@/lib/pedido-compartido";

// El admin arma un carrito y lo manda a un cliente como enlace (`/p/{token}`).
// Sólo el admin: un enlace que cualquiera pudiera generar sería una forma de
// llenar la tabla desde afuera.

const bodySchema = z.object({
  items: z.array(lineaCompartidaSchema).min(1, "El carrito está vacío").max(30),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const pedido = await crearPedidoCompartido(parsed.data.items, session.user.id);
  const base = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  return NextResponse.json({
    url: `${base.replace(/\/$/, "")}/p/${pedido.id}`,
    expiresAt: pedido.expiresAt,
  });
}
