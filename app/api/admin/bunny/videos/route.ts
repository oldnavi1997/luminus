import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  GUID,
  borrarVideo,
  bunnyConfigured,
  crearVideo,
  firmarSubida,
  urlPlaylist,
} from "@/lib/bunny";

async function autorizar(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!bunnyConfigured()) {
    return NextResponse.json({ error: "Bunny Stream no está configurado" }, { status: 503 });
  }
  return null;
}

/** Crea el video en Bunny y devuelve lo necesario para subirlo por TUS. */
export async function POST(request: NextRequest) {
  const denegado = await autorizar();
  if (denegado) return denegado;

  const body = (await request.json().catch(() => ({}))) as { titulo?: unknown };
  const titulo =
    typeof body.titulo === "string" && body.titulo.trim()
      ? body.titulo.trim().slice(0, 200)
      : "Video de producto";

  try {
    const guid = await crearVideo(titulo);
    return NextResponse.json({ guid, url: urlPlaylist(guid), ...firmarSubida(guid) });
  } catch (err) {
    console.error("Bunny crearVideo:", err);
    return NextResponse.json({ error: "No se pudo crear el video en Bunny" }, { status: 502 });
  }
}

/** Limpia un video cuya subida falló, para no dejar vacíos en la biblioteca. */
export async function DELETE(request: NextRequest) {
  const denegado = await autorizar();
  if (denegado) return denegado;

  const guid = new URL(request.url).searchParams.get("guid");
  if (!guid || !GUID.test(guid)) {
    return NextResponse.json({ error: "guid inválido" }, { status: 400 });
  }

  try {
    await borrarVideo(guid);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Bunny borrarVideo:", err);
    return NextResponse.json({ error: "No se pudo borrar el video" }, { status: 502 });
  }
}
