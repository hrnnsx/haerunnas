"use client";

import { useEffect, useRef } from "react";

type Props = {
  theme?: "light" | "dark";
  hue?: number;              // degrees: 0 blue, 45 violet, 100 rose, 175 amber, -95 green, -40 teal
  renderer?: "webgl" | "three";
  opacity?: number;          // 0..1, CSS opacity on the whole canvas
  className?: string;
  white?: number;            // 0..1, how white the butterflies are
  butterflyOpacity?: number; // 0..1, butterflies only
  intro?: number;            // seconds to ramp up from nothing (0 = start full)
  density?: number;
};

export default function Butterflies({
  theme = "light",
  hue = 0,
  renderer = "three",
  opacity = 1,
  className,
  white = 0,
  butterflyOpacity = 1,
  intro = 5,
  density = 0.4,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<any>(null);

  // Create the engine once on the client
  useEffect(() => {
    let cancelled = false;
    let engine: any;

    (async () => {
      const [{ ButterflyEngine }, mod] = await Promise.all([
        import("@/lib/butterflies/engine.js"),
        renderer === "three"
          ? import("@/lib/butterflies/renderer-three.js")
          : import("@/lib/butterflies/renderer-webgl.js"),
      ]);
      if (cancelled || !canvasRef.current) return;

      const RendererClass =
        "ThreeRenderer" in mod ? (mod as any).ThreeRenderer : (mod as any).WebGLRenderer;

      // Skip the intro for people who prefer reduced motion
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      engine = new (ButterflyEngine as any)(canvasRef.current, {
        theme,
        RendererClass,
        tuning: {
          hue,
          white,
          opacity: butterflyOpacity,
          intro: reduced ? 0 : intro,
          density,
          grid: .5,
          trailFade: .6,
          trail: .4,
        },
      });
      engineRef.current = engine;
    })();

    return () => {
      cancelled = true;
      engine?.destroy();
      engine?.renderer?.three?.dispose?.(); // Three.js only
      engineRef.current = null;
    };
    // Recreate only when the renderer type changes; other props are handled below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderer]);

  useEffect(() => { engineRef.current?.setTheme(theme); }, [theme]);
  useEffect(() => { engineRef.current?.set("hue", hue); }, [hue]);
  useEffect(() => { engineRef.current?.set("white", white); }, [white]);
  useEffect(() => { engineRef.current?.set("opacity", butterflyOpacity); }, [butterflyOpacity]);
  useEffect(() => { engineRef.current?.set("density", density); }, [density]);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      // ignore clicks on links, buttons, etc.
      if (target?.closest?.("a, button, input, textarea, select, label, [data-no-scatter]")) return;

      const engine = engineRef.current;
      if (!engine || engine.reducedMotion.matches) return;

      const rect = engine.canvas.getBoundingClientRect();
      engine.world.startle(e.clientX - rect.left, e.clientY - rect.top);
    };

    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        opacity,
        transition: "opacity 0.6s ease",
        touchAction: "none",
        fontFamily: 'var(--font-geist-mono), "Geist Mono", ui-monospace, Menlo, monospace',
      }}
    />
  );
}