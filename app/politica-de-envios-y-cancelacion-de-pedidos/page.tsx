import Link from "next/link";

export const metadata = {
  title: "Política de envíos y cancelación de pedidos | Luminus",
  description:
    "Conoce los tiempos de entrega, costos de envío y condiciones de cancelación de pedidos en Luminus Eyewear Perú.",
};

export default function PoliticaEnviosPage() {
  return (
    <div className="bg-[#F8F7F4] min-h-screen">
      {/* Hero */}
      <div className="border-b border-[#d5d5d5]">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-14">
          <p className="text-[10px] text-[#d4af37] uppercase tracking-[0.3em] mb-3">Luminus</p>
          <h1
            style={{ fontFamily: "var(--font-inter, sans-serif)" }}
            className="text-3xl font-light text-[#1e293b] tracking-wide"
          >
            Política de envíos y cancelación de pedidos
          </h1>
          <div className="mt-4 h-px bg-gradient-to-r from-[#d4af37]/40 to-transparent w-24" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16 space-y-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[#334155]/60 hover:text-[#1e293b] transition-colors"
        >
          ← Volver al inicio
        </Link>

        {/* Intro */}
        <section className="space-y-4">
          <p className="text-[#334155]/70 text-[15px] leading-relaxed">
            En <strong>LUMINUS</strong>, nos esforzamos por brindarte una experiencia de compra fluida de principio
            a fin. Aquí tienes lo que necesitas saber sobre nuestro proceso de envío y política de cancelación de
            pedidos.
          </p>

          {/* Tabla resumen */}
          <div className="border border-[#d5d5d5] overflow-hidden text-[14px]">
            <div className="grid grid-cols-2 border-b border-[#d5d5d5]">
              <div className="px-4 py-3 bg-[#f1ede4] font-medium text-[#1e293b]">Método de envío</div>
              <div className="px-4 py-3 text-[#334155]/70">Olva Courier y Shalom</div>
            </div>
            <div className="grid grid-cols-2 border-b border-[#d5d5d5]">
              <div className="px-4 py-3 bg-[#f1ede4] font-medium text-[#1e293b]">Área de envío</div>
              <div className="px-4 py-3 text-[#334155]/70">Nacional</div>
            </div>
            <div className="grid grid-cols-2 border-b border-[#d5d5d5]">
              <div className="px-4 py-3 bg-[#f1ede4] font-medium text-[#1e293b]">Tarifa de envío</div>
              <div className="px-4 py-3 text-[#334155]/70 space-y-1">
                <p>Shalom: S/ 8.00</p>
                <p>Olva Courier: S/ 10–18 (según región)</p>
                <p>Olva Courier vía aérea: S/ 25.00</p>
              </div>
            </div>
            <div className="grid grid-cols-2 border-b border-[#d5d5d5]">
              <div className="px-4 py-3 bg-[#f1ede4] font-medium text-[#1e293b]">Procesamiento</div>
              <div className="px-4 py-3 text-[#334155]/70">1–2 días laborables (excluye fines de semana y festivos)</div>
            </div>
            <div className="grid grid-cols-2">
              <div className="px-4 py-3 bg-[#f1ede4] font-medium text-[#1e293b]">Plazo de envío</div>
              <div className="px-4 py-3 text-[#334155]/70">2–3 días tras el procesamiento</div>
            </div>
          </div>

          <p className="text-[#334155]/70 text-[14px] leading-relaxed">
            El envío a ciertas zonas puede verse restringido o cancelado debido a circunstancias locales, como
            condiciones climáticas adversas, emergencias, huelgas y situaciones similares.
          </p>
        </section>

        {/* Envío de pedidos */}
        <section className="space-y-4">
          <h2
            style={{ fontFamily: "var(--font-inter, sans-serif)" }}
            className="text-xl font-light text-[#1e293b] tracking-wide"
          >
            Envío de pedidos
          </h2>
          <p className="text-[#334155]/70 text-[15px] leading-relaxed">
            Su pedido se procesará en un plazo de <strong>1 a 2 días</strong> una vez que se haya realizado el
            pago. Tenga en cuenta que los fines de semana y festivos nacionales no se incluyen en el tiempo de
            procesamiento.
          </p>
          <p className="text-[#334155]/70 text-[15px] leading-relaxed">
            Se pueden realizar cambios en su pedido comunicándose con nuestro equipo de atención al cliente a
            través de nuestro <strong>WhatsApp</strong> o enviando un correo electrónico a{" "}
            <a href="mailto:luminus.eyewear@gmail.com" className="text-[#d4af37] hover:underline">
              luminus.eyewear@gmail.com
            </a>{" "}
            antes de que se programe la entrega del pedido.
          </p>
          <p className="text-[#334155]/70 text-[15px] leading-relaxed">
            En caso de devolución de un envío debido a intentos fallidos de entrega, emitiremos un{" "}
            <strong>reembolso completo</strong>. Sin embargo, deberá realizar un nuevo pedido a través de nuestro
            sitio web.
          </p>
        </section>

        {/* Cambiar dirección */}
        <section className="space-y-4">
          <h2
            style={{ fontFamily: "var(--font-inter, sans-serif)" }}
            className="text-xl font-light text-[#1e293b] tracking-wide"
          >
            Cambiar la dirección de envío
          </h2>
          <p className="text-[#334155]/70 text-[15px] leading-relaxed">
            Si necesita cambiar su dirección de envío, notifíquenoslo lo antes posible. Una vez que el paquete
            esté en tránsito, puede resultar difícil realizar cambios. Contáctenos por{" "}
            <strong>WhatsApp</strong> o a{" "}
            <a href="mailto:luminus.eyewear@gmail.com" className="text-[#d4af37] hover:underline">
              luminus.eyewear@gmail.com
            </a>{" "}
            a la brevedad.
          </p>
        </section>

        {/* Entrega a ciertas regiones */}
        <section className="space-y-4">
          <h2
            style={{ fontFamily: "var(--font-inter, sans-serif)" }}
            className="text-xl font-light text-[#1e293b] tracking-wide"
          >
            Entrega a determinadas regiones
          </h2>
          <p className="text-[#334155]/70 text-[15px] leading-relaxed">
            En algunos casos, es posible que no se pueda realizar la entrega en ciertas regiones por
            circunstancias ajenas a nuestra operación. Si su ubicación se ve afectada, le notificaremos de
            inmediato y emitiremos un <strong>reembolso completo</strong>.
          </p>
        </section>

        {/* Seguimiento */}
        <section className="space-y-4">
          <h2
            style={{ fontFamily: "var(--font-inter, sans-serif)" }}
            className="text-xl font-light text-[#1e293b] tracking-wide"
          >
            Seguimiento de paquetes
          </h2>
          <p className="text-[#334155]/70 text-[15px] leading-relaxed">
            Una vez enviado tu pedido, recibirás un <strong>mensaje con el número de seguimiento</strong>. Podrás
            rastrear tu paquete directamente desde la página web de la empresa de envío (
            <strong>Olva Courier</strong> o <strong>Shalom</strong>).
          </p>
        </section>

        {/* Cancelación */}
        <section className="space-y-4">
          <h2
            style={{ fontFamily: "var(--font-inter, sans-serif)" }}
            className="text-xl font-light text-[#1e293b] tracking-wide"
          >
            Cancelación de pedido
          </h2>
          <p className="text-[#334155]/70 text-[15px] leading-relaxed">
            Puedes cancelar tu pedido <strong>antes de su envío</strong> contactando con nuestro{" "}
            <strong>WhatsApp</strong>. Sin embargo, te recomendamos revisar tu pedido antes de confirmar el pago
            para evitar inconvenientes.
          </p>
          <p className="text-[#334155]/70 text-[15px] leading-relaxed">
            Si tienes alguna pregunta sobre envíos, cambios o devoluciones, no dudes en contactar con nuestro
            equipo de atención al cliente. Estamos aquí para ayudarte en cada paso del proceso.
          </p>
          <p className="text-[#334155]/60 text-[14px] leading-relaxed">
            Puedes consultar la versión más reciente de los Términos de Servicio en cualquier momento en esta
            página.
          </p>
        </section>

        {/* Links relacionados */}
        <div className="border-t border-[#d5d5d5] pt-8">
          <p className="text-[13px] text-[#334155]/50 mb-3">Ver también</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/politica-de-devoluciones-y-reembolsos" className="text-[#d4af37] hover:underline">
              Política de devoluciones y reembolsos
            </Link>
            <Link href="/condiciones-de-servicio" className="text-[#d4af37] hover:underline">
              Condiciones de servicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
