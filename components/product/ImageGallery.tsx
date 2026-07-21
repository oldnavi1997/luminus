"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  name: string;
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
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label="Ampliar imagen"
          className="flex-1 relative aspect-square bg-white overflow-hidden cursor-zoom-in"
        >
          {images.map((img, idx) => (
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
          ))}
        </button>
      </div>

      {/* Mobile layout: free-scroll carousel with peek (Embla) */}
      <div className="relative sm:hidden">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex gap-0.5">
            {images.map((img, idx) => (
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
            ))}
          </div>
        </div>
        {/* Botón de lupa (zoom) */}
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label="Ampliar imagen"
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-[#1c1c1c] active:scale-95 transition-transform"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
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
              <Image
                src={images[selectedIdx]}
                alt={`${name} ${selectedIdx + 1}`}
                fill
                className="object-contain"
                sizes="90vw"
                priority
              />
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
