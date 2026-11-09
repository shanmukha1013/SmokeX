"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { GLYPHS, glyphToSvgPath, wordmarkLayout } from "@/lib/wordmark";
import { CUES, IMPACT_TIME } from "./engine/cues";
import type { IntroAudio } from "./engine/audio";
import type { IntroFrame } from "./engine/IntroEngine";

/**
 * SVG version of the title sequence for devices without WebGL2.
 * Same cue sheet, same letter order, same two-blade X — rendered with vector
 * shapes, CSS blur "smoke" and GSAP instead of shaders.
 */
export function FallbackIntro({
  audio,
  getFrame,
  onTagline,
  onTransition,
  onComplete,
}: {
  audio: IntroAudio | null;
  getFrame: () => IntroFrame;
  onTagline: () => void;
  onTransition: () => void;
  onComplete: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [frame] = useState(getFrame);
  const layout = wordmarkLayout(frame.stacked);
  const pad = 40;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const q = (s: string) => el.querySelector(s);
    const c = CUES;
    audio?.playScore();
    const tl = gsap.timeline({ onComplete });
    tl.fromTo(q("[data-fog]"), { opacity: 0 }, { opacity: 1, duration: 2.5 }, 0)
      .fromTo(q('[data-g="S"]'), { opacity: 0, scale: 1.5, filter: "blur(20px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1, ease: "expo.out" }, c.S)
      .fromTo(q('[data-g="M"]'), { opacity: 0, x: 220 }, { opacity: 1, x: 0, duration: 0.55, ease: "power4.out" }, c.M)
      .fromTo(q('[data-g="O"]'), { opacity: 0, scale: 0.2, rotate: 180 }, { opacity: 1, scale: 1, rotate: 0, duration: 1.1, ease: "expo.out" }, c.O)
      .fromTo(q("[data-ring]"), { opacity: 1, scale: 0.1 }, { opacity: 0, scale: 1.4, duration: 1.1, ease: "expo.out" }, c.O)
      .fromTo(q('[data-g="K"]'), { opacity: 0, x: 160, y: -160 }, { opacity: 1, x: 0, y: 0, duration: 0.5, ease: "power4.out" }, c.K)
      .fromTo(q('[data-g="E"]'), { opacity: 0, filter: "blur(16px)" }, { opacity: 1, filter: "blur(0px)", duration: 1.3 }, c.E)
      .to(q("[data-fog]"), { opacity: 0.45, duration: 0.3 }, c.quiet)
      .fromTo(q("[data-slash1]"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: c.slashDur, ease: "none" }, c.slash1)
      .fromTo(q('[data-g="X1"]'), { opacity: 0 }, { opacity: 1, duration: 0.2 }, c.slash1 + c.slashDur * 0.5)
      .to(q("[data-slash1]"), { opacity: 0, duration: 0.6 }, c.slash1 + c.slashDur)
      .fromTo(q("[data-slash2]"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: c.slashDur, ease: "none" }, c.slash2)
      .fromTo(q('[data-g="X2"]'), { opacity: 0 }, { opacity: 1, duration: 0.2 }, IMPACT_TIME - 0.05)
      .to(q("[data-slash2]"), { opacity: 0, duration: 0.6 }, c.slash2 + c.slashDur)
      .fromTo(q("[data-flash]"), { opacity: 0.85 }, { opacity: 0, duration: 0.9 }, IMPACT_TIME)
      .fromTo(q("[data-mark]"), { x: -6 }, { x: 0, duration: 0.6, ease: "elastic.out(1, 0.3)" }, IMPACT_TIME)
      .to(q("[data-fog]"), { opacity: 1, duration: 0.6 }, IMPACT_TIME)
      .call(onTagline, [], c.tagline)
      .call(onTransition, [], c.transition)
      .to(q("[data-cover]"), { opacity: 1, duration: c.clear - c.transition, ease: "power2.in" }, c.transition)
      .to(el, { opacity: 0, duration: c.end - c.clear, ease: "power1.inOut" }, c.clear);
    return () => {
      tl.kill();
    };
  }, [audio, onComplete, onTagline, onTransition]);

  const vbW = layout.width + pad * 2;
  const vbH = layout.height + pad * 2;
  const x1 = layout.glyphs.find((g) => g.id === "X1")!;
  const xs = x1.scale;
  const cx = pad + x1.x + (GLYPHS.X1.width * xs) / 2;
  const cy = pad + x1.y + 50 * xs;
  const len = 900;
  const d1 = [70, 100].map((v) => v / Math.hypot(70, 100));
  const d2 = [-70, 100].map((v) => v / Math.hypot(70, 100));
  const scale = frame.width / layout.width;

  return (
    <div ref={root} className="absolute inset-0 overflow-hidden bg-emerald-990">
      <div
        data-fog
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 30% 40%, rgba(0,97,76,.55), transparent 70%), radial-gradient(50% 60% at 75% 60%, rgba(1,74,58,.6), transparent 70%), radial-gradient(40% 40% at 50% 10%, rgba(92,201,167,.18), transparent 70%)",
          filter: "blur(30px)",
          animation: "drift 9s ease-in-out infinite",
        }}
      />
      <svg
        data-mark
        aria-hidden
        viewBox={`0 0 ${vbW} ${vbH}`}
        className="absolute overflow-visible"
        style={{ width: vbW * scale, left: frame.cx - (vbW * scale) / 2, top: frame.cy - (vbH * scale) / 2 }}
      >
        <defs>
          <linearGradient id="fb-metal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FBF9F3" />
            <stop offset=".45" stopColor="#DAD2BD" />
            <stop offset=".55" stopColor="#9FE0CA" />
            <stop offset="1" stopColor="#E9E3D3" />
          </linearGradient>
          <filter id="fb-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {layout.glyphs.map((g) => (
          <g key={g.id} transform={`translate(${pad + g.x} ${pad + g.y}) scale(${g.scale})`}>
            <path
              data-g={g.id}
              d={glyphToSvgPath(g.id)}
              fill="url(#fb-metal)"
              fillRule="evenodd"
              style={{ transformBox: "fill-box", transformOrigin: "center", opacity: 0 }}
            />
          </g>
        ))}
        <circle data-ring cx={pad + layout.glyphs[2].x + 48} cy={pad + 50} r="80" fill="none" stroke="#5CC9A7" strokeWidth="3" filter="url(#fb-glow)" style={{ transformBox: "fill-box", transformOrigin: "center", opacity: 0 }} />
        <line data-slash1 x1={cx - d1[0] * len} y1={cy - d1[1] * len} x2={cx + d1[0] * len} y2={cy + d1[1] * len} stroke="#E8F7F1" strokeWidth="3" pathLength={1} strokeDasharray="1" filter="url(#fb-glow)" />
        <line data-slash2 x1={cx - d2[0] * len} y1={cy - d2[1] * len} x2={cx + d2[0] * len} y2={cy + d2[1] * len} stroke="#E8F7F1" strokeWidth="3" pathLength={1} strokeDasharray="1" filter="url(#fb-glow)" />
      </svg>
      <div data-flash aria-hidden className="absolute inset-0 bg-emerald-100 opacity-0 mix-blend-screen" />
      <div data-cover aria-hidden className="absolute inset-0 bg-emerald-900 opacity-0" />
    </div>
  );
}
