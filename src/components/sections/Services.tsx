import Link from "next/link";
import { services } from "@/data/engineering";
import { products } from "@/data/products";
import { Arrow, ButtonLink, DisplayHeading, SectionLabel } from "@/components/ui/primitives";

const steps = [
  { t: "Understand", d: "We talk through the problem, the people it's for and what “done” looks like." },
  { t: "Shape", d: "A clear scope, a technical plan and a realistic timeline — before any code." },
  { t: "Build", d: "Working software early and often, so you see progress instead of waiting for it." },
  { t: "Ship", d: "Deployment, handover and documentation, so the product keeps running after launch." },
];

export function Services() {
  const productSlug = Object.fromEntries(products.map((p) => [p.name, p.slug]));
  return (
    <section id="services" aria-labelledby="svc-title" className="vp relative bg-ivory-100 py-24 sm:py-28">
      <div className="shell">
        <SectionLabel index="06">Work with SMOKE X</SectionLabel>
        <div className="mt-8 grid gap-8 lg:mt-[clamp(1rem,2.6vh,1.75rem)] lg:grid-cols-12 lg:items-end lg:gap-10">
          <DisplayHeading
            lines={[<span key="a" id="svc-title">Have an idea?</span>, "Let’s build the product."]}
            className="font-display text-[2.2rem] font-semibold leading-[1.02] tracking-[-0.035em] text-emerald-990 xs:text-5xl sm:text-6xl lg:col-span-8 lg:text-[clamp(2.75rem,min(5vw,7.6vh),4.5rem)]"
          />
          <div className="lg:col-span-4" data-reveal>
            <p className="text-lg leading-relaxed text-emerald-950/80 lg:text-[clamp(1rem,2.1vh,1.125rem)]">
              Freelance development for founders, teams and individuals — from a first MVP to AI features inside an existing product.
            </p>
            <ButtonLink href="/#contact" tone="vermilion" className="mt-5">
              Start a project <Arrow />
            </ButtonLink>
          </div>
        </div>

        <ol className="mt-12 grid gap-px overflow-hidden rounded-3xl lg:mt-[clamp(1.5rem,4.5vh,3rem)] bg-emerald-990/10 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s, i) => (
            <li key={s.title} className="group relative bg-ivory-100 p-6 transition-colors lg:px-6 lg:py-[clamp(1rem,2.5vh,1.6rem)] duration-500 hover:bg-emerald-990" data-reveal style={{ ["--reveal-delay" as string]: `${(i % 4) * 60}ms` }}>
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-emerald-600 transition-colors group-hover:text-emerald-300">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-4 font-display text-lg lg:mt-[clamp(0.6rem,1.6vh,1rem)] font-semibold leading-snug text-emerald-990 transition-colors group-hover:text-ivory-50">{s.title}</h3>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-emerald-950/70 transition-colors group-hover:text-ivory-300">{s.body}</p>
              {s.proof.length > 0 && (
                <p className="mt-3.5 flex flex-wrap gap-1.5">
                  {s.proof.map((pr) =>
                    productSlug[pr] ? (
                      <Link
                        key={pr}
                        href={`/ecosystem/${productSlug[pr]}`}
                        className="relative z-10 rounded-full border border-emerald-990/15 px-2.5 py-0.5 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-emerald-800 transition-colors group-hover:border-ivory-100/20 group-hover:text-emerald-200"
                      >
                        {pr}
                      </Link>
                    ) : (
                      <span
                        key={pr}
                        className="rounded-full border border-emerald-990/15 px-2.5 py-0.5 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-emerald-800 transition-colors group-hover:border-ivory-100/20 group-hover:text-emerald-200"
                      >
                        {pr}
                      </span>
                    ),
                  )}
                </p>
              )}
            </li>
          ))}
        </ol>

        <div className="mt-14 grid gap-8 lg:mt-[clamp(1.5rem,4.5vh,3rem)] lg:grid-cols-12 lg:gap-10">
          <h3 className="eyebrow text-emerald-700 lg:col-span-3" data-reveal>
            How a project runs
          </h3>
          <ol className="grid gap-8 sm:grid-cols-2 lg:col-span-9 lg:grid-cols-4 lg:gap-7">
            {steps.map((s, i) => (
              <li key={s.t} data-reveal style={{ ["--reveal-delay" as string]: `${i * 80}ms` }}>
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-600/40 font-mono text-xs text-emerald-700">{i + 1}</span>
                  <span aria-hidden className="h-px flex-1 bg-emerald-990/10" />
                </div>
                <p className="mt-3 font-display font-semibold text-emerald-990">{s.t}</p>
                <p className="mt-1.5 text-[0.92rem] leading-relaxed text-emerald-950/70">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
