"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

export default function TopMainVisualSlideshow() {
  const images = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => `/top-slideshow/slide-${i + 1}.png`),
    []
  );

  const reducedMotionRef = useRef(false);
  const [index, setIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = !!mq?.matches;
    if (reducedMotionRef.current) return;

    let rafId: number | null = null;
    const intervalId = window.setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % images.length;
        setPrevIndex(prev);

        // 1フレーム置いてからフェード開始（prev が一瞬表示されるようにする）
        rafId = window.requestAnimationFrame(() => setIsFading(true));
        return next;
      });
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [images.length]);

  useEffect(() => {
    if (!isFading) return;
    const t = window.setTimeout(() => {
      setPrevIndex(null);
      setIsFading(false);
    }, 1000);
    return () => window.clearTimeout(t);
  }, [isFading]);

  return (
    <div className="absolute inset-0 z-0">
      {prevIndex !== null && (
        <Image
          key={`prev-${prevIndex}`}
          src={images[prevIndex]}
          alt=""
          fill
          priority={false}
          className={`object-cover transition-opacity duration-1000 ${
            isFading ? "opacity-0" : "opacity-100"
          }`}
          sizes="100vw"
        />
      )}
      <Image
        key={`cur-${index}`}
        src={images[index]}
        alt=""
        fill
        priority
        className="object-cover object-[68%_center]"
        sizes="100vw"
      />
    </div>
  );
}

