import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { siguienteSku } from "@/lib/sku";

/**
 * Propone el SKU del próximo producto para el formulario de alta. Es sólo una
 * sugerencia editable: la unicidad la sigue decidiendo el POST de /api/products.
 *
 * Equivalente a /api/productos/siguiente-sku del POS y sobre la misma tabla, así
 * que dar de alta desde cualquiera de los dos lados continúa la misma serie.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Sin filtrar por `active`: un producto desactivado no libera su SKU.
  const filas = await prisma.product.findMany({
    where: { NOT: { sku: null } },
    select: { sku: true },
  });

  return NextResponse.json({ sku: siguienteSku(filas.map((f) => f.sku)) });
}
