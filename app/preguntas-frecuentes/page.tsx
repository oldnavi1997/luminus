"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

type FaqItem = {
  question: string;
  answer: React.ReactNode;
};

type FaqCategory = {
  title: string;
  items: FaqItem[];
};

const faqData: FaqCategory[] = [
  {
    title: "Pedidos y envíos",
    items: [
      {
        question: "¿Cuáles son sus destinos de envío y los costos asociados?",
        answer: (
          <>
            <p className="mb-2"><strong>Área de envío:</strong> Nacional.</p>
            <p className="mb-2"><strong>Gastos de envío:</strong></p>
            <ul className="list-disc list-inside mb-2 space-y-1">
              <li>Shalom: S/ 8.00</li>
              <li>Olva Courier: S/ 10–18 (puede variar según la región destino)</li>
              <li>Olva Courier vía aérea: S/ 25.00</li>
            </ul>
            <p>
              En algunos casos, es posible que no se pueda realizar la entrega en ciertas regiones debido a
              circunstancias locales (condiciones climáticas adversas, emergencias, huelgas, etc.). Si su
              ubicación se ve afectada, le notificaremos de inmediato y emitiremos un reembolso.
            </p>
          </>
        ),
      },
      {
        question: "¿Puede proporcionarme un tiempo de entrega estimado para mi pedido?",
        answer: (
          <>
            <p className="mb-2">
              <strong>Periodo de procesamiento del pedido:</strong> 1 a 2 días hábiles (excluye fines de semana
              y festivos nacionales).
            </p>
            <p>
              <strong>Periodo de envío:</strong> después del procesamiento, la entrega se realiza dentro de 2 a
              3 días.
            </p>
          </>
        ),
      },
      {
        question: "Si decido cambiar o cancelar mi pedido, ¿cuál es el proceso?",
        answer: (
          <>
            <p className="mb-2">
              Puede cancelar su pedido <strong>antes de su envío</strong> contactando a nuestro{" "}
              <strong>WhatsApp</strong>. Le recomendamos revisar su pedido cuidadosamente antes de realizar el
              pago para evitar inconvenientes.
            </p>
            <p>
              Una vez enviado, no es posible cancelar el pedido. En ese caso, puede solicitar una devolución al
              recibirlo, asumiendo el coste del envío de devolución.
            </p>
          </>
        ),
      },
      {
        question: "¿Es posible actualizar mi dirección de envío después de realizar un pedido?",
        answer: (
          <p>
            Sí. Si necesita cambiar su dirección de envío, notifíquenoslo lo antes posible a través de nuestro{" "}
            <strong>WhatsApp</strong> o a{" "}
            <a href="mailto:luminus.eyewear@gmail.com" className="text-[#d4af37] hover:underline">
              luminus.eyewear@gmail.com
            </a>
            . Una vez que el paquete esté en tránsito, los cambios pueden resultar difíciles de gestionar.
          </p>
        ),
      },
      {
        question: "¿Dónde puedo encontrar información de seguimiento de mi paquete?",
        answer: (
          <p>
            Una vez enviado tu pedido, recibirás un <strong>mensaje con el número de seguimiento</strong>.
            Podrás rastrear tu paquete directamente desde la página web de la empresa de envío (
            <strong>Olva Courier</strong> o <strong>Shalom</strong>).
          </p>
        ),
      },
      {
        question: "¿Cuál es el procedimiento si mi pedido no logra ser entregado?",
        answer: (
          <p>
            Nos hacemos responsables si el pedido no es entregado por parte del transportista. En ese caso, se
            le enviará un nuevo pedido sin costo adicional.
          </p>
        ),
      },
    ],
  },
  {
    title: "Productos",
    items: [
      {
        question: "¿Ofrecen servicios de graduación para sus lentes?",
        answer: (
          <p>
            Sí. Para tal caso necesita adjuntar una foto de su <strong>ficha de ojos</strong>. Con ello
            realizamos sus lentes a medida. Puede contactarnos por <strong>WhatsApp</strong> o{" "}
            <strong>Instagram</strong> para coordinar el proceso.
          </p>
        ),
      },
      {
        question: "¿Dónde puedo consultar las medidas del producto?",
        answer: (
          <p>
            Las medidas y detalles del producto están disponibles en la página de cada artículo, en el menú{" "}
            <strong>"Descripción"</strong>.
          </p>
        ),
      },
      {
        question: "¿Qué hacer si un artículo que quiero comprar está agotado?",
        answer: (
          <p>
            Puede solicitar una notificación de disponibilidad contactándonos al <strong>WhatsApp</strong>{" "}
            indicando <em>"Notificarme cuando esté disponible"</em>. Le avisaremos en cuanto el artículo vuelva
            a estar en stock.
          </p>
        ),
      },
      {
        question: "¿Qué tipos de lentes están disponibles para la selección de gafas?",
        answer: (
          <>
            <p className="mb-2">Al elegir nuestras gafas, puede optar entre:</p>
            <ul className="list-disc list-inside mb-2 space-y-1">
              <li>
                <strong>Lentes de demostración (Montura):</strong> incluidas sin costo adicional.
              </li>
              <li>
                <strong>Filtro de luz azul:</strong> protección UV 400 y antirreflejo, con una tasa de bloqueo
                estimada del 30 %. Tienen un cargo adicional.
              </li>
            </ul>
            <p>
              Para lentes a medida (graduados), contáctenos por <strong>WhatsApp</strong> o{" "}
              <strong>Instagram</strong>. Tenga en cuenta que las gafas con lentes de filtro de luz azul{" "}
              <strong>no se pueden devolver</strong>.
            </p>
          </>
        ),
      },
      {
        question: "¿Ofrecen gafas de sol polarizadas en su colección?",
        answer: (
          <p>
            Sí. Nuestras gafas de sol polarizadas bloquean eficazmente los rayos UV y la luz reflejada,
            reduciendo el deslumbramiento para una visión clara durante actividades al aire libre.
          </p>
        ),
      },
      {
        question: "¿A qué categoría de filtro solar pertenecen sus gafas de sol?",
        answer: (
          <p>
            Todas nuestras lentes de gafas de sol ofrecen protección{" "}
            <strong>UV 400 / 100 % contra los rayos UVA, UVB y UVC</strong>.
          </p>
        ),
      },
      {
        question: "¿Cuáles son los procedimientos de mantenimiento recomendados para las monturas?",
        answer: (
          <>
            <p className="mb-2">Para garantizar la longevidad de sus gafas:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Limpieza:</strong> use un limpiador de lentes suave y un paño de microfibra. Evite
                productos químicos agresivos o materiales abrasivos.
              </li>
              <li>
                <strong>Almacenamiento:</strong> guárdalas en un estuche protector. Evite colocarlas con los
                lentes hacia abajo.
              </li>
              <li>
                <strong>Evitar el calor:</strong> manténgalas lejos de fuentes de calor directas (agua
                caliente, secadores, tableros de automóviles).
              </li>
              <li>
                <strong>Mantenimiento:</strong> revise periódicamente tornillos, plaquetas nasales y terminales
                de patillas.
              </li>
              <li>
                <strong>Evitar la humedad:</strong> mantenga sus gafas alejadas de áreas con mucha humedad.
              </li>
            </ul>
          </>
        ),
      },
      {
        question: "¿Reparan monturas o lunas?",
        answer: (
          <p>LUMINUS no realiza servicios de reparación de monturas ni lunas.</p>
        ),
      },
    ],
  },
  {
    title: "Devoluciones y garantía",
    items: [
      {
        question: "¿Cuál es su política con respecto a las devoluciones?",
        answer: (
          <p>
            En LUMINUS, nuestra prioridad es su completa satisfacción. Si por cualquier motivo no está
            satisfecho con su compra, ofrecemos un proceso formal de devolución y reembolso. Visita nuestra{" "}
            <Link
              href="/politica-de-devoluciones-y-reembolsos"
              className="text-[#d4af37] hover:underline"
            >
              Política de devoluciones y reembolsos
            </Link>{" "}
            para obtener todos los detalles.
          </p>
        ),
      },
      {
        question: "¿Cómo proceder para devolver o cambiar artículos dañados o incorrectos?",
        answer: (
          <>
            <p className="mb-2">
              Inicie la devolución contactando nuestro <strong>WhatsApp</strong>. Nuestro horario de atención
              es <strong>lunes a viernes, de 9:00 a. m. a 8:00 p. m.</strong>
            </p>
            <p>
              Si encuentra algún problema con el producto al recibirlo, proporcione una descripción detallada
              del problema junto con una <strong>foto que muestre el daño</strong>.
            </p>
          </>
        ),
      },
      {
        question: "¿Es posible cambiar un artículo si cambio de opinión?",
        answer: (
          <>
            <p className="mb-2">
              Sí. Para devoluciones por cambio de opinión, organice el envío de retorno a través de la misma
              agencia de envío inicial y cubra los gastos de envío.
            </p>
            <p>
              Una vez recibido e inspeccionado el artículo, le reembolsaremos el importe íntegro. Si desea
              cambiar el producto por otro, le rogamos que realice un nuevo pedido.
            </p>
          </>
        ),
      },
      {
        question: "¿Cuánto tiempo tarda en procesarse una devolución?",
        answer: (
          <p>
            Una vez que recibamos e inspeccionemos los productos devueltos, procesaremos su reembolso en un
            plazo de <strong>3 días hábiles</strong>. El tiempo de acreditación puede variar según el medio de
            pago.
          </p>
        ),
      },
      {
        question: "¿Qué cubre la garantía y cuánto dura?",
        answer: (
          <>
            <ul className="list-disc list-inside space-y-1 mb-2">
              <li>
                <strong>Todos los lentes:</strong> 180 días para fallas de fábrica.
              </li>
              <li>
                <strong>Monturas Titanio y Acetato:</strong> garantía de 180 días desde la recepción.
              </li>
              <li>
                <strong>Monturas TR90 y Metal:</strong> garantía de 90 días desde la recepción.
              </li>
              <li>
                <strong>Error en medida de lunas:</strong> 15 días desde la recepción para comunicarlo.
                Si comprobamos el error, las reemplazamos de forma gratuita cubriendo el envío.
              </li>
            </ul>
            <p>
              En caso de garantía, recibirás un reembolso del 100 % como crédito en tienda o el cambio por
              una montura nueva del mismo modelo, incluyendo el traspaso de tus lunas.
            </p>
          </>
        ),
      },
    ],
  },
];

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y divide-[#d5d5d5]">
      {items.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between py-4 text-left gap-4 group"
          >
            <span className="text-[15px] text-[#1e293b] font-light leading-snug group-hover:text-[#d4af37] transition-colors">
              {item.question}
            </span>
            <ChevronDown
              size={16}
              className={`shrink-0 text-[#d4af37] transition-transform duration-200 ${
                openIndex === i ? "rotate-180" : ""
              }`}
            />
          </button>
          {openIndex === i && (
            <div className="pb-5 text-[#334155]/70 text-[15px] leading-relaxed">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function PreguntasFrecuentesPage() {
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
            Preguntas frecuentes
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

        {faqData.map((category, i) => (
          <section key={i} className="space-y-2">
            <h2
              style={{ fontFamily: "var(--font-inter, sans-serif)" }}
              className="text-xl font-light text-[#1e293b] tracking-wide mb-4"
            >
              {category.title}
            </h2>
            <div className="border-t border-[#d5d5d5]">
              <FaqAccordion items={category.items} />
            </div>
          </section>
        ))}

        <div className="pt-4 border-t border-[#d5d5d5]">
          <p className="text-[#334155]/70 text-[15px] leading-relaxed">
            ¿No encontraste lo que buscabas? Escríbenos a{" "}
            <a href="mailto:luminus.eyewear@gmail.com" className="text-[#d4af37] hover:underline">
              luminus.eyewear@gmail.com
            </a>{" "}
            o contáctanos por <strong>WhatsApp</strong> y te responderemos a la brevedad.
          </p>
        </div>
      </div>
    </div>
  );
}
