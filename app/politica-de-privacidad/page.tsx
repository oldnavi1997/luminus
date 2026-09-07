import Link from "next/link";

export const metadata = {
  title: "Política de privacidad | Luminus",
  description:
    "Cómo Luminus Eyewear Perú recopila, usa, comparte y protege tus datos personales, conforme a la Ley N.º 29733.",
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

function List({ children }: { children: React.ReactNode }) {
  return (
    <ul className="list-disc list-outside pl-5 space-y-2 text-[#334155]/70 text-[15px] leading-relaxed">
      {children}
    </ul>
  );
}

const gold = "text-[#d4af37] hover:underline";

export default function PoliticaPrivacidadPage() {
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
            Política de privacidad
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

        <Section title="Nuestro compromiso">
          <P>
            En <strong>Luminus</strong> tratamos tus datos personales con el mismo cuidado con el que armamos
            tus lentes. Esta política explica qué información recopilamos, para qué la usamos, con quién la
            compartimos, cuánto tiempo la conservamos y cómo puedes controlarla en cualquier momento.
          </P>
          <P>
            Está redactada conforme a la <strong>Ley N.º 29733</strong>, Ley de Protección de Datos Personales
            del Perú, y su Reglamento. Al usar www.luminuseyewear.com, comprar en la tienda o escribirnos por
            nuestros canales de atención, aceptas las prácticas descritas aquí.
          </P>
        </Section>

        <Section number="1" title="Quién es responsable de tus datos">
          <P>
            El responsable del tratamiento es <strong>LUMINUS S.A.C.</strong>, con domicilio en Arequipa, Perú,
            titular y operadora del sitio <strong>www.luminuseyewear.com</strong> y de los bancos de datos
            personales asociados a la tienda.
          </P>
          <List>
            <li>
              Correo electrónico:{" "}
              <a href="mailto:luminus.eyewear@gmail.com" className={gold}>
                luminus.eyewear@gmail.com
              </a>
            </li>
            <li>
              WhatsApp:{" "}
              <a href="https://wa.me/51932079598" target="_blank" rel="noopener noreferrer" className={gold}>
                932 079 598
              </a>
            </li>
            <li>Sitio web: www.luminuseyewear.com</li>
          </List>
        </Section>

        <Section number="2" title="Qué datos recopilamos">
          <P>
            Solo pedimos lo necesario para atenderte y entregarte tu pedido. Según cómo uses la tienda, podemos
            tratar los siguientes datos:
          </P>
          <List>
            <li>
              <strong>Identificación y contacto:</strong> nombre y apellidos, número de teléfono o celular,
              correo electrónico y, si creas una cuenta, tu contraseña, que guardamos siempre cifrada y nunca en
              texto legible.
            </li>
            <li>
              <strong>Datos del pedido y la entrega:</strong> dirección de envío, distrito, provincia y
              departamento, código postal, país, empresa de transporte elegida y el detalle de los productos
              comprados, su precio y el estado del pedido.
            </li>
            <li>
              <strong>Datos de facturación:</strong> tipo y número de documento, es decir DNI para boleta o RUC
              y razón social para factura, necesarios para emitir el comprobante de pago que exige la normativa
              tributaria peruana.
            </li>
            <li>
              <strong>Datos de pago:</strong> el identificador y el estado de la transacción que devuelve la
              pasarela, y el medio de pago utilizado. <strong>Nunca recibimos ni almacenamos el número completo
              de tu tarjeta, su fecha de vencimiento ni el código de seguridad:</strong> esos datos viajan
              directamente del formulario de la pasarela a la pasarela.
            </li>
            <li>
              <strong>Datos de salud visual:</strong> si encargas lunas con medida, tratamos la graduación que
              nos indicas y, cuando la adjuntas, la imagen de tu receta oftalmológica. La Ley N.º 29733 los
              considera <strong>datos sensibles</strong>, de modo que los tratamos únicamente para fabricar tus
              lunas, con acceso restringido al personal que interviene en el pedido, y solo cuando tú los envías
              de forma voluntaria.
            </li>
            <li>
              <strong>Comunicaciones:</strong> el contenido de los mensajes, consultas, reclamos y adjuntos que
              nos envías por correo, WhatsApp, Instagram o TikTok, junto con el identificador de tu cuenta en esa
              plataforma.
            </li>
            <li>
              <strong>Datos de navegación:</strong> dirección IP aproximada, tipo de dispositivo y navegador,
              páginas visitadas, origen de la visita y métricas de rendimiento, recogidos mediante cookies y
              tecnologías similares.
            </li>
          </List>
          <P>
            Puedes navegar el catálogo sin darnos ningún dato. Los campos obligatorios del checkout son los
            mínimos para poder cobrar, facturar y entregar; sin ellos no podemos completar la compra.
          </P>
        </Section>

        <Section number="3" title="WhatsApp, Instagram, TikTok y otros canales de atención">
          <P>
            Atendemos consultas y ventas por <strong>WhatsApp</strong>, y estamos presentes en{" "}
            <strong>Instagram</strong> y <strong>TikTok</strong>. Cuando nos escribes por esos canales,
            recibimos el número, el usuario o el perfil desde el que escribes y el contenido de la conversación,
            incluidas las fotos o recetas que decidas enviarnos.
          </P>
          <P>
            Usamos esos mensajes para responderte, preparar tu pedido, coordinar la entrega y dejar constancia
            de acuerdos comerciales, como un cambio o una devolución. No los usamos para publicidad de terceros
            ni los vendemos.
          </P>
          <P>
            Ten en cuenta que esas plataformas son operadas por terceros, Meta Platforms para WhatsApp e
            Instagram y TikTok para su red, y tratan tus datos bajo sus propias políticas de privacidad, sobre
            las cuales no tenemos control. Nuestra responsabilidad alcanza a la información que recibimos y
            conservamos en nuestros sistemas. Si prefieres no usar redes sociales, puedes escribirnos siempre al
            correo indicado en la sección 1.
          </P>
        </Section>

        <Section number="4" title="Cookies y tecnologías similares">
          <P>
            Usamos cookies estrictamente necesarias para mantener tu sesión, proteger los formularios y recordar
            tu preferencia de consentimiento, y cookies analíticas que solo se activan si las aceptas en el
            aviso que aparece al entrar. El contenido de tu carrito se guarda en el almacenamiento local de tu
            navegador y no sale de tu dispositivo hasta que confirmas el pedido.
          </P>
          <P>
            El detalle de cada cookie, su proveedor, su finalidad y su duración, junto con las instrucciones
            para gestionarlas o borrarlas, está en nuestra{" "}
            <Link href="/politica-de-cookies" className={gold}>
              Política de cookies
            </Link>
            .
          </P>
        </Section>

        <Section number="5" title="Para qué usamos tus datos">
          <List>
            <li>
              Procesar tu pedido: cobrarlo, emitir el comprobante, preparar los lentes y coordinar la entrega.
            </li>
            <li>Fabricar tus lunas conforme a la graduación o la receta que nos envías.</li>
            <li>
              Enviarte correos transaccionales: confirmación de compra, estado del pedido y datos de
              seguimiento.
            </li>
            <li>Atender tus consultas, reclamos, cambios, devoluciones y garantías.</li>
            <li>Gestionar tu cuenta de usuario y permitirte revisar el historial de tus compras.</li>
            <li>
              Cumplir obligaciones legales, tributarias y contables, incluida la emisión y conservación de
              comprobantes de pago.
            </li>
            <li>Prevenir fraudes, detectar abusos y proteger la seguridad de la tienda y de tus compras.</li>
            <li>
              Medir de forma agregada cómo se usa el sitio para mejorar el catálogo y la experiencia de compra.
            </li>
            <li>
              Enviarte comunicaciones comerciales sobre lanzamientos y promociones, únicamente si nos diste tu
              consentimiento previo. Puedes retirarlo cuando quieras, sin que eso afecte tus compras.
            </li>
          </List>
          <P>
            No tomamos decisiones automatizadas que produzcan efectos jurídicos sobre ti, ni elaboramos perfiles
            de comportamiento con fines distintos a los descritos.
          </P>
        </Section>

        <Section number="6" title="Con quién compartimos tus datos">
          <P>
            No vendemos ni alquilamos tus datos personales. Los compartimos únicamente con los proveedores que
            necesitamos para prestarte el servicio, que actúan como encargados de tratamiento y solo pueden
            usarlos para la finalidad contratada:
          </P>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-[#334155]/70 border border-[#d5d5d5] rounded-lg overflow-hidden">
              <thead className="bg-[#eaeaea] text-[#1e293b] text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Proveedor</th>
                  <th className="px-4 py-3 text-left">Para qué</th>
                  <th className="px-4 py-3 text-left">Qué recibe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d5d5d5]">
                <tr className="bg-white">
                  <td className="px-4 py-3">Mercado Pago e Izipay</td>
                  <td className="px-4 py-3">Procesar el pago con tarjeta o Yape</td>
                  <td className="px-4 py-3">
                    Los datos que ingresas en su formulario, el monto y el número de pedido
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-3">Shalom y Olva Courier</td>
                  <td className="px-4 py-3">Entregar el pedido</td>
                  <td className="px-4 py-3">Nombre, teléfono y dirección de envío</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-3">Vercel</td>
                  <td className="px-4 py-3">Alojar el sitio y medir su uso de forma agregada</td>
                  <td className="px-4 py-3">Datos técnicos de navegación</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-3">Railway</td>
                  <td className="px-4 py-3">Alojar la base de datos de la tienda</td>
                  <td className="px-4 py-3">Datos de cuenta, pedidos y comprobantes</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-3">Cloudinary</td>
                  <td className="px-4 py-3">Almacenar imágenes, incluidas las recetas que adjuntas</td>
                  <td className="px-4 py-3">Los archivos que subes al pedido</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-3">Resend</td>
                  <td className="px-4 py-3">Enviar los correos de confirmación y seguimiento</td>
                  <td className="px-4 py-3">Nombre, correo y detalle del pedido</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-3">Meta Platforms y TikTok</td>
                  <td className="px-4 py-3">Atención por WhatsApp, Instagram y TikTok</td>
                  <td className="px-4 py-3">Los mensajes que nos envías por esos canales</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-3">Algolia</td>
                  <td className="px-4 py-3">Buscador del catálogo</td>
                  <td className="px-4 py-3">Solo datos de productos, ningún dato personal</td>
                </tr>
              </tbody>
            </table>
          </div>
          <P>
            También podemos entregar información cuando una autoridad competente lo requiera conforme a ley, por
            ejemplo la SUNAT, INDECOPI, el Ministerio Público o el Poder Judicial, o cuando sea necesario para
            defender nuestros derechos ante un reclamo.
          </P>
        </Section>

        <Section number="7" title="Flujo transfronterizo de datos">
          <P>
            Varios de los proveedores listados operan servidores fuera del Perú, principalmente en Estados
            Unidos y la Unión Europea. Al aceptar esta política y realizar tu compra autorizas ese flujo
            transfronterizo, que se realiza conforme al artículo 15 de la Ley N.º 29733 y bajo contratos que
            obligan a cada proveedor a mantener niveles de protección equivalentes a los que exige la ley
            peruana.
          </P>
        </Section>

        <Section number="8" title="Por cuánto tiempo conservamos tus datos">
          <List>
            <li>
              <strong>Cuenta de usuario:</strong> mientras la mantengas activa. Si pides su eliminación, la
              cerramos y borramos tus datos, salvo los que debamos conservar por obligación legal.
            </li>
            <li>
              <strong>Pedidos y comprobantes de pago:</strong> cinco años como mínimo, por las obligaciones
              tributarias y contables aplicables en el Perú.
            </li>
            <li>
              <strong>Recetas y datos de graduación:</strong> durante la vigencia de la garantía y hasta dos
              años después de tu última compra, para poder reponer o corregir tus lunas. Puedes pedir su
              supresión antes de ese plazo.
            </li>
            <li>
              <strong>Mensajes de atención:</strong> hasta veinticuatro meses desde el último contacto.
            </li>
            <li>
              <strong>Cookies y datos de navegación:</strong> según los plazos indicados en la Política de
              cookies.
            </li>
          </List>
          <P>
            Cumplidos esos plazos, los datos se eliminan o se anonimizan de forma que ya no puedan asociarse
            contigo.
          </P>
        </Section>

        <Section number="9" title="Tus derechos sobre tus datos">
          <P>
            La Ley N.º 29733 te reconoce los derechos de <strong>información, acceso, rectificación,
            actualización, inclusión, supresión o cancelación, oposición</strong> y a un{" "}
            <strong>tratamiento objetivo</strong> de tus datos. También puedes impedir que se suministren a
            terceros y revocar en cualquier momento el consentimiento que nos hayas dado, sin efecto
            retroactivo.
          </P>
          <P>
            Revocar el consentimiento sobre tus datos de salud visual o de envío puede impedir que completemos
            un pedido en curso, pero nunca afecta compras ya entregadas ni tu derecho a la garantía.
          </P>
        </Section>

        <Section number="10" title="Cómo solicitar acceso, actualización o eliminación">
          <P>
            Escríbenos a{" "}
            <a href="mailto:luminus.eyewear@gmail.com" className={gold}>
              luminus.eyewear@gmail.com
            </a>{" "}
            con el asunto <strong>Datos personales</strong>, indicando:
          </P>
          <List>
            <li>Tu nombre completo y número de documento de identidad.</li>
            <li>El derecho que deseas ejercer y, si aplica, los datos concretos a corregir o eliminar.</li>
            <li>Un correo o teléfono donde podamos responderte.</li>
            <li>Cualquier dato que sustente tu solicitud, por ejemplo el número de pedido.</li>
          </List>
          <P>
            Podemos pedirte una verificación adicional de identidad antes de atender la solicitud, para evitar
            que un tercero acceda a tus datos. Responderemos las solicitudes de <strong>acceso</strong> dentro
            de los veinte días hábiles, y las de <strong>rectificación, supresión y oposición</strong> dentro de
            los diez días hábiles, contados desde su recepción.
          </P>
          <P>
            Si no atendemos tu solicitud o no estás conforme con la respuesta, puedes presentar un reclamo ante
            la <strong>Autoridad Nacional de Protección de Datos Personales</strong> del Ministerio de Justicia
            y Derechos Humanos.
          </P>
        </Section>

        <Section number="11" title="Cómo protegemos tus datos">
          <P>
            Aplicamos medidas técnicas, organizativas y legales para proteger tu información contra la pérdida,
            el acceso no autorizado, la alteración o la divulgación indebida:
          </P>
          <List>
            <li>
              Todo el sitio se sirve sobre conexión cifrada (HTTPS/TLS), incluidos los formularios de compra.
            </li>
            <li>Las contraseñas se guardan con funciones de hash, de modo que nadie en Luminus puede leerlas.</li>
            <li>
              Los datos de tarjeta se ingresan en formularios de la propia pasarela de pago y nunca pasan por
              nuestros servidores.
            </li>
            <li>El panel de administración exige autenticación y está restringido por rol de usuario.</li>
            <li>El acceso a recetas y datos de salud visual se limita al personal que interviene en el pedido.</li>
            <li>La base de datos cuenta con copias de seguridad y acceso restringido por credenciales.</li>
          </List>
          <P>
            Ningún sistema es infalible. Si ocurriera un incidente que afecte tus datos personales, adoptaremos
            medidas correctivas y te informaremos, así como a la autoridad competente cuando corresponda.
          </P>
        </Section>

        <Section number="12" title="Menores de edad">
          <P>
            Nuestra tienda está dirigida a mayores de edad. No recopilamos deliberadamente datos de menores de
            14 años sin el consentimiento de sus padres o tutores. Si detectamos que hemos recibido datos en
            esas condiciones, los eliminaremos. Si eres padre, madre o tutor y crees que un menor a tu cargo nos
            envió sus datos, escríbenos y procederemos de inmediato.
          </P>
        </Section>

        <Section number="13" title="Cambios a esta política">
          <P>
            Podemos actualizar esta política cuando cambien nuestros servicios, nuestros proveedores o la
            normativa aplicable. La versión vigente será siempre la publicada en esta página, y la fecha de la
            última actualización aparece al pie. Si el cambio es sustancial, te lo comunicaremos por el sitio o
            por correo electrónico.
          </P>
        </Section>

        <Section number="14" title="Contacto">
          <P>
            Para cualquier consulta sobre esta política o sobre el tratamiento de tus datos personales,
            escríbenos a{" "}
            <a href="mailto:luminus.eyewear@gmail.com" className={gold}>
              luminus.eyewear@gmail.com
            </a>{" "}
            o por{" "}
            <a href="https://wa.me/51932079598" target="_blank" rel="noopener noreferrer" className={gold}>
              WhatsApp al 932 079 598
            </a>
            .
          </P>
          <P>
            También puedes revisar nuestras{" "}
            <Link href="/condiciones-de-servicio" className={gold}>
              Condiciones de servicio
            </Link>
            , la{" "}
            <Link href="/politica-de-cookies" className={gold}>
              Política de cookies
            </Link>{" "}
            y la{" "}
            <Link href="/politica-de-devoluciones-y-reembolsos" className={gold}>
              Política de devoluciones y reembolsos
            </Link>
            .
          </P>
        </Section>

        <p className="text-xs text-[#334155]/40 pt-4 border-t border-[#d5d5d5]">
          Última actualización: 6 de septiembre de 2026
        </p>
      </div>
    </div>
  );
}
