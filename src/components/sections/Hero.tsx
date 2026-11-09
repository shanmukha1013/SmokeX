"use client";

import { useEffect, useState } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { SmokeField } from "@/components/smoke/SmokeField";
import { ButtonLink, Arrow } from "@/components/ui/primitives";
import { INTRO_DONE_EVENT, introIsPlaying } from "@/components/intro/IntroController";
import { site } from "@/lib/site";
import { products } from "@/data/products";

/** shared by the hero and the intro overlay, so the tagline hands off pixel-for-pixel */
export const TAGLINE_CLASS =
  "text-center font-serif text-[1.35rem] font-light italic leading-snug tracking-[-0.01em] text-ivory-100 sm:text-3xl lg:text-[2.35rem]";

export function Hero() {
  const [entered, setEntered] = useState(false);
  const [sweep, setSweep] = useState(false);

  useEffect(() => {
    const go = () => {
      setEntered(true);
      window.setTimeout(() => setSweep(true), 300);
    };
    if (introIsPlaying()) {
      window.addEventListener(INTRO_DONE_EVENT, go, { once: true });
      return () => window.removeEventListener(INTRO_DONE_EVENT, go);
    }
    const id = window.setTimeout(go, 60);
    return () => window.clearTimeout(id);
  }, []);

  const live = products.filter((p) => p.status === "Live").length;
  const enter = (delay: number) => ({
    className: `transition-[opacity,transform,filter] duration-[1200ms] ease-[var(--ease-cine)] ${
      entered ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-5 blur-[6px]"
    }`,
    style: { transitionDelay: entered ? `${delay}ms` : "0ms" },
  });

  return (
    <section
      id="home"
      aria-labelledby="hero-title"
      className="grain relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-emerald-990 text-ivory-100"
      style={{
        backgroundImage:
          "radial-gradient(70% 55% at 50% 0%, rgba(0,97,76,.45), transparent 70%), radial-gradient(60% 50% at 15% 85%, rgba(1,74,58,.5), transparent 70%)",
      }}
    >
      <SmokeField variant="deep" intensity={1} interactive className="-z-10" />

      <div className="shell relative flex flex-1 flex-col items-center justify-center pb-28 pt-28 sm:pb-32">
        <p {...enter(0)} className={`eyebrow mb-8 text-emerald-300/90 sm:mb-10 ${enter(0).className}`}>
          A personal technology ecosystem
        </p>

        <h1 id="hero-title" className="sr-only">
          SMOKE X — Turning ideas into products. The technology ecosystem of {site.owner.name}.
        </h1>

        <Wordmark variant="metal" title={null} heroTarget className="hidden h-auto w-[min(78vw,64rem)] drop-shadow-[0_20px_50px_rgba(0,148,115,0.25)] sm:block" />
        <Wordmark variant="metal" title={null} heroTarget stacked className="block h-auto w-[78vw] drop-shadow-[0_20px_50px_rgba(0,148,115,0.25)] sm:hidden" />

        <p data-hero-tagline className={`mt-7 sm:mt-9 ${TAGLINE_CLASS}`}>
          <span className={`light-sweep ${sweep ? "is-on" : ""}`}>{site.tagline}</span>
        </p>

        <p
          {...enter(150)}
          className={`mt-8 max-w-xl text-center text-[0.98rem] leading-relaxed text-ivory-300 sm:text-lg ${enter(150).className}`}
        >
          I build digital products, intelligent systems and applications that transform ideas into real-world experiences.
        </p>

        <div {...enter(280)} className={`mt-10 flex flex-col items-center gap-3 sm:flex-row ${enter(280).className}`}>
          <ButtonLink href="/#ecosystem" tone="ghost-light">
            Explore the ecosystem <Arrow />
          </ButtonLink>
          <ButtonLink href="/#contact" tone="vermilion">
            Start a project <Arrow />
          </ButtonLink>
        </div>
      </div>

      <div
        {...enter(420)}
        className={`shell absolute inset-x-0 bottom-0 grid grid-cols-2 items-end gap-4 pb-6 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-ivory-300/70 sm:grid-cols-3 sm:pb-8 ${enter(420).className}`}
      >
        <p>
          <span className="text-ivory-100">{site.owner.short}</span> — {site.owner.name}
        </p>
        <a href="#manifesto" className="group hidden flex-col items-center gap-2 justify-self-center sm:flex" aria-label="Scroll to the next section">
          <span>Scroll</span>
          <span className="relative block h-10 w-px overflow-hidden bg-ivory-100/15">
            <span className="absolute inset-x-0 top-0 h-1/2 bg-emerald-300" style={{ animation: "scroll-cue 2.2s var(--ease-smoke) infinite" }} />
          </span>
        </a>
        <p className="justify-self-end text-right">
          <span className="text-emerald-300">{String(live).padStart(2, "0")}</span> live products
        </p>
      </div>
    </section>
  );
}
