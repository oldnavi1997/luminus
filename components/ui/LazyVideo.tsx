"use client";

import { useEffect, useRef, type CSSProperties, type RefObject } from "react";

interface LazyVideoProps {
  src: string;
  poster: string;
  className?: string;
  style?: CSSProperties;
  /** Share the element with a parent that needs to seek or play it. */
  videoRef?: RefObject<HTMLVideoElement | null>;
  /** How far outside the viewport to start loading. */
  rootMargin?: string;
}

/**
 * Background video that fetches nothing until it scrolls near the viewport.
 *
 * `preload="none"` plus an imperative `src` assignment is what keeps the bytes
 * off the wire: `preload="metadata"` still costs a request on every page load,
 * and a `src` in JSX is fetched regardless of CSS visibility (`display: none`
 * does not stop a video from preloading).
 */
export function LazyVideo({
  src,
  poster,
  className,
  style,
  videoRef,
  rootMargin = "200px",
}: LazyVideoProps) {
  const localRef = useRef<HTMLVideoElement>(null);
  const ref = videoRef ?? localRef;

  useEffect(() => {
    const vid = ref.current;
    if (!vid) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        // Keep the src once assigned so scrolling away and back does not re-download.
        if (!vid.src) vid.src = src;
        void vid.play().catch(() => {});
        io.disconnect();
      },
      { rootMargin }
    );

    io.observe(vid);
    return () => io.disconnect();
  }, [ref, src, rootMargin]);

  return (
    <video
      ref={ref}
      autoPlay
      muted
      loop
      playsInline
      preload="none"
      poster={poster}
      className={className}
      style={style}
    />
  );
}
