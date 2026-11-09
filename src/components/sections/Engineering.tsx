"use client";

import { useMemo, useState } from "react";
import { techGroups, experience } from "@/data/engineering";
import { DisplayHeading, SectionLabel } from "@/components/ui/primitives";

/**
 * Technologies grouped by discipline. Hover or focus a technology to see where it is
 * actually used. Only technologies with documented use are shown.
 */
export function Engineering() {
  const groups = useMemo(() => techGroups.map((g) => ({ ...g, items: g.items.filter((t) => t.usedIn.length > 0) })), []);
  const [sel, setSel] = useState<{ name: string; usedIn: string[] } | null>(null);

  return (
    <section id="engineering" aria-labelledby="eng-title" className="grain relative overflow-hidden bg-emerald-990 text-ivory-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(50% 40% at 85% 0%, rgba(0,148,115,.25), transparent 70%), radial-gradient(40% 50% at 0% 100%, rgba(1,74,58,.5), transparent 70%)",
        }}
      />
      {/* the stack — one screen */}
      <div className="vp shell relative pb-16 pt-24 sm:pt-28">
        <SectionLabel index="04" light>
          Engineering
        </SectionLabel>
        <div className="mt-7 grid gap-6 lg:mt-[clamp(1rem,2.6vh,1.75rem)] lg:grid-cols-12 lg:items-end lg:gap-10">
          <DisplayHeading
            lines={[<span key="a" id="eng-title">The stack behind</span>, "the products."]}
            className="font-display text-[2.3rem] font-semibold leading-[1.02] tracking-[-0.035em] xs:text-5xl sm:text-6xl lg:col-span-7 lg:text-[clamp(2.6rem,min(4.6vw,7vh),4.5rem)]"
          />
          <p className="max-w-md text-lg leading-relaxed text-ivory-300 lg:col-span-5 lg:justify-self-end lg:text-[clamp(1rem,2.1vh,1.125rem)]" data-reveal>
            Organised by discipline, not by logo count. Select any technology to see the work it was used in.
          </p>
        </div>

        <div className="mt-10 grid gap-px overflow-hidden rounded-3xl bg-ivory-100/10 md:grid-cols-2 lg:mt-[clamp(1.5rem,4vh,2.75rem)] xl:grid-cols-5">
          {groups.map((g, gi) => (
            <div
              key={g.id}
              className="bg-emerald-990 p-6 sm:p-7 lg:px-6 lg:py-[clamp(1.1rem,2.6vh,1.75rem)]"
              data-reveal
              style={{ ["--reveal-delay" as string]: `${gi * 70}ms` }}
            >
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-emerald-300">0{gi + 1}</p>
              <h3 className="mt-2 font-display text-xl font-semibold">{g.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ivory-300/70 lg:text-[0.82rem] [@media(max-height:740px)]:hidden">{g.blurb}</p>
              <ul className="mt-4 space-y-0.5 lg:mt-[clamp(0.75rem,2vh,1.25rem)]">
                {g.items.map((t) => {
                  const on = sel?.name === t.name;
                  return (
                    <li key={t.name}>
                      <button
                        type="button"
                        onMouseEnter={() => setSel(t)}
                        onFocus={() => setSel(t)}
                        onClick={() => setSel(on ? null : t)}
                        aria-pressed={on}
                        className={`group flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[0.95rem] transition-colors lg:py-[clamp(0.2rem,0.55vh,0.375rem)] lg:text-[0.92rem] ${
                          on ? "bg-emerald-800/60 text-ivory-50" : "text-ivory-200 hover:bg-emerald-900/60"
                        }`}
                      >
                        {t.name}
                        <span className="font-mono text-[0.65rem] text-emerald-300/70">{t.usedIn.length}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-3 flex min-h-[3.75rem] items-center rounded-2xl border border-ivory-100/10 px-6 py-3.5" aria-live="polite">
          {sel ? (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-ivory-200">
              <span className="font-display font-semibold text-ivory-50">{sel.name}</span>
              <span className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-emerald-300">used in</span>
              {sel.usedIn.map((u) => (
                <span key={u} className="rounded-full bg-emerald-800/70 px-3 py-1 text-sm">
                  {u}
                </span>
              ))}
            </p>
          ) : (
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-ivory-300/60">Select a technology to trace it through the work →</p>
          )}
        </div>
      </div>

      {/* Professional experience — one screen */}
      <div id="experience" className="shell relative scroll-mt-20 pb-24 pt-4 sm:pb-28 lg:pb-[clamp(4rem,10vh,7rem)]">
        <div className="grid gap-10 border-t border-ivory-100/10 pt-12 lg:grid-cols-12 lg:gap-12 lg:pt-[clamp(2rem,5vh,3.5rem)]">
          <div className="lg:col-span-4">
            <p className="eyebrow text-emerald-300" data-reveal>
              Professional experience
            </p>
            <h3 className="mt-5 font-display text-3xl font-semibold leading-tight tracking-[-0.02em] sm:text-4xl" data-reveal>
              {experience.company}
            </h3>
            <p className="mt-4 flex flex-wrap items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-ivory-300" data-reveal>
              <span className="rounded-full border border-ivory-100/20 px-3 py-1">{experience.product}</span>
              <span className="rounded-full border border-vermilion-500/60 px-3 py-1 text-vermilion-100">{experience.type}</span>
            </p>
            <p className="mt-7 text-lg leading-relaxed text-ivory-200/85 lg:text-[clamp(1rem,2.1vh,1.125rem)]" data-reveal>
              {experience.summary}
            </p>
          </div>
          <ul className="grid gap-px self-start overflow-hidden rounded-2xl bg-ivory-100/10 sm:grid-cols-2 lg:col-span-8">
            {experience.areas.map((a, i) => (
              <li key={a.title} className="bg-emerald-990 p-5 lg:py-[clamp(0.9rem,2.4vh,1.4rem)]" data-reveal style={{ ["--reveal-delay" as string]: `${i * 50}ms` }}>
                <p className="font-display font-medium text-ivory-50">{a.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ivory-300/75">{a.detail}</p>
              </li>
            ))}
            <li className="flex items-end bg-emerald-950 p-5 lg:py-[clamp(0.9rem,2.4vh,1.4rem)]" data-reveal style={{ ["--reveal-delay" as string]: `${experience.areas.length * 50}ms` }}>
              <p className="font-mono text-[0.66rem] uppercase leading-relaxed tracking-[0.16em] text-emerald-300/80">
                Internship work on WiseIN, a product of Sanshi Network Tech Pvt. Ltd.
              </p>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
