import Link from "next/link";

export const metadata = {
  title: "Política de cookies | Luminus",
  description:
    "Descubre qué cookies utiliza Luminus Eyewear, para qué sirven y cómo puedes gestionarlas.",
};

function Section({ number, title, children }: { number?: string; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2
        style={{ fontFamily: "var(--font-inter, sans-serif)" }}
        className="text-xl font-light text-[#1e293b] tracking-wide"
      >
        {number ? `${number} – ${title}` : title}
      </h2>
      {children}
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[#334155]/70 text-[15px] leading-relaxed">{children}</p>;
}

export default function PoliticaCookiesPage() {
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
            Política de cookies
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

        <Section title="¿Qué son las cookies?">
          <P>
            Las cookies son pequeños archivos de texto que los sitios web guardan en tu navegador cuando los
            visitas. Permiten que el sitio recuerde información sobre tu visita, como tus preferencias de idioma
            o el estado de tu sesión, para que la próxima visita sea más fácil y el sitio te resulte más útil.
          </P>
          <P>
            Además de las cookies propiamente dichas, <strong>Luminus</strong> utiliza el almacenamiento local
            del navegador (<em>localStorage</em>) para guardar el contenido de tu carrito de compras. Esta
            información nunca sale de tu dispositivo.
          </P>
        </Section>

        <Section number="1" title="Cookies estrictamente necesarias">
          <P>
            Estas cookies son imprescindibles para que el sitio funcione correctamente. Sin ellas no podrías
            iniciar sesión, mantener tu carrito activo ni completar una compra. No requieren tu consentimiento y
            no pueden desactivarse.
          </P>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-[#334155]/70 border border-[#d5d5d5] rounded-lg overflow-hidden">
              <thead className="bg-[#eaeaea] text-[#1e293b] text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">Proveedor</th>
                  <th className="px-4 py-3 text-left">Propósito</th>
                  <th className="px-4 py-3 text-left">Duración</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d5d5d5]">
                <tr className="bg-white">
                  <td className="px-4 py-3 font-mono text-xs">next-auth.session-token</td>
                  <td className="px-4 py-3">Luminus</td>
                  <td className="px-4 py-3">Mantiene la sesión del usuario autenticado</td>
                  <td className="px-4 py-3">Sesión / 30 días</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-3 font-mono text-xs">next-auth.csrf-token</td>
                  <td className="px-4 py-3">Luminus</td>
                  <td className="px-4 py-3">Protección contra ataques CSRF</td>
                  <td className="px-4 py-3">Sesión</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-3 font-mono text-xs">luminus_cookie_consent</td>
                  <td className="px-4 py-3">Luminus</td>
                  <td className="px-4 py-3">Guarda tu preferencia de consentimiento de cookies</td>
                  <td className="px-4 py-3">1 año</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section number="2" title="Cookies analíticas">
          <P>
            Usamos <strong>Vercel Analytics</strong> para entender cómo los visitantes interactúan con el sitio:
            qué páginas se visitan más, desde qué dispositivos y regiones acceden los usuarios, y otras métricas
            de rendimiento. Esta información nos ayuda a mejorar la experiencia de compra.
          </P>
          <P>
            Vercel Analytics está diseñado con privacidad como prioridad: no rastrea a usuarios individuales, no
            comparte datos con terceros y cumple con las regulaciones de privacidad internacionales. Estas
            cookies solo se activan si aceptas nuestro aviso de cookies.
          </P>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-[#334155]/70 border border-[#d5d5d5] rounded-lg overflow-hidden">
              <thead className="bg-[#eaeaea] text-[#1e293b] text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">Proveedor</th>
                  <th className="px-4 py-3 text-left">Propósito</th>
                  <th className="px-4 py-3 text-left">Duración</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d5d5d5]">
                <tr className="bg-white">
                  <td className="px-4 py-3 font-mono text-xs">_va</td>
                  <td className="px-4 py-3">Vercel</td>
                  <td className="px-4 py-3">Métricas de rendimiento y visitas de página (sin datos personales)</td>
                  <td className="px-4 py-3">Sesión</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section number="3" title="Cómo gestionar tus cookies">
          <P>
            Puedes cambiar tu preferencia en cualquier momento borrando las cookies de este sitio desde la
            configuración de tu navegador. Al recargar la página, el aviso de consentimiento volverá a aparecer
            y podrás elegir de nuevo.
          </P>
          <P>
            A continuación encontrarás instrucciones para los navegadores más comunes:
          </P>
          <ul className="list-disc list-inside space-y-2 text-[#334155]/70 text-[15px]">
            <li>
              <strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies y otros datos de sitios
            </li>
            <li>
              <strong>Firefox:</strong> Configuración → Privacidad y seguridad → Cookies y datos del sitio
            </li>
            <li>
              <strong>Safari:</strong> Preferencias → Privacidad → Gestionar datos de sitios web
            </li>
            <li>
              <strong>Edge:</strong> Configuración → Cookies y permisos de sitio → Cookies y datos del sitio
            </li>
          </ul>
          <P>
            Ten en cuenta que deshabilitar todas las cookies puede afectar el funcionamiento de algunas secciones
            del sitio, como el inicio de sesión o el carrito de compras.
          </P>
        </Section>

        <Section number="4" title="Actualizaciones a esta política">
          <P>
            Podemos actualizar esta Política de cookies cuando añadamos nuevas funcionalidades o herramientas al
            sitio. Te recomendamos revisarla periódicamente. La fecha de la última actualización aparece al pie
            de esta página.
          </P>
        </Section>

        <Section number="5" title="Contacto">
          <P>
            Si tienes preguntas sobre el uso de cookies en Luminus, puedes escribirnos a{" "}
            <a href="mailto:soporte@luminus.pe" className="text-[#d4af37] hover:underline">
              soporte@luminus.pe
            </a>
            .
          </P>
          <P>
            También puedes consultar nuestras{" "}
            <Link href="/condiciones-de-servicio" className="text-[#d4af37] hover:underline">
              Condiciones de servicio
            </Link>{" "}
            para más información sobre el uso de tus datos.
          </P>
        </Section>

        <p className="text-xs text-[#334155]/40 pt-4 border-t border-[#d5d5d5]">
          Última actualización: mayo de 2025
        </p>
      </div>
    </div>
  );
}
