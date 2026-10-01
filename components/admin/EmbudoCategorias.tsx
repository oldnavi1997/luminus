import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { primerDiaDeLosUltimos } from "@/lib/metricas";
import { cn } from "@/lib/utils";

export const RANGOS = [7, 30] as const;
export type Rango = (typeof RANGOS)[number];

interface Fila {
  id: string;
  nombre: string;
  vistas: number;
  clics: number;
  carrito: number;
  vendidos: number;
}

/**
 * Por categoría, en los últimos `rango` días (hoy incluido, hora de Lima):
 * cuántas veces se abrió el listado, cuántas de ahí siguieron a una ficha,
 * cuántas terminaron en el carrito y cuántas unidades se vendieron.
 *
 * Las tres primeras salen de CategoriaMetrica (ver lib/metricas.ts). Los
 * vendidos, de los pedidos pagados: son todas las ventas de productos de la
 * categoría, entren por donde entren. En una categoría que lista sus modelos
 * con una luna (Fotocromático, Blue Light) sólo cuentan los vendidos con esa
 * luna, que es lo que esa categoría ofrece.
 */
export async function EmbudoCategorias({ rango }: { rango: Rango }) {
  const desde = primerDiaDeLosUltimos(rango);

  const [eventos, items, categorias] = await Promise.all([
    prisma.categoriaMetrica.groupBy({
      by: ["categoryId", "evento"],
      where: { dia: { gte: new Date(`${desde}T00:00:00Z`) } },
      _sum: { cantidad: true },
    }),
    prisma.orderItem.findMany({
      where: {
        order: { paymentStatus: "APPROVED", createdAt: { gte: new Date(`${desde}T00:00:00-05:00`) } },
      },
      select: {
        quantity: true,
        lensSubType: true,
        product: { select: { categories: { select: { id: true } } } },
      },
    }),
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        showsPhotochromic: true,
        showsBlueLight: true,
        parent: { select: { name: true } },
      },
    }),
  ]);

  const filas = new Map<string, Fila>(
    categorias.map((c) => [
      c.id,
      {
        id: c.id,
        nombre: c.parent ? `${c.parent.name} › ${c.name}` : c.name,
        vistas: 0,
        clics: 0,
        carrito: 0,
        vendidos: 0,
      },
    ])
  );

  for (const e of eventos) {
    const fila = filas.get(e.categoryId);
    if (!fila) continue;
    const n = e._sum.cantidad ?? 0;
    if (e.evento === "vista") fila.vistas += n;
    else if (e.evento === "clic") fila.clics += n;
    else if (e.evento === "carrito") fila.carrito += n;
  }

  const lunaDe = new Map(
    categorias.map((c) => [
      c.id,
      c.showsPhotochromic ? "fotocromatico" : c.showsBlueLight ? "descanso" : null,
    ])
  );
  for (const item of items) {
    for (const { id } of item.product.categories) {
      const fila = filas.get(id);
      const luna = lunaDe.get(id);
      if (!fila || (luna && item.lensSubType !== luna)) continue;
      fila.vendidos += item.quantity;
    }
  }

  const conDatos = [...filas.values()]
    .filter((f) => f.vistas + f.clics + f.carrito + f.vendidos > 0)
    .sort((a, b) => b.vistas - a.vistas || b.vendidos - a.vendidos);

  return (
    <div className="bg-white border border-[#111111]/6">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-[#111111]/6">
        <div>
          <p className="text-[10px] font-medium text-[#111111]/50 uppercase tracking-[0.2em]">
            Categorías · interés
          </p>
          <p className="text-xs text-[#111111]/35 mt-1">
            Visitas al listado, clics a una ficha, agregados al carrito y unidades vendidas.
          </p>
        </div>
        <div className="flex border border-[#111111]/10" role="group" aria-label="Rango">
          {RANGOS.map((r) => (
            <Link
              key={r}
              href={`/admin?rango=${r}`}
              scroll={false}
              aria-current={r === rango ? "true" : undefined}
              className={cn(
                "px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] transition-colors",
                r === rango ? "bg-[#111111] text-white" : "text-[#111111]/50 hover:text-[#111111]"
              )}
            >
              {r} días
            </Link>
          ))}
        </div>
      </div>

      {conDatos.length === 0 ? (
        <p className="py-12 text-center text-sm text-[#111111]/30">
          Todavía no hay visitas registradas en este período.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-[#111111]/4">
                {["Categoría", "Vistas", "Clics a ficha", "% clic", "Al carrito", "Vendidos"].map((t, i) => (
                  <th
                    key={t}
                    scope="col"
                    className={cn(
                      "px-5 py-3 text-[11px] font-medium text-[#111111]/35 uppercase tracking-[0.15em]",
                      i === 0 ? "text-left" : "text-right"
                    )}
                  >
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {conDatos.map((f) => (
                <tr key={f.id} className="border-b border-[#111111]/4 last:border-0 hover:bg-[#f8f7f4]/60">
                  <td className="px-5 py-3 text-sm text-[#111111]">{f.nombre}</td>
                  <td className="px-5 py-3 text-right text-sm tabular-nums">{f.vistas}</td>
                  <td className="px-5 py-3 text-right text-sm tabular-nums">{f.clics}</td>
                  <td className="px-5 py-3 text-right text-sm tabular-nums text-[#111111]/60">
                    {f.vistas > 0 ? `${Math.round((f.clics / f.vistas) * 100)} %` : "—"}
                  </td>
                  <td className="px-5 py-3 text-right text-sm tabular-nums">{f.carrito}</td>
                  <td className="px-5 py-3 text-right text-sm font-medium tabular-nums">{f.vendidos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="px-5 py-3 border-t border-[#111111]/6 text-[11px] leading-snug text-[#111111]/35">
        Cuenta visitas, no personas: sin cookies, quien vuelve tres veces suma tres. “Al
        carrito” es lo agregado desde una ficha abierta en esa categoría. “Vendidos” incluye
        todas las ventas pagadas de sus productos; en Fotocromáticos y Blue Light, sólo con
        esa luna.
      </p>
    </div>
  );
}
