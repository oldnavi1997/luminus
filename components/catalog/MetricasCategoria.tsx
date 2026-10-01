"use client";

import { useEffect, type ReactNode } from "react";
import { avisar, guardarOrigen } from "@/lib/metricas-cliente";

/**
 * Envuelve la grilla de un listado de categoría: cuenta una "vista" al montar
 * y un "clic" cada vez que se abre una ficha desde acá. Un solo listener por
 * delegación, así que las tarjetas no se enteran.
 *
 * La vista depende sólo del slug: cambiar el orden o la página del mismo
 * listado no la vuelve a contar.
 */
export function MetricasCategoria({ categoria, children }: { categoria: string; children: ReactNode }) {
  useEffect(() => {
    avisar(categoria, "vista");
  }, [categoria]);

  const alHacerClic = (e: React.MouseEvent) => {
    const enlace = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
    if (!enlace) return;
    const url = new URL(enlace.href, location.href);
    // Una ficha es /lentes/<slug>; /lentes?… es otro listado.
    const ficha = url.pathname.match(/^\/lentes\/([^/]+)$/);
    if (!ficha) return;
    guardarOrigen(categoria, decodeURIComponent(ficha[1]));
    avisar(categoria, "clic");
  };

  return <div onClickCapture={alHacerClic}>{children}</div>;
}
