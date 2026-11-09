import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, products } from "@/data/products";
import { Arrow, StatusBadge } from "@/components/ui/primitives";
import { BrowserFrame } from "@/components/sections/Ecosystem";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) return {};
  return {
    title: `${p.name} — ${p.category}`,
    description: p.summary,
    alternates: { canonical: `/ecosystem/${p.slug}` },
    openGraph: { title: `${p.name} · SMOKE X`, description: p.summary, images: [{ url: p.screenshot.src, width: 1440, height: 900, alt: p.screenshot.alt }] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) notFound();
  const idx = products.findIndex((x) => x.slug === p.slug);
  const next = products[(idx + 1) % products.length];

  const ld = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: p.name,
    description: p.summary,
    applicationCategory: "WebApplication",
    operatingSystem: "Web",
    url: p.liveUrl,
    author: { "@type": "Person", name: "Marella Shanmukha Reddy" },
  };

  return (
    <article className="bg-ivory-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <header
        className="grain relative overflow-hidden bg-emerald-990 pb-20 pt-36 text-ivory-100 sm:pb-28 sm:pt-44"
        style={{ backgroundImage: "radial-gradient(60% 60% at 80% 0%, rgba(0,148,115,.28), transparent 70%), radial-gradient(50% 50% at 0% 100%, rgba(1,74,58,.6), transparent 70%)" }}
      >
        <div className="shell relative">
          <nav aria-label="Breadcrumb" className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-ivory-300/70">
            <Link href="/#ecosystem" className="hover:text-ivory-50">
              Ecosystem
            </Link>
            <span className="mx-2 text-ivory-300/40">/</span>
            <span className="text-emerald-300">
              {p.index} · {p.name}
            </span>
          </nav>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <StatusBadge status={p.status} light />
            <span className="eyebrow text-ivory-300/70">{p.category}</span>
          </div>
          <h1 className="mt-6 font-display text-6xl font-semibold tracking-[-0.04em] sm:text-8xl lg:text-[8.5rem] lg:leading-[0.9]">{p.name}</h1>
          <p className="mt-6 max-w-3xl font-serif text-2xl italic text-emerald-200 sm:text-3xl">{p.tagline}</p>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ivory-200/85">{p.summary}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href={p.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-smoke btn-smoke--vermilion inline-flex items-center gap-2.5 rounded-full bg-vermilion-500 px-6 py-3.5 font-mono text-[0.74rem] uppercase tracking-[0.18em] text-ivory-50 hover:bg-vermilion-600"
            >
              Explore {p.name} <Arrow diagonal />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
            <a
              href={p.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-smoke inline-flex items-center gap-2.5 rounded-full border border-ivory-100/25 px-6 py-3.5 font-mono text-[0.74rem] uppercase tracking-[0.18em] text-ivory-100 hover:border-ivory-100/60"
            >
              Source on GitHub <Arrow diagonal />
            </a>
          </div>
          {p.statusNote && <p className="mt-5 text-sm text-ivory-300/70">{p.statusNote}</p>}
          <div className="group mt-16">
            <BrowserFrame product={p} priority sizes="(min-width: 1280px) 1200px, 94vw" />
            <p className="mt-3 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-ivory-300/50">{p.screenshot.caption} · real screenshot · hover for colour</p>
          </div>
        </div>
      </header>

      <div className="shell grid gap-16 py-24 sm:py-32 lg:grid-cols-12">
        <aside className="lg:col-span-4">
          <dl className="space-y-8 lg:sticky lg:top-28">
            <div>
              <dt className="eyebrow text-emerald-700">My role</dt>
              <dd className="mt-2 text-lg text-emerald-990">{p.role}</dd>
            </div>
            <div>
              <dt className="eyebrow text-emerald-700">Status</dt>
              <dd className="mt-2 text-lg text-emerald-990">{p.status} — independently deployed</dd>
            </div>
            <div>
              <dt className="eyebrow text-emerald-700">Live application</dt>
              <dd className="mt-2">
                <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="break-all text-emerald-700 underline decoration-emerald-300 underline-offset-4 hover:text-vermilion-600">
                  {new URL(p.liveUrl).host}
                </a>
              </dd>
            </div>
            <div>
              <dt className="eyebrow text-emerald-700">Repository</dt>
              <dd className="mt-2">
                <a href={p.repoUrl} target="_blank" rel="noopener noreferrer" className="break-all text-emerald-700 underline decoration-emerald-300 underline-offset-4 hover:text-vermilion-600">
                  {p.repoUrl.replace("https://", "")}
                </a>
              </dd>
            </div>
          </dl>
        </aside>
        <div className="space-y-20 lg:col-span-8">
          <section aria-labelledby="problem">
            <h2 id="problem" className="eyebrow text-emerald-700">
              01 · The problem
            </h2>
            <p className="mt-5 font-display text-2xl font-medium leading-snug tracking-[-0.02em] text-emerald-990 sm:text-3xl">{p.problem}</p>
          </section>
          <section aria-labelledby="approach">
            <h2 id="approach" className="eyebrow text-emerald-700">
              02 · The approach
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-emerald-950/80">{p.approach}</p>
          </section>
          <section aria-labelledby="features">
            <h2 id="features" className="eyebrow text-emerald-700">
              03 · Features
            </h2>
            <ul className="mt-6 grid gap-px overflow-hidden rounded-2xl bg-emerald-990/10 sm:grid-cols-2">
              {p.features.map((f, i) => (
                <li key={f} className="flex gap-4 bg-ivory-100 p-5">
                  <span className="font-mono text-xs text-emerald-600">{String(i + 1).padStart(2, "0")}</span>
                  <span className="leading-relaxed text-emerald-950">{f}</span>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="stack">
            <h2 id="stack" className="eyebrow text-emerald-700">
              04 · Technology
            </h2>
            <dl className="mt-6 space-y-5">
              {p.stack.map((s) => (
                <div key={s.layer} className="grid gap-3 border-b border-emerald-990/10 pb-5 sm:grid-cols-4">
                  <dt className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-emerald-990/60">{s.layer}</dt>
                  <dd className="flex flex-wrap gap-1.5 sm:col-span-3">
                    {s.items.map((it) => (
                      <span key={it} className="rounded-full bg-ivory-200 px-3 py-1 text-sm text-emerald-900">
                        {it}
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          <p className="text-sm leading-relaxed text-emerald-950/60">
            {p.name} runs independently of SMOKE X — its own deployment, authentication and backend. Details on this page come from the project&rsquo;s public
            repository and live site.
          </p>
        </div>
      </div>

      <Link href={`/ecosystem/${next.slug}`} className="group block bg-emerald-990 text-ivory-100">
        <div className="shell flex flex-col gap-4 py-16 sm:flex-row sm:items-end sm:justify-between sm:py-20">
          <div>
            <p className="eyebrow text-emerald-300">Next in the ecosystem</p>
            <p className="mt-4 font-display text-5xl font-semibold tracking-[-0.03em] transition-colors group-hover:text-emerald-200 sm:text-7xl">{next.name}</p>
          </div>
          <span className="inline-flex items-center gap-3 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-ivory-300 group-hover:text-ivory-50">
            {next.category} <Arrow className="transition-transform duration-500 group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </article>
  );
}
