"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, X, ZoomIn, Play } from "lucide-react";
import type Hls from "hls.js";
import { esVideo, esHls, posterDeVideo } from "@/lib/media";

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
                <Image
                  src={images[selectedIdx]}
                  alt={`${name} ${selectedIdx + 1}`}
                  fill
                  className="object-contain"
                  sizes="90vw"
                  priority
                />
              )}
            </div>
          </div>

          {/* Controls */}
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3"
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
