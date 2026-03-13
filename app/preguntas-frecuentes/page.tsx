"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

type FaqItem = {
  question: string;
  answer: string;
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
        question: "¿Cuánto tarda en llegar mi pedido?",
        answer:
          "Los pedidos en Lima Metropolitana se entregan en 2 a 4 días hábiles. Para el resto del país, el plazo es de 5 a 8 días hábiles contados desde la confirmación del pago.",
      },
      {
        question: "¿Tienen envío gratuito?",
        answer:
          "Sí. Los pedidos con un subtotal igual o mayor a S/ 199 califican para envío gratuito a cualquier punto del Perú.",
      },
      {
        question: "¿Puedo rastrear mi pedido?",
        answer:
          "Sí. Una vez despachado tu pedido, recibirás un correo con el código de seguimiento y el enlace al sitio del courier para que puedas monitorear el estado de tu entrega en tiempo real.",
      },
      {
        question: "¿Hacen envíos fuera de Perú?",
        answer:
          "Por el momento solo realizamos envíos dentro del territorio peruano. Si te encuentras en el extranjero y deseas adquirir nuestros productos, contáctanos a contacto@luminuseyewear.com para evaluar opciones.",
      },
    ],
  },
  {
    title: "Productos",
    items: [
      {
        question: "¿Los lentes incluyen estuche y paño?",
        answer:
          "Sí. Todos nuestros lentes vienen acompañados de un estuche rígido y un paño de microfibra para su cuidado y almacenamiento.",
      },
      {
        question: "¿Cómo sé qué talla de lentes es la correcta para mí?",
        answer:
          "Cada producto en nuestro catálogo incluye las medidas del armazón (ancho del lente, puente y varilla). Si tienes dudas, escríbenos y te ayudamos a elegir el modelo más adecuado para el ancho de tu rostro.",
      },
      {
        question: "¿Venden lentes con prescripción?",
        answer:
          "Actualmente nuestro catálogo incluye lentes de sol y armazones ópticos, pero el servicio de graduación con prescripción no está disponible de forma directa en el sitio. Puedes llevar el armazón a un óptico de tu confianza para que te instalen los cristales con tu medida.",
      },
    ],
  },
  {
    title: "Pagos",
    items: [
      {
        question: "¿Qué medios de pago aceptan?",
        answer:
          "Aceptamos tarjetas de débito y crédito Visa, Mastercard y American Express a través de nuestra pasarela de pago segura con Mercado Pago.",
      },
      {
        question: "¿Es seguro pagar en el sitio?",
        answer:
          "Sí. Nuestro sitio utiliza conexión HTTPS con cifrado SSL y procesamos los pagos a través de Mercado Pago, que cumple con los estándares PCI DSS de seguridad de datos de tarjetas. Luminus no almacena datos de tu tarjeta en ningún momento.",
      },
      {
        question: "¿Puedo pagar en cuotas?",
        answer:
          "La disponibilidad de cuotas depende del banco emisor de tu tarjeta y de las promociones vigentes de Mercado Pago. En el paso de pago podrás ver las opciones de financiamiento disponibles para tu tarjeta.",
      },
    ],
  },
  {
    title: "Devoluciones",
    items: [
      {
        question: "¿Puedo devolver un producto?",
        answer:
          "Sí, aceptamos devoluciones dentro de los 30 días calendario desde la recepción, siempre que el producto esté sin uso, en su empaque original y con la boleta de compra. Consulta nuestra Política de devoluciones para más detalles.",
      },
      {
        question: "¿Cuánto demora el reembolso?",
        answer:
          "Una vez aprobada la devolución e inspeccionado el producto, procesamos el reembolso en 5 a 10 días hábiles por el mismo medio de pago que utilizaste en la compra.",
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
            <p className="pb-5 text-[#334155]/70 text-[15px] leading-relaxed">
              {item.answer}
            </p>
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
            style={{ fontFamily: "var(--font-playfair, serif)" }}
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
              style={{ fontFamily: "var(--font-playfair, serif)" }}
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
            <a href="mailto:contacto@luminuseyewear.com" className="text-[#d4af37] hover:underline">
              contacto@luminuseyewear.com
            </a>{" "}
            y te responderemos a la brevedad.
          </p>
        </div>
      </div>
    </div>
  );
}
