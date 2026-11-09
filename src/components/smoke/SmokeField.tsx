"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import type { SmokeVariant } from "./smoke-gl";

interface Props {
  variant?: SmokeVariant;
  intensity?: number;
  interactive?: boolean;
  className?: string;
  /** start fully smoked over and clear when the intro finishes */
  continueIntro?: boolean;
  style?: CSSProperties;
}

/**
 * Atmospheric smoke behind a section. Loads its WebGL module lazily, renders only while
 * visible, follows the cursor (desktop) and degrades to the CSS gradient underneath when
 * WebGL is unavailable or the visitor prefers reduced motion (a single still frame).
 */
export function SmokeField({ variant = "deep", intensity = 1, interactive = true, className = "", continueIntro = false, style }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let disposed = false;
    let cleanup = () => {};

    import("./smoke-gl")
      .then(({ SmokeGL }) => {
        if (disposed) return;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const intro = continueIntro && document.documentElement.dataset.intro === "play";
        let smoke: InstanceType<typeof SmokeGL>;
        try {
          smoke = new SmokeGL(canvas, { variant, intensity, interactive: interactive && !reduce, cover: intro ? 1 : 0 });
        } catch {
          return; // CSS fallback stays visible
        }
        canvas.style.opacity = "1";
        if (reduce) smoke.freeze();

        let visible = false;
        const sync = () => {
          if (visible && !document.hidden && !reduce) smoke.play();
          else smoke.stop();
          if (reduce) smoke.draw();
        };
        const io = new IntersectionObserver(([e]) => {
          visible = e.isIntersecting;
          sync();
        });
        io.observe(canvas);
        const ro = new ResizeObserver(() => {
          smoke.resize();
          if (reduce) smoke.draw();
        });
        ro.observe(canvas);
        const onMove = (e: PointerEvent) => smoke.pointer(e.clientX, e.clientY);
        const host = canvas.parentElement;
        host?.addEventListener("pointermove", onMove, { passive: true });
        document.addEventListener("visibilitychange", sync);
        const onIntroDone = () => smoke.reveal(1300);
        window.addEventListener("smx:intro-complete", onIntroDone);
        smoke.draw();

        cleanup = () => {
          io.disconnect();
          ro.disconnect();
          host?.removeEventListener("pointermove", onMove);
          document.removeEventListener("visibilitychange", sync);
          window.removeEventListener("smx:intro-complete", onIntroDone);
          smoke.dispose();
        };
      })
      .catch(() => {
        /* keep the CSS fallback */
      });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [variant, intensity, interactive, continueIntro]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      style={style}
      className={`pointer-events-none absolute inset-0 h-full w-full opacity-0 transition-opacity duration-1000 ${className}`}
    />
  );
}
