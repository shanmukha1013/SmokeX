import Image from "next/image";
import Link from "next/link";
import { products, type Product } from "@/data/products";
import { Arrow, DisplayHeading, SectionLabel, StatusBadge } from "@/components/ui/primitives";
import { SmokeField } from "@/components/smoke/SmokeField";

export function BrowserFrame({ product, priority = false, sizes }: { product: Product; priority?: boolean; sizes: string }) {
  const host = new URL(product.liveUrl).host;
  return (
    <div className="overflow-hidden rounded-2xl border border-ivory-100/10 bg-emerald-990 shadow-[0_40px_80px_-30px_rgba(1,19,15,0.8)]">
      <div className="flex items-center gap-3 border-b border-ivory-100/10 px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2 w-2 rounded-full bg-vermilion-500/80" />
          <span className="h-2 w-2 rounded-full bg-ivory-300/50" />
          <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
        </span>
        <span className="truncate rounded-full bg-ivory-100/5 px-3 py-1 font-mono text-[0.65rem] text-ivory-300/80">{host}</span>
      </div>
      <div className="duotone relative aspect-[16/10] overflow-hidden">
        <Image src={product.screenshot.src} alt={product.screenshot.alt} fill sizes={sizes} priority={priority} className="object-cover object-top group-hover:scale-[1.015]" />
      </div>
    </div>
  );
}

/** Two tones alternate so each product reads as its own object, not a row in a list. */
const tones = {
  dark: {
    panel: "bg-emerald-950 text-ivory-100 ring-ivory-100/5",
    glow: (flip: boolean) =>
      `radial-gradient(60% 70% at ${flip ? "100%" : "0%"} 0%, rgba(0,148,115,.24), transparent 70%), radial-gradient(50% 50% at ${flip ? "0%" : "100%"} 100%, rgba(1,74,58,.6), transparent 70%)`,
    index: "text-emerald-300",
    tagline: "text-emerald-200",
    category: "text-ivory-300/60",
    body: "text-ivory-200/85",
    feature: "text-ivory-200/80",
    bullet: "bg-emerald-400",
    chip: "border-ivory-100/10 text-ivory-300",
    primary: "bg-ivory-100 text-emerald-990 hover:bg-ivory-50",
    secondary: "border-ivory-100/20 text-ivory-100 hover:border-emerald-300",
    caption: "text-ivory-300/50",
    light: true,
  },
  light: {
    panel: "bg-ivory-50 text-emerald-990 ring-emerald-990/10",
    glow: (flip: boolean) =>
      `radial-gradient(55% 65% at ${flip ? "100%" : "0%"} 0%, rgba(92,201,167,.22), transparent 70%), radial-gradient(45% 55% at ${flip ? "0%" : "100%"} 100%, rgba(159,224,202,.35), transparent 70%)`,
    index: "text-emerald-600",
    tagline: "text-emerald-700",
    category: "text-emerald-990/50",
    body: "text-emerald-950/80",
    feature: "text-emerald-950/75",
    bullet: "bg-emerald-500",
    chip: "border-emerald-990/15 text-emerald-900",
    primary: "bg-emerald-990 text-ivory-50 hover:bg-emerald-900",
    secondary: "border-emerald-990/20 text-emerald-990 hover:border-emerald-600",
    caption: "text-emerald-990/45",
    light: false,
  },
} as const;

function ProductPanel({ p, i }: { p: Product; i: number }) {
  const chips = p.stack.flatMap((s) => s.items).slice(0, 6);
  const flip = i % 2 === 1;
  const t = flip ? tones.light : tones.dark;
  return (
    <article
      id={`product-${p.slug}`}
      aria-labelledby={`p-${p.slug}-name`}
      className="group relative scroll-mt-24 lg:sticky"
      style={{ top: `calc(5.5rem + ${i * 14}px)` }}
    >
      <div
        className={`relative overflow-hidden rounded-[1.75rem] ring-1 lg:h-[calc(100svh-8.5rem)] lg:max-h-[50rem] lg:min-h-[32rem] ${t.panel}`}
        style={{ backgroundImage: t.glow(flip) }}
      >
        <div className="grid h-full gap-10 p-6 sm:p-10 lg:grid-cols-12 lg:items-center lg:gap-12 lg:px-12 lg:py-[clamp(1.75rem,4.5vh,3.25rem)]">
          <div className={`flex h-full flex-col lg:col-span-5 ${flip ? "lg:order-2" : ""}`}>
            <div className="flex items-center justify-between gap-4">
              <span className={`font-mono text-xs tracking-[0.2em] ${t.index}`}>
                {p.index} / {String(products.length).padStart(2, "0")}
              </span>
              <StatusBadge status={p.status} light={t.light} />
            </div>
            <h3
              id={`p-${p.slug}-name`}
              className="mt-7 font-display text-5xl font-semibold tracking-[-0.03em] sm:text-6xl lg:mt-[clamp(1rem,3vh,2rem)] lg:text-[clamp(2.75rem,6.4vh,3.9rem)]"
            >
              {p.name}
            </h3>
            <p className={`mt-2.5 font-serif text-xl italic sm:text-2xl lg:text-[clamp(1.2rem,2.6vh,1.5rem)] ${t.tagline}`}>{p.tagline}</p>
            <p className={`eyebrow mt-5 lg:mt-[clamp(0.75rem,2.2vh,1.4rem)] ${t.category}`}>{p.category}</p>
            <p className={`mt-3 text-[0.97rem] leading-relaxed ${t.body}`}>{p.summary}</p>
            <ul className={`mt-5 space-y-2 text-[0.93rem] lg:mt-[clamp(0.75rem,2vh,1.25rem)] [@media(max-height:760px)]:hidden ${t.feature}`}>
              {p.features.slice(0, 3).map((f) => (
                <li key={f} className="flex gap-3">
                  <span aria-hidden className={`mt-[0.7em] h-px w-3 shrink-0 ${t.bullet}`} />
                  {f}
                </li>
              ))}
            </ul>
            <ul className="mt-5 flex flex-wrap gap-1.5 lg:mt-[clamp(0.75rem,2vh,1.25rem)]" aria-label="Technology">
              {chips.map((c) => (
                <li key={c} className={`rounded-full border px-2.5 py-1 font-mono text-[0.65rem] ${t.chip}`}>
                  {c}
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap gap-3 lg:mt-auto lg:pt-6">
              <a
                href={p.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`btn-smoke inline-flex items-center gap-2.5 rounded-full px-5 py-3 font-mono text-[0.7rem] uppercase tracking-[0.18em] transition-colors ${t.primary}`}
              >
                Explore app <Arrow diagonal className="text-vermilion-500" />
                <span className="sr-only">(opens {p.name} in a new tab)</span>
              </a>
              <Link
                href={`/ecosystem/${p.slug}`}
                className={`inline-flex items-center gap-2.5 rounded-full border px-5 py-3 font-mono text-[0.7rem] uppercase tracking-[0.18em] transition-colors ${t.secondary}`}
              >
                Case file <Arrow />
              </Link>
            </div>
          </div>
          <div className={`lg:col-span-7 ${flip ? "lg:order-1" : ""}`}>
            <BrowserFrame product={p} sizes="(min-width: 1024px) 55vw, 92vw" />
            <p className={`mt-3 font-mono text-[0.65rem] uppercase tracking-[0.16em] ${t.caption}`}>
              {p.screenshot.caption} · real screenshot · hover for colour
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export function Ecosystem() {
  return (
    <section id="ecosystem" aria-labelledby="eco-title" className="relative bg-ivory-100 pb-24 sm:pb-32">
      <div className="relative overflow-hidden pb-12 pt-24 sm:pt-28 lg:pb-[clamp(2.5rem,6vh,4rem)] lg:pt-[clamp(6rem,13vh,8.5rem)]">
        <SmokeField variant="ivory" intensity={0.9} interactive />
        <div className="shell relative">
          <SectionLabel index="02">Ecosystem</SectionLabel>
          <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
            <DisplayHeading
              lines={[<span key="a" id="eco-title">One mind.</span>, "Multiple products."]}
              className="font-display text-[2.6rem] font-semibold leading-[0.98] tracking-[-0.04em] text-emerald-990 xs:text-5xl sm:text-7xl lg:col-span-7 lg:text-[clamp(3.5rem,min(6vw,9vh),5.6rem)]"
            />
            <div className="lg:col-span-5" data-reveal>
              <p className="text-lg leading-relaxed text-emerald-950/80">
                SMOKE X is the umbrella, not a wrapper. Each product stands on its own — its own deployment, its own sign-in, its own backend. Explore
                them here, then step into the real thing.
              </p>
            </div>
          </div>

          {/* editorial index: the whole ecosystem at a glance */}
          <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-emerald-990/10 sm:grid-cols-2 lg:mt-[clamp(2rem,5vh,3.5rem)] lg:grid-cols-4" aria-label="Products">
            {products.map((p, i) => (
              <li key={p.slug} className="bg-ivory-100/85 backdrop-blur-sm" data-reveal style={{ ["--reveal-delay" as string]: `${i * 70}ms` }}>
                <a href={`#product-${p.slug}`} className="group flex h-full flex-col gap-1.5 p-5 transition-colors duration-500 hover:bg-ivory-50 sm:p-6">
                  <span className="flex items-center justify-between font-mono text-[0.66rem] uppercase tracking-[0.18em] text-emerald-700">
                    {p.index}
                    <Arrow className="rotate-90 text-emerald-600 opacity-0 transition-[opacity,transform] duration-500 group-hover:translate-y-0.5 group-hover:opacity-100" />
                  </span>
                  <span className="mt-2 font-display text-2xl font-semibold tracking-[-0.02em] text-emerald-990 transition-colors group-hover:text-emerald-600">
                    {p.name}
                  </span>
                  <span className="text-sm text-emerald-950/65">{p.category}</span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="shell flex flex-col gap-6 lg:gap-10">
        {products.map((p, i) => (
          <ProductPanel key={p.slug} p={p} i={i} />
        ))}
      </div>
    </section>
  );
}
