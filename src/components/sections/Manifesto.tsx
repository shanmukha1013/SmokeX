"use client";

import { useEffect, useRef } from "react";
import { Logomark } from "@/components/brand/Wordmark";
import { SectionLabel } from "@/components/ui/primitives";

const STATEMENT =
  "Ideas have no boundaries. One idea can become a product. One product can become an ecosystem. One mind can create multiple possibilities.";

/** Words illuminate in emerald as you scroll through the statement. */
export function Manifesto() {
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const words = Array.from(el.querySelectorAll<HTMLSpanElement>("[data-w]"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      words.forEach((w) => (w.style.opacity = "1"));
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // fully lit by the time the statement's top reaches ~22% of the screen,
      // i.e. when the section is in view — no extra scrolling needed to read it
      const p = Math.min(1, Math.max(0, (vh * 0.92 - r.top) / (vh * 0.7)));
      const lit = p * words.length * 1.15;
      words.forEach((w, i) => {
        const k = Math.min(1, Math.max(0, lit - i));
        w.style.opacity = String(0.16 + 0.84 * k);
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section id="manifesto" aria-label="Philosophy" className="vp relative bg-ivory-100 py-24 sm:py-28">
      <div className="shell">
        <SectionLabel index="01">Philosophy</SectionLabel>
        <p
          ref={textRef}
          className="mt-8 max-w-[22ch] font-display text-[2.1rem] font-medium leading-[1.08] tracking-[-0.03em] text-emerald-990 xs:text-[2.5rem] sm:text-6xl lg:mt-[clamp(1.25rem,3.5vh,2.5rem)] lg:max-w-[25ch] lg:text-[clamp(3rem,min(4.6vw,7.4vh),5rem)]"
        >
          {STATEMENT.split(" ").map((w, i) => (
            <span key={i} data-w className="transition-opacity duration-300" style={{ opacity: 0.16 }}>
              {w}{" "}
            </span>
          ))}
        </p>

        <dl className="mt-16 grid gap-px overflow-hidden rounded-3xl bg-emerald-990/10 sm:mt-20 md:grid-cols-2 lg:mt-[clamp(1.75rem,5vh,4rem)]">
          <div className="bg-ivory-100 p-8 sm:p-10 lg:px-10 lg:py-[clamp(1.4rem,3.2vh,2.25rem)]" data-reveal>
            <dt className="flex items-baseline justify-between gap-4">
              <span className="font-display text-4xl font-bold tracking-[0.12em] text-emerald-600 sm:text-5xl lg:text-[clamp(2.25rem,5vh,3rem)]">SMOKE</span>
              <span className="font-mono text-xs text-emerald-990/50">/smōk/ · noun</span>
            </dt>
            <dd className="mt-5 font-serif text-2xl italic leading-snug text-emerald-950 sm:text-[1.6rem] lg:mt-[clamp(0.9rem,2.2vh,1.5rem)] lg:text-[clamp(1.3rem,2.7vh,1.65rem)]">
              Imagination, creativity, ideas and expansion.
            </dd>
            <dd className="mt-3 max-w-md leading-relaxed text-emerald-950/70">
              Smoke has no fixed shape. It moves, spreads and fills whatever space you give it — the way an idea behaves before it becomes something real.
            </dd>
          </div>
          <div className="bg-ivory-100 p-8 sm:p-10 lg:px-10 lg:py-[clamp(1.4rem,3.2vh,2.25rem)]" data-reveal style={{ ["--reveal-delay" as string]: "120ms" }}>
            <dt className="flex items-baseline justify-between gap-4">
              <Logomark className="h-10 w-auto text-emerald-600 sm:h-12 lg:h-[clamp(2.25rem,5vh,3rem)]" />
              <span className="font-mono text-xs text-emerald-990/50">/eks/ · variable</span>
            </dt>
            <dd className="mt-5 font-serif text-2xl italic leading-snug text-emerald-950 sm:text-[1.6rem] lg:mt-[clamp(0.9rem,2.2vh,1.5rem)] lg:text-[clamp(1.3rem,2.7vh,1.65rem)]">
              Exploration, experimentation, evolution and unlimited possibilities.
            </dd>
            <dd className="mt-3 max-w-md leading-relaxed text-emerald-950/70">
              The unknown variable — the part you only discover by building. In the mark, it is cut by two blades.
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
