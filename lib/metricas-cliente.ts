// Lado navegador del embudo por categoría (ver lib/metricas.ts). Sin "use
// client" porque no es un componente; sólo se llama desde código de cliente.

import type { EventoMetrica } from "@/lib/metricas";

/** Manda el aviso sin esperar respuesta y sin frenar la navegación. */
export function avisar(categoria: string, evento: EventoMetrica): void {
  if (typeof window === "undefined") return;
  const cuerpo = JSON.stringify({ categoria, evento });
  try {
    const blob = new Blob([cuerpo], { type: "application/json" });
    if (navigator.sendBeacon?.("/api/metricas", blob)) return;
  } catch {
    // sendBeacon puede lanzar en navegadores viejos: se cae al fetch.
  }
  fetch("/api/metricas", { method: "POST", body: cuerpo, keepalive: true }).catch(() => {});
}

// El clic a una ficha deja dicho de qué categoría vino, para atribuirle el
// "carrito" si esa misma ficha termina en el carrito. sessionStorage: muere
// con la pestaña y nunca sale del navegador.
const CLAVE = "luminus-metrica-origen";
const VIGENCIA_MS = 30 * 60 * 1000;

interface Origen {
  categoria: string;
  producto: string;
  t: number;
}

export function guardarOrigen(categoria: string, producto: string): void {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify({ categoria, producto, t: Date.now() }));
  } catch {
    // Modo privado o almacenamiento bloqueado: sin atribución, nada más.
  }
}

/**
 * Si el producto que se agrega es el de la última ficha abierta desde una
 * categoría (hace menos de 30 min), cuenta un "carrito" para esa categoría.
 * Una sola vez por clic: después se borra el origen.
 */
export function avisarCarrito(productoSlug: string): void {
  try {
    const guardado = sessionStorage.getItem(CLAVE);
    if (!guardado) return;
    const origen = JSON.parse(guardado) as Origen;
    if (origen.producto !== productoSlug || Date.now() - origen.t > VIGENCIA_MS) return;
    sessionStorage.removeItem(CLAVE);
    avisar(origen.categoria, "carrito");
  } catch {
    // Igual que arriba.
  }
}
