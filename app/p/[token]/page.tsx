import Link from "next/link";
import { cargarPedidoCompartido } from "@/lib/pedido-compartido";
import { CargarPedidoCompartido } from "@/components/cart/CargarPedidoCompartido";

export const dynamic = "force-dynamic";
// El enlace lleva la receta del cliente: que no lo indexe nadie.
export const metadata = { robots: { index: false, follow: false } };

export default async function PedidoCompartidoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const pedido = await cargarPedidoCompartido(token);

  if (!pedido || pedido.items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <h1 className="text-2xl font-light text-[#111111] mb-3">
          {pedido ? "Estos productos ya no están disponibles" : "Este enlace ya no es válido"}
        </h1>
        <p className="text-sm text-[#111111]/50 mb-10">
          {pedido
            ? "Se agotaron o dejaron de venderse. Escríbenos y te ayudamos a armar tu pedido."
            : "Los enlaces de pedido duran 7 días. Pide uno nuevo a quien te lo envió."}
        </p>
        <Link
          href="/lentes"
          className="inline-block border border-[#111111] px-8 py-3 text-[11px] uppercase tracking-[0.2em] text-[#111111] hover:bg-[#111111] hover:text-white transition-colors"
        >
          Ver catálogo
        </Link>
      </div>
    );
  }

  return <CargarPedidoCompartido items={pedido.items} descartados={pedido.descartados} />;
}
