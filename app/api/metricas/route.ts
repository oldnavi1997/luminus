import { NextResponse } from "next/server";
import { z } from "zod";
import { EVENTOS, registrarEvento } from "@/lib/metricas";

// Recibe los avisos de lib/metricas-cliente.ts. Llegan por sendBeacon, así que
// nadie espera la respuesta: si algo falla se pierde ese conteo y nada más.

const avisoSchema = z.object({
  categoria: z.string().min(1).max(120),
  evento: z.enum(EVENTOS),
});

export async function POST(req: Request) {
  let cuerpo: unknown;
  try {
    // sendBeacon manda un Blob: se lee como texto sin depender del Content-Type.
    cuerpo = JSON.parse(await req.text());
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const aviso = avisoSchema.safeParse(cuerpo);
  if (!aviso.success) return new NextResponse(null, { status: 400 });

  try {
    const existe = await registrarEvento(aviso.data.categoria, aviso.data.evento);
    return new NextResponse(null, { status: existe ? 204 : 404 });
  } catch (error) {
    console.error("[metricas]", error);
    return new NextResponse(null, { status: 500 });
  }
}
