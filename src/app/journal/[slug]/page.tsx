import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, getJournalEntries, getJournalEntry } from "@/lib/journal";
import { site } from "@/lib/site";
import { Arrow } from "@/components/ui/primitives";

export function generateStaticParams() {
  return getJournalEntries().map((e) => ({ slug: e.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const e = getJournalEntry(slug);
  if (!e) return {};
  return {
    title: e.title,
    description: e.summary,
    alternates: { canonical: `/journal/${e.slug}` },
    openGraph: { type: "article", title: e.title, description: e.summary, publishedTime: e.date, authors: [site.owner.name] },
  };
}

export default async function JournalEntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = getJournalEntry(slug);
  if (!e) notFound();
  const others = getJournalEntries().filter((x) => x.slug !== e.slug).slice(0, 2);

  const ld = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: e.title,
    description: e.summary,
    datePublished: e.date,
    author: { "@type": "Person", name: site.owner.name, url: site.url },
    mainEntityOfPage: `${site.url}/journal/${e.slug}`,
  };

  return (
    <article className="bg-ivory-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <header className="grain relative overflow-hidden bg-emerald-990 pb-16 pt-40 text-ivory-100 sm:pb-20">
        <div className="shell relative max-w-4xl">
          <Link href="/journal" className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-emerald-300 hover:text-emerald-200">
            ← Journal
          </Link>
          <h1 className="mt-8 font-display text-4xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-6xl">{e.title}</h1>
          <p className="mt-6 max-w-2xl font-serif text-xl italic leading-snug text-emerald-200 sm:text-2xl">{e.summary}</p>
          <p className="mt-8 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-ivory-300/70">
            <span>{formatDate(e.date)}</span>
            <span>{e.readingMinutes} min read</span>
            <span>{e.tags.join(" · ")}</span>
          </p>
        </div>
      </header>
      <div className="shell max-w-4xl py-16 sm:py-24">
        <div className="prose-smx mx-auto max-w-[68ch]" dangerouslySetInnerHTML={{ __html: e.html }} />
        <p className="mx-auto mt-16 max-w-[68ch] border-t border-emerald-990/10 pt-6 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-emerald-990/50">
          Written by {site.owner.name} · {site.owner.short}
        </p>
      </div>
      {others.length > 0 && (
        <aside className="bg-ivory-200 py-16" aria-label="More from the journal">
          <div className="shell grid gap-6 sm:grid-cols-2">
            {others.map((o) => (
              <Link key={o.slug} href={`/journal/${o.slug}`} className="group rounded-2xl bg-ivory-100 p-7 transition-colors hover:bg-ivory-50">
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.16em] text-emerald-700">Read next</p>
                <p className="mt-3 font-display text-2xl font-medium tracking-[-0.02em] text-emerald-990 group-hover:text-emerald-600">{o.title}</p>
                <p className="mt-2 text-emerald-950/70">{o.summary}</p>
                <Arrow className="mt-5 text-emerald-600 transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </aside>
      )}
    </article>
  );
}
