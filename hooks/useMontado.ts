import { useSyncExternalStore } from "react";

const sinSuscripcion = () => () => {};

/**
 * `false` en el servidor y durante la hidratación, `true` después.
 *
 * Para lo que sale de localStorage, como el carrito: durante la hidratación
 * zustand entrega el estado del servidor (carrito vacío) y un efecto que corra
 * en esa pasada ve cero ítems aunque el cliente tenga varios. Sin
 * `set-state-in-effect`: no dispara un render extra.
 */
export function useMontado(): boolean {
  return useSyncExternalStore(sinSuscripcion, () => true, () => false);
}
