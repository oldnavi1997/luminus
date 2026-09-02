/**
 * Resincroniza el índice del buscador para unos productos concretos.
 *
 * Existe porque el POS escribe en la MISMA base que la web (crea productos,
 * edita precios, mueve stock, vende, anula) y no puede indexar por su cuenta:
 * tendría que cargar con la admin key de Algolia y con la regla de qué es
 * publicable, que vive aquí. Le manda ids y este endpoint decide.
 *
 * Autenticación por secreto compartido (`REINDEX_SECRET`) porque quien llama es
 * otro servidor, no un navegador con sesión. Se acepta también una sesión ADMIN
 * para poder dispararlo a mano desde el panel.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sincronizarProductos } from "@/lib/algolia-sync";

export const dynamic = "force-dynamic";

const MAX_IDS = 200;

async function autorizado(req: NextRequest): Promise<boolean> {
  const secreto = process.env.REINDEX_SECRET;
  if (secreto && req.headers.get("authorization") === `Bearer ${secreto}`) return true;

  const session = await getServerSession(authOptions);
  return session?.user.role === "ADMIN";
}

export async function POST(req: NextRequest) {
  if (!(await autorizado(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let ids: unknown;
  try {
    ({ ids } = await req.json());
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
    return NextResponse.json({ error: "Se espera { ids: string[] }" }, { status: 400 });
  }
  if (ids.length > MAX_IDS) {
    return NextResponse.json({ error: `Máximo ${MAX_IDS} ids por llamada` }, { status: 400 });
  }

  try {
    const resultado = await sincronizarProductos(ids as string[]);
    return NextResponse.json({ ok: true, ...resultado });
  } catch (e) {
    console.error("[reindex] falló la sincronización", e);
    return NextResponse.json({ error: "No se pudo sincronizar el índice" }, { status: 502 });
  }
}
