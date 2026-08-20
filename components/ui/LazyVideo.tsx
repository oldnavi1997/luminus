"use client";

import { useEffect, useRef, type CSSProperties, type RefObject } from "react";

/** Below this width a phone gets the narrower rendition, not the desktop one. */
export const MOBILE_VIDEO_QUERY = "(max-width: 767px)";

/**
 * Which rendition this viewport should download. Exported because a parent that
 * seeks the video (see /transitions) can assign `src` before the observer does,
 * and both paths have to agree on the URL or the file is fetched twice.
 */
export function pickVideoSrc(src: string, srcMobile?: string) {
  if (!srcMobile || typeof window === "undefined") return src;
  return window.matchMedia(MOBILE_VIDEO_QUERY).matches ? srcMobile : src;
}

interface LazyVideoProps {
  src: string;
  /** Narrower rendition for phones. Falls back to `src` when omitted. */
  srcMobile?: string;
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
  srcMobile,
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
        if (!vid.src) vid.src = pickVideoSrc(src, srcMobile);
        void vid.play().catch(() => {});
        io.disconnect();
      },
      { rootMargin }
    );

    io.observe(vid);
    return () => io.disconnect();
  }, [ref, src, srcMobile, rootMargin]);

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
