"use client";

import { useState } from "react";
import Image from "next/image";

interface ImageGalleryProps {
  images: string[];
  name: string;
}

export function ImageGallery({ images, name }: ImageGalleryProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-[#f8f7f4] flex items-center justify-center">
        <svg width="64" height="64" viewBox="0 0 48 48" fill="none" className="text-[#111111]/15">
          <path d="M6 24C6 24 10 16 24 16C38 16 42 24 42 24C42 24 38 32 24 32C10 32 6 24 6 24Z" stroke="currentColor" strokeWidth="1" fill="none"/>
          <circle cx="24" cy="24" r="4" stroke="currentColor" strokeWidth="1" fill="none"/>
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-square bg-[#f8f7f4] overflow-hidden">
        <Image
          src={images[selectedIdx]}
          alt={name}
          fill
          className="object-contain transition-opacity duration-300"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIdx(idx)}
              className={`relative w-16 h-16 flex-shrink-0 overflow-hidden transition-all duration-200 ${
                idx === selectedIdx
                  ? "ring-1 ring-[#d4af37] ring-offset-1 opacity-100"
                  : "opacity-50 hover:opacity-80"
              }`}
            >
              <Image
                src={img}
                alt={`${name} ${idx + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
