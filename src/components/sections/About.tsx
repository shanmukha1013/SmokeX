import { DisplayHeading, SectionLabel } from "@/components/ui/primitives";
import { site } from "@/lib/site";
import { products } from "@/data/products";

const roles = ["Software Developer", "AI & Machine Learning Enthusiast", "Full-Stack Developer", "Product Builder", "Technology Creator"];

export function About() {
  const live = products.filter((p) => p.status === "Live").length;
  const principles = [
    {
      k: "Ship real things",
      v: `An idea only counts once someone can open it. That's why ${live} products here are live — each on its own deployment, open to anyone today.`,
    },
    {
      k: "Own the whole stack",
      v: "Database, API, interface, deployment. Understanding every layer is how I make sure the parts actually fit together.",
    },
    {
      k: "Learn by building",
      v: "Every project teaches me something new — and the journal is where I write down what it was.",
    },
  ];
  return (
    <section id="about" aria-labelledby="about-title" className="vp relative overflow-hidden bg-ivory-50 py-24 sm:py-28">
      {/* minimal atmosphere: a single soft emerald haze */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-10 h-[36rem] w-[36rem] rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(159,224,202,.55), transparent 65%)" }}
      />
      <div className="shell relative">
        <SectionLabel index="03">About</SectionLabel>
        <div className="mt-8 grid gap-12 lg:mt-[clamp(1.25rem,3.5vh,2.5rem)] lg:grid-cols-12 lg:items-center lg:gap-14">
          <div className="lg:col-span-5">
            <div data-reveal>
              <p
                aria-hidden
                className="select-none font-display text-[clamp(6.5rem,24vw,9rem)] font-bold leading-[0.8] tracking-[-0.06em] text-transparent lg:text-[clamp(7rem,min(10.5vw,20vh),12rem)]"
                style={{ WebkitTextStroke: "1.5px var(--color-emerald-500)" }}
              >
                MSR
              </p>
              <p className="mt-5 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-emerald-700">Marella · Shanmukha · Reddy</p>
            </div>
            <ul className="mt-8 flex flex-wrap gap-2 lg:mt-[clamp(1.25rem,3.5vh,2.5rem)]" aria-label="Roles">
              {roles.map((r, i) => (
                <li
                  key={r}
                  data-reveal
                  style={{ ["--reveal-delay" as string]: `${i * 60}ms` }}
                  className="rounded-full border border-emerald-990/15 px-4 py-2 text-sm text-emerald-950"
                >
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-7">
            <DisplayHeading
              as="h2"
              lines={[<span key="a" id="about-title">I enjoy turning ideas</span>, "into working products."]}
              className="font-display text-[2.1rem] font-semibold leading-[1.04] tracking-[-0.03em] text-emerald-990 sm:text-5xl lg:text-[clamp(2.5rem,min(4.2vw,6.8vh),3.75rem)]"
            />
            <div className="mt-8 max-w-2xl space-y-4 text-lg leading-relaxed text-emerald-950/80 lg:mt-[clamp(1.25rem,3.2vh,2.25rem)] lg:text-[clamp(1rem,2.05vh,1.125rem)]" data-reveal>
              <p>
                I&rsquo;m {site.owner.name} — <span className="font-medium text-emerald-700">{site.owner.short}</span>. I like experimenting with
                technology, building applications, solving engineering problems and learning how systems work underneath.
              </p>
              <p className="border-l-2 border-emerald-500/40 pl-5 font-serif text-2xl italic leading-snug text-emerald-800 lg:text-[clamp(1.3rem,2.7vh,1.6rem)]">
                &ldquo;I believe the best way to learn is by building. Every project teaches me something new and helps me become a better engineer.&rdquo;
              </p>
              <p>
                SMOKE X is where that habit lives: a debate platform, two marketplaces and an AI tool — each one a real product, and each one a
                lesson I carried into the next.
              </p>
            </div>
          </div>
        </div>
        <dl className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-emerald-990/10 sm:grid-cols-3 lg:mt-[clamp(1.75rem,5vh,3.5rem)]">
          {principles.map((p, i) => (
            <div key={p.k} className="bg-ivory-50 p-6 lg:px-7 lg:py-[clamp(1rem,2.6vh,1.6rem)]" data-reveal style={{ ["--reveal-delay" as string]: `${i * 90}ms` }}>
              <dt className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-emerald-700">
                0{i + 1} · {p.k}
              </dt>
              <dd className="mt-2.5 text-[0.95rem] leading-relaxed text-emerald-950/75">{p.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
