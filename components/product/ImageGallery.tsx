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
      <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center text-6xl text-gray-300">
        👓
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden">
        <Image
          src={images[selectedIdx]}
          alt={name}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIdx(idx)}
              className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                idx === selectedIdx ? "border-[#c9a84c]" : "border-gray-200 hover:border-gray-400"
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
