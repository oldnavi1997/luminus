import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";

/** Qué pide la galería. Sin `tipo` vienen fotos y videos mezclados por fecha. */
function expresion(tipo: string | null): string {
  const recurso =
    tipo === "video"
      ? "resource_type:video"
      : tipo === "image"
      ? "resource_type:image"
      : "(resource_type:image OR resource_type:video)";
  return `${recurso} AND -public_id:samples/*`;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const max_results = Number(searchParams.get("max_results") ?? "50");
  const next_cursor = searchParams.get("next_cursor") ?? undefined;
  const tipo = searchParams.get("tipo");

  try {
    // No folder scoping: the account is dedicated to Luminus since the migration
    // off the shared one. A folder: filter would return nothing anyway — this
    // account uses dynamic folder mode, where asset_folder is a field separate
    // from public_id, and the migration preserved only public_id.
    //
    // Los videos son un puñado contra 3.5k fotos y son más viejos que casi
    // todas, así que ordenados por fecha caen fuera de las primeras páginas:
    // el filtro `tipo` es la única forma práctica de encontrarlos.
    const query = cloudinary.search
      .expression(expresion(tipo))
      .sort_by("created_at", "desc")
      .max_results(max_results);

    if (next_cursor) query.next_cursor(next_cursor);

    const result = await query.execute();

    const images = (result.resources as { secure_url: string; public_id: string; resource_type: string }[]).map(
      (r) => ({ url: r.secure_url, publicId: r.public_id, resourceType: r.resource_type })
    );

    return NextResponse.json({
      images,
      next_cursor: result.next_cursor ?? null,
    });
  } catch (err) {
    console.error("Cloudinary API error:", err);
    return NextResponse.json({ error: "Error al obtener imágenes" }, { status: 500 });
  }
}
