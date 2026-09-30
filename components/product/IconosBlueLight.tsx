const ICONOS_BLUE_LIGHT = [
  { src: "/iconos/blue-light/filtro-luz-azul.png", label: "Filtro de luz azul" },
  { src: "/iconos/blue-light/antireflex.png", label: "Antireflex" },
  // El ícono ya trae el "UV400"; la etiqueta completa lo que falta.
  { src: "/iconos/blue-light/uv400.png", label: "Protección total" },
];

/**
 * Lo que trae la luna Blue Light, en tres recuadros sobre la esquina superior
 * derecha de la foto: la tarjeta del catálogo y la galería de la ficha con esa
 * luna elegida. Medido en `cqw`, así que el padre tiene que ser `@container`:
 * guarda la proporción en la tarjeta de un teléfono, en la de escritorio y en
 * la foto grande de la ficha.
 */
export function IconosBlueLight() {
  return (
    <div className="absolute top-[4cqw] right-[3cqw] flex gap-[1.5cqw] pointer-events-none">
      {ICONOS_BLUE_LIGHT.map(({ src, label }) => (
        <div
          key={src}
          className="w-[19cqw] aspect-[0.86] flex flex-col items-center justify-center gap-[1cqw] bg-white/90 border border-[#111111]/10 rounded-[2cqw] px-[1cqw]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- ícono de 150 px, nada que optimizar */}
          <img src={src} alt="" className="w-[80%] h-[9cqw] object-contain" />
          <span className="text-center font-semibold uppercase leading-[1.1] text-[#1b2a4a] text-[max(5px,2.3cqw)]">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
