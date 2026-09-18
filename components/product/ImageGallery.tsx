"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, X, ZoomIn, Play } from "lucide-react";
import type Hls from "hls.js";
import { esVideo, esHls, posterDeVideo } from "@/lib/media";
import cloudinaryLoader from "@/lib/cloudinary-loader";

interface ImageGalleryProps {
  images: string[];
  name: string;
}

/** MediaSource clásico o ManagedMediaSource (iPhone con iOS 17.1+): con cualquiera, hls.js. */
function hayMediaSource(): boolean {
  return typeof window.MediaSource !== "undefined" || "ManagedMediaSource" in window;
}

/**
 * Un video de la galería.
 *
 * `preload="none"` es deliberado y no debería relajarse: en escritorio las
 * miniaturas se seleccionan al pasar el mouse, así que un autoplay descargaría
 * el video de cada visitante que barre la tira con el cursor. Con el poster
 * puesto, un video sólo cuesta bytes cuando alguien le da play a propósito.
 *
 * Los de Bunny Stream son HLS (`playlist.m3u8`) y **no se conectan hasta el
 * play**: con hls.js enganchado el `<video>` queda "cargando" y Chrome pinta el
 * spinner encima del poster, mientras que uno de Cloudinary con
 * `preload="none"` muestra el botón de play. Y un `<video>` sin fuente muestra
 * los controles deshabilitados, así que hasta el primer play se usa un botón
 * propio sobre el poster; después quedan los controles nativos.
 *
 * Al montar sólo se trae el módulo de hls.js (JS propio, nada de Bunny), para
 * que el play no espere esa descarga. Arranca en la resolución más alta — el ABR
 * baja solo si la conexión no da — porque un clip de producto no puede verse
 * peor que la foto de al lado.
 */
function VideoItem({ src, name, className }: { src: string; name: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const hls = esHls(src);
  const [activo, setActivo] = useState(!hls);
  const instanciaRef = useRef<Hls | null>(null);
  const moduloRef = useRef<typeof Hls | null>(null);

  useEffect(() => {
    if (!hls || !hayMediaSource()) return;
    let desmontado = false;
    void import("hls.js").then(({ default: HlsJs }) => {
      if (!desmontado) moduloRef.current = HlsJs;
    });
    return () => {
      desmontado = true;
      instanciaRef.current?.destroy();
      instanciaRef.current = null;
    };
  }, [hls]);

  /**
   * Todo sincrónico dentro del click: Safari de iPhone sólo deja reproducir con
   * sonido si `play()` sale del gesto del usuario, y esperar al playlist lo
   * rompería. `attachMedia` asigna el `src` del MediaSource en el acto, así que
   * el `play()` queda pendiente hasta que llegan los segmentos.
   */
  const conectar = (HlsJs: typeof Hls, video: HTMLVideoElement): boolean => {
    if (!HlsJs.isSupported()) return false;
    // iPhone no tiene MediaSource clásico, sólo ManagedMediaSource (iOS 17.1+),
    // y Safari no lo abre si el video admite AirPlay sin una fuente alternativa.
    if (typeof window.MediaSource === "undefined") video.disableRemotePlayback = true;
    const instancia = new HlsJs({
      autoStartLoad: false,
      // MSE clásico donde exista; ManagedMediaSource sólo donde es lo único (iPhone).
      preferManagedMediaSource: false,
      // Sin una medición todavía, hls.js supone 500 kbps y bajaría la variante
      // alta en el primer segmento. 5 Mbps sostiene 1080p de Bunny.
      abrEwmaDefaultEstimate: 5_000_000,
    });
    instanciaRef.current = instancia;
    // Se busca la más alta en vez de tomar la última: el master de Bunny no
    // viene ordenado (360p, 480p, 720p, 240p).
    instancia.on(HlsJs.Events.MANIFEST_PARSED, (_evento, datos) => {
      let mejor = 0;
      datos.levels.forEach((nivel, i) => {
        if (nivel.height > datos.levels[mejor].height) mejor = i;
      });
      instancia.startLevel = mejor;
      instancia.startLoad();
    });
    instancia.loadSource(src);
    instancia.attachMedia(video);
    void video.play().catch(() => {});
    return true;
  };

  const reproducir = async () => {
    const video = ref.current;
    if (!video || activo) return;
    setActivo(true);

    // hls.js tiene prioridad sobre el HLS nativo aunque el navegador diga que lo
    // reproduce: Chrome y Safari arrancan en la primera variante del master —
    // en Bunny es 360p — y recién después suben. El nativo queda para donde no
    // hay ningún MediaSource (iPhone con iOS anterior a 17.1).
    if (hayMediaSource()) {
      if (moduloRef.current) {
        if (conectar(moduloRef.current, video)) return;
      } else {
        // Click antes de que terminara de bajar el módulo. En iPhone este play
        // puede quedar bloqueado; los controles ya están visibles para reintentar.
        const { default: HlsJs } = await import("hls.js");
        if (conectar(HlsJs, video)) return;
      }
    }

    video.src = src;
    void video.play().catch(() => {});
  };

  return (
    <>
      <video
        ref={ref}
        src={hls ? undefined : src}
        poster={posterDeVideo(src, 1000)}
        controls={activo}
        playsInline
        loop
        preload="none"
        aria-label={`${name} — video`}
        className={className}
      />
      {!activo && (
        <button
          type="button"
          onClick={() => void reproducir()}
          aria-label={`Reproducir video de ${name}`}
          className="absolute inset-0 flex items-center justify-center group"
        >
          <span className="w-14 h-14 rounded-full bg-black/55 group-hover:bg-black/70 transition-colors flex items-center justify-center">
            <Play className="h-6 w-6 text-white fill-white translate-x-0.5" />
          </span>
        </button>
      )}
    </>
  );
}

const ZOOM_MAX = 4;
/** Zoom de un doble toque/clic: suficiente para leer un grabado sin perder el encuadre. */
const ZOOM_DOBLE = 2.5;
/**
 * Ancho de la capa nítida. Se pide al loader a mano en vez de agregarlo a
 * `deviceSizes`: por el `srcset` lo heredaría toda vista que use anchos en `vw`
 * —la ficha, el carrusel—, y acá sólo lo necesita el lightbox.
 *
 * Cuesta: una versión derivada por foto que alguien abra ampliada, y sus bytes
 * en cada apertura. Es una decisión tomada a sabiendas, priorizando que el zoom
 * sea instantáneo; si el plan de Cloudinary aprieta, lo primero que hay que
 * mirar es el desglose de `GET /usage`, no bajar la calidad servida.
 *
 * Cubre el zoom máximo: 4x sobre una caja de ~342 px en un teléfono a 3x son
 * ~4100 px, y el cuadrado real de la cámara del catálogo es 4000. Es además el
 * piso del master en `lib/cloudinary.ts` — guardarlo por debajo de 3840 sería
 * entregarle al cliente menos de lo que su pantalla pide. En las fotos viejas,
 * que quedaron en 1200, `c_limit` devuelve 1200 y no pasa nada: no hay
 * ampliación, sólo menos detalle.
 */
const ANCHO_ZOOM = 3840;

/**
 * La foto del lightbox, con zoom.
 *
 * En el teléfono la foto se dibuja a ~342 px de CSS, así que ni con el master a
 * 4000 px se ve el detalle: el límite es la pantalla, no el archivo. El zoom es
 * lo único que convierte esos píxeles en algo que el cliente pueda mirar.
 *
 * Todo pasa por Pointer Events, que unifican dedo y mouse: dos punteros pellizcan,
 * uno arrastra. El `touch-action: none` es imprescindible — sin él el navegador
 * se queda el gesto para hacer scroll o su propio zoom de página.
 *
 * El acercamiento conserva el punto que el usuario tiene bajo el dedo. Si `c` es
 * ese punto en coordenadas del contenido, `c * escala + desplazamiento` es dónde
 * cae en pantalla; mantenerlo fijo al pasar de `s0` a `s1` da
 * `d1 = d0 + (p - d0) * (1 - s1/s0)`.
 */
function FotoConZoom({
  src,
  alt,
  onTap,
}: {
  src: string;
  alt: string;
  /** Un toque limpio, sin arrastre ni zoom: el overlay lo usa para cerrarse. */
  onTap: () => void;
}) {
  /**
   * Escala y desplazamiento viajan juntos: acercar mueve los dos a la vez, y
   * separarlos obligaría a que el updater de uno tocara el otro — un efecto
   * secundario dentro de un updater, que React 19 invoca dos veces en
   * desarrollo. Un solo estado deja los updaters puros.
   */
  const [vista, setVista] = useState({ escala: 1, x: 0, y: 0 });
  const { escala } = vista;
  const [hiResLista, setHiResLista] = useState(false);
  const cajaRef = useRef<HTMLDivElement>(null);
  const punteros = useRef(new Map<number, { x: number; y: number }>());
  const pellizco = useRef<{ dist: number; escala: number; centro: { x: number; y: number } } | null>(null);
  const arrastre = useRef<{ x: number; y: number; desp: { x: number; y: number }; movido: boolean } | null>(null);
  const ultimoTap = useRef(0);
  /**
   * El cierre por toque simple espera a ver si viene un segundo toque.
   *
   * Sin esta espera el doble toque no existe: el primer toque cierra el
   * lightbox, el componente se desmonta y el segundo cae sobre el carrusel de
   * abajo, que lo vuelve a abrir. Se ve como si el zoom no hiciera nada.
   */
  const cierrePendiente = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Hay un dedo/botón apoyado: mientras dure, la transformación sigue al dedo sin transición. */
  const [gesto, setGesto] = useState(false);

  const ampliada = escala > 1.01;

  /** Impide que la foto se despegue de su caja: a escala `s` sobra `(s-1)/2` por lado. */
  const limitar = useCallback((v: { escala: number; x: number; y: number }) => {
    const caja = cajaRef.current;
    if (!caja) return v;
    const maxX = (caja.clientWidth * (v.escala - 1)) / 2;
    const maxY = (caja.clientHeight * (v.escala - 1)) / 2;
    return {
      escala: v.escala,
      x: Math.max(-maxX, Math.min(maxX, v.x)),
      y: Math.max(-maxY, Math.min(maxY, v.y)),
    };
  }, []);

  /** Lleva la escala a `s1` dejando quieto el punto `p` (relativo al centro de la caja). */
  const acercarA = useCallback(
    (s1: number, p: { x: number; y: number }) => {
      setVista((v) => {
        const s = Math.max(1, Math.min(ZOOM_MAX, s1));
        if (s === 1) return { escala: 1, x: 0, y: 0 };
        const factor = 1 - s / v.escala;
        return limitar({ escala: s, x: v.x + (p.x - v.x) * factor, y: v.y + (p.y - v.y) * factor });
      });
    },
    [limitar]
  );

  /** Coordenadas de un evento respecto del centro de la caja. */
  const respectoAlCentro = (e: { clientX: number; clientY: number }) => {
    const r = cajaRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return { x: e.clientX - (r.left + r.width / 2), y: e.clientY - (r.top + r.height / 2) };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    // Con la captura, arrastrar más allá del borde de la foto sigue mandando
    // eventos acá. Va en try: capturar un puntero que el navegador ya no
    // considera activo lanza NotFoundError, y perder la captura no es motivo
    // para romper el gesto.
    try {
      (e.target as Element).setPointerCapture?.(e.pointerId);
    } catch {
      /* sin captura, el gesto sigue funcionando mientras el dedo no se salga */
    }
    punteros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setGesto(true);
    if (cierrePendiente.current) {
      clearTimeout(cierrePendiente.current);
      cierrePendiente.current = null;
    }

    if (punteros.current.size === 2) {
      const [a, b] = [...punteros.current.values()];
      pellizco.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        escala,
        centro: respectoAlCentro({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 }),
      };
      arrastre.current = null;
    } else if (punteros.current.size === 1) {
      arrastre.current = { x: e.clientX, y: e.clientY, desp: { x: vista.x, y: vista.y }, movido: false };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!punteros.current.has(e.pointerId)) return;
    punteros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (punteros.current.size >= 2 && pellizco.current) {
      const [a, b] = [...punteros.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      acercarA((pellizco.current.escala * dist) / pellizco.current.dist, pellizco.current.centro);
      return;
    }

    const arr = arrastre.current;
    if (!arr || !ampliada) return;
    const dx = e.clientX - arr.x;
    const dy = e.clientY - arr.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) arr.movido = true;
    setVista((v) => limitar({ escala: v.escala, x: arr.desp.x + dx, y: arr.desp.y + dy }));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    punteros.current.delete(e.pointerId);
    if (punteros.current.size < 2) pellizco.current = null;

    const arr = arrastre.current;
    arrastre.current = null;
    if (punteros.current.size > 0) return;
    setGesto(false);

    // Doble toque: alterna entre ajustada y ampliada sobre el punto tocado.
    const ahora = Date.now();
    const esDoble = ahora - ultimoTap.current < 300;
    ultimoTap.current = ahora;
    if (esDoble && !arr?.movido) {
      acercarA(ampliada ? 1 : ZOOM_DOBLE, respectoAlCentro(e));
      return;
    }
    // Un toque sin más, con la foto ajustada, cierra. Ampliada no: ahí el
    // usuario está mirando, y para salir están la X y el doble toque.
    if (!arr?.movido && !ampliada) {
      cierrePendiente.current = setTimeout(onTap, 280);
    }
  };

  const onWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    acercarA(escala * Math.exp(-e.deltaY / 400), respectoAlCentro(e));
  };

  // Cada foto entra ajustada porque el lightbox monta esto con `key={src}`: al
  // cambiar de imagen es un componente nuevo, sin escala ni desplazamiento que
  // arrastrar.

  // El zoom no se ve: sin un empujón nadie prueba a pellizcar una foto que ya
  // está entera en pantalla. La pista se va sola y no vuelve.
  const [pista, setPista] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setPista(false), 3500);
    return () => {
      clearTimeout(t);
      if (cierrePendiente.current) clearTimeout(cierrePendiente.current);
    };
  }, []);

  return (
    <div
      ref={cajaRef}
      className="absolute inset-0 touch-none select-none"
      style={{ cursor: ampliada ? "grab" : "zoom-in" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${vista.x}px, ${vista.y}px) scale(${escala})`,
          // Sin transición durante el gesto: seguir el dedo con retraso se siente roto.
          transition: gesto ? "none" : "transform 0.15s ease-out",
        }}
      >
        <Image src={src} alt={alt} fill className="object-contain" sizes="90vw" priority />
        {/* La capa nítida se pide al abrir el lightbox, no al acercar: es la
            única forma de que el zoom sea instantáneo. Esperar al gesto dejaba
            la foto borrosa casi un segundo, y el cliente no tiene cómo saber que
            viene una versión mejor — ve eso y concluye que la foto es así.
            Se revela al terminar de cargar, no antes, para no tapar la foto
            ajustada con un hueco en blanco. */}
        {
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cloudinaryLoader({ src, width: ANCHO_ZOOM })}
            alt=""
            aria-hidden
            fetchPriority="high"
            // El `complete` cubre el caso de que la imagen ya estuviera en
            // caché y su `load` se haya disparado antes de que React montara el
            // handler: sin esto la capa nítida quedaría cargada pero invisible
            // para siempre, y el zoom se vería borroso sin motivo aparente.
            ref={(el) => {
              if (el?.complete && el.naturalWidth > 0) setHiResLista(true);
            }}
            onLoad={() => setHiResLista(true)}
            // Si no carga, la foto ajustada se queda y el aviso se va: peor es
            // dejar girando un indicador de algo que no va a llegar.
            onError={() => setHiResLista(true)}
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-200 ${
              hiResLista ? "opacity-100" : "opacity-0"
            }`}
          />
        }
      </div>

      {/* Un aviso por vez, en el mismo lugar: primero cómo acercar, y una vez
          acercado, que lo borroso es momentáneo. Sin esto el cliente ve la foto
          sin definición y da por hecho que la foto es así. */}
      <div
        className={`pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3.5 py-1.5 text-[11px] tracking-wide text-[#1c1c1c] shadow-sm transition-opacity duration-500 ${
          ampliada && !hiResLista ? "opacity-100" : pista && !ampliada ? "opacity-100" : "opacity-0"
        }`}
      >
        {ampliada ? (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 animate-spin rounded-full border border-[#1c1c1c]/25 border-t-[#1c1c1c]/70" />
            Afinando detalle…
          </span>
        ) : (
          <>
            <span className="sm:hidden">Pellizca para acercar</span>
            <span className="hidden sm:inline">Rueda o doble clic para acercar</span>
          </>
        )}
      </div>
    </div>
  );
}

export function ImageGallery({ images, name }: ImageGalleryProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    dragFree: true,
    align: "start",
    containScroll: "trimSnaps",
  });

  // Sincronizar el índice con la imagen visible del carrusel móvil
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIdx(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  const openLightbox = (idx: number) => {
    setSelectedIdx(idx);
    setLightboxOpen(true);
  };

  const showPrev = useCallback(
    () => setSelectedIdx((i) => (i - 1 + images.length) % images.length),
    [images.length]
  );
  const showNext = useCallback(
    () => setSelectedIdx((i) => (i + 1) % images.length),
    [images.length]
  );

  // Keyboard nav + body scroll lock while lightbox is open
  useEffect(() => {
    if (!lightboxOpen) return;
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      else if (e.key === "ArrowLeft") showPrev();
      else if (e.key === "ArrowRight") showNext();
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handler);
    };
  }, [lightboxOpen, showPrev, showNext]);

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-[#f5f5f5] flex items-center justify-center">
        <svg width="64" height="64" viewBox="0 0 48 48" fill="none" className="text-[#111111]/15">
          <path d="M6 24C6 24 10 16 24 16C38 16 42 24 42 24C42 24 38 32 24 32C10 32 6 24 6 24Z" stroke="currentColor" strokeWidth="1" fill="none"/>
          <circle cx="24" cy="24" r="4" stroke="currentColor" strokeWidth="1" fill="none"/>
        </svg>
      </div>
    );
  }

  const seleccionEsVideo = esVideo(images[selectedIdx]);

  return (
    <div>
      {/* Desktop layout: thumbnails left + main image right */}
      <div className="hidden sm:flex gap-3">
        {images.length > 1 && (
          <div className="flex flex-col gap-2 w-[68px] flex-shrink-0">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIdx(idx)}
                onMouseEnter={() => setSelectedIdx(idx)}
                onFocus={() => setSelectedIdx(idx)}
                className={`relative w-full aspect-square border overflow-hidden cursor-pointer transition-colors duration-150 ${
                  idx === selectedIdx
                    ? "border-[#1c1c1c]"
                    : "border-[#dadadd] hover:border-[#1c1c1c]/40"
                }`}
              >
                <Image
                  src={img}
                  alt={`${name} ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="68px"
                />
                {esVideo(img) && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Play className="h-4 w-4 text-white fill-white" />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
        {seleccionEsVideo ? (
          <div className="flex-1 relative aspect-square bg-black overflow-hidden">
            <VideoItem
              key={images[selectedIdx]}
              src={images[selectedIdx]}
              name={name}
              className="absolute inset-0 w-full h-full object-contain"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label="Ampliar imagen"
            className="flex-1 relative aspect-square bg-white overflow-hidden cursor-zoom-in"
          >
            {images.map((img, idx) =>
              // Los videos no entran en la pila: sólo las fotos se apilan con
              // opacidad para que cambiar de miniatura sea instantáneo.
              esVideo(img) ? null : (
                <Image
                  key={idx}
                  src={img}
                  alt={name}
                  fill
                  className={`object-contain ${
                    idx === selectedIdx ? "opacity-100" : "opacity-0"
                  }`}
                  sizes="(max-width: 1024px) 45vw, 500px"
                  priority={idx === 0}
                  loading={idx === 0 ? undefined : "eager"}
                />
              )
            )}
          </button>
        )}
      </div>

      {/* Mobile layout: free-scroll carousel with peek (Embla) */}
      <div className="relative sm:hidden">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex gap-0.5">
            {images.map((img, idx) =>
              esVideo(img) ? (
                <div key={idx} className="w-[80%] flex-shrink-0 relative aspect-square bg-black">
                  <VideoItem
                    src={img}
                    name={name}
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                </div>
              ) : (
                <button
                  key={idx}
                  type="button"
                  onClick={() => openLightbox(idx)}
                  className="w-[80%] flex-shrink-0 relative aspect-square bg-[#f5f5f5]"
                >
                  <Image
                    src={img}
                    alt={`${name} ${idx + 1}`}
                    fill
                    className="object-contain"
                    sizes="80vw"
                    priority={idx === 0}
                  />
                </button>
              )
            )}
          </div>
        </div>
        {/* Botón de lupa (zoom) — sobre un video no aplica */}
        {!seleccionEsVideo && (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label="Ampliar imagen"
            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-[#1c1c1c] active:scale-95 transition-transform"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Lightbox / zoom overlay */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[60] bg-[#F8F7F4] animate-[fade-in_0.2s_ease-out] flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${name} — imagen ampliada`}
        >
          <div className="relative w-full h-full max-w-5xl max-h-[85vh] mx-auto px-6 sm:px-16">
            <div className="relative w-full h-full">
              {seleccionEsVideo ? (
                // El click se detiene acá: los controles nativos del video
                // viven dentro del overlay y el overlay cierra al click.
                <div className="absolute inset-0" onClick={(e) => e.stopPropagation()}>
                  <VideoItem
                    key={images[selectedIdx]}
                    src={images[selectedIdx]}
                    name={name}
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                </div>
              ) : (
                <FotoConZoom
                  key={images[selectedIdx]}
                  src={images[selectedIdx]}
                  alt={`${name} ${selectedIdx + 1}`}
                  onTap={() => setLightboxOpen(false)}
                />
              )}
            </div>
          </div>

          {/* Controls — por encima de la foto, que al ampliarse desborda su caja */}
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {images.length > 1 && (
              <button
                type="button"
                onClick={showPrev}
                aria-label="Imagen anterior"
                className="w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center text-[#1c1c1c] hover:bg-[#f0f0f0] transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              aria-label="Cerrar"
              className="w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center text-[#1c1c1c] hover:bg-[#f0f0f0] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            {images.length > 1 && (
              <button
                type="button"
                onClick={showNext}
                aria-label="Imagen siguiente"
                className="w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center text-[#1c1c1c] hover:bg-[#f0f0f0] transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
