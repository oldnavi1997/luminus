const ICONOS_BLUE_LIGHT = [
  { src: "/iconos/blue-light/filtro-luz-azul.png", label: "Filtro de luz azul" },
  { src: "/iconos/blue-light/antireflex.png", label: "Antireflex" },
  // El ícono ya trae el "UV400"; la etiqueta completa lo que falta.
  { src: "/iconos/blue-light/uv400.png", label: "Protección total" },
];

// Dos juegos de medidas. El normal es el de la tarjeta del catálogo y el de la
// ficha en escritorio; la ficha en el teléfono (foto de ~300 px) va un 20 % más
// chica todavía, con `enFicha`.
//
// El texto no baja con los recuadros: se queda en su mínimo de 5 px, donde
// "PROTECCIÓN" mide ~32 px. Por eso el recuadro casi no lleva relleno lateral,
// y en una foto de menos de 240 px —la tarjeta del catálogo en un teléfono— el
// recuadro no le deja ese ancho y la etiqueta se oculta: quedan sólo los dibujos.
const NORMAL = {
  fila: "top-[3.2cqw] right-[2.4cqw] gap-[1.2cqw]",
  recuadro: "w-[15.2cqw] gap-[0.8cqw] rounded-[1.6cqw] px-[0.3cqw]",
  dibujo: "h-[7.2cqw]",
  texto: "text-[max(5px,1.85cqw)]",
};
const FICHA = {
  fila: "top-[2.7cqw] right-[2cqw] gap-[1cqw] sm:top-[3.2cqw] sm:right-[2.4cqw] sm:gap-[1.2cqw]",
  recuadro:
    "w-[12.8cqw] gap-[0.7cqw] rounded-[1.4cqw] px-[0.3cqw] sm:w-[15.2cqw] sm:gap-[0.8cqw] sm:rounded-[1.6cqw]",
  dibujo: "h-[6.1cqw] sm:h-[7.2cqw]",
  texto: "text-[max(5px,1.45cqw)] sm:text-[max(5px,1.85cqw)]",
};

/**
 * Lo que trae la luna Blue Light, en tres recuadros sobre la esquina superior
 * derecha de la foto: la tarjeta del catálogo y la galería de la ficha con esa
 * luna elegida. Medido en `cqw`, así que el padre tiene que ser `@container`:
 * guarda la proporción en la tarjeta de un teléfono, en la de escritorio y en
 * la foto grande de la ficha.
 *
 * `enFicha`: más chico en el teléfono (ver FICHA arriba).
 */
export function IconosBlueLight({ enFicha = false }: { enFicha?: boolean }) {
  const m = enFicha ? FICHA : NORMAL;
  return (
    <div className={`absolute flex pointer-events-none ${m.fila}`}>
      {ICONOS_BLUE_LIGHT.map(({ src, label }) => (
        <div
          key={src}
          className={`aspect-[0.86] flex flex-col items-center justify-center bg-white/90 border border-[#111111]/10 ${m.recuadro}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- ícono de 150 px, nada que optimizar */}
          <img src={src} alt="" className={`w-[80%] object-contain ${m.dibujo}`} />
          <span className={`@max-[240px]:hidden text-center font-semibold uppercase leading-[1.1] text-[#1b2a4a] ${m.texto}`}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
