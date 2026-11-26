"use client";

import { useEffect, useLayoutEffect, useState } from "react";

const GLYPHS = "@#%*=+-|/;:.,'`08";

// Avoids the SSR warning on older React versions.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

type Props = { text: string; duration?: number; className?: string };

/**
 * Resolves text from random ASCII glyphs, left to right, once on load.
 * Uses the same characters as the butterflies so the two feel related.
 * Skipped when the visitor prefers reduced motion.
 */
export default function ScrambleText({ text, duration = 1200, className }: Props) {
  const [display, setDisplay] = useState(text);

  useIsoLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const start = performance.now();
    let last = 0;
    let frame = 0;

    const render = (progress: number) => {
      const resolved = Math.floor(progress * text.length);
      setDisplay(
        text
          .split("")
          .map((ch, i) =>
            ch === " " || i < resolved
              ? ch
              : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
          )
          .join(""),
      );
    };

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      if (progress >= 1) {
        setDisplay(text);
        return;
      }
      if (now - last > 45) {
        last = now;
        render(progress);
      }
      frame = requestAnimationFrame(tick);
    };

    render(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [text, duration]);

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>{display}</span>
    </span>
  );
}