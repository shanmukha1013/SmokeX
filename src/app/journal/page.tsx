import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, getJournalEntries } from "@/lib/journal";
import { Arrow } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Journal",
  description: "Thoughts, technical experiments, product updates and engineering notes from Marella Shanmukha Reddy (MSR).",
  alternates: { canonical: "/journal" },
};

export default function JournalIndex() {
  const entries = getJournalEntries();
  const tags = Array.from(new Set(entries.flatMap((e) => e.tags)));
  return (
    <div className="bg-ivory-50">
      <header className="grain relative overflow-hidden bg-emerald-990 pb-20 pt-40 text-ivory-100">
        <div className="shell relative">
          <p className="eyebrow text-emerald-300">Journal · {entries.length} entries</p>
          <h1 className="mt-6 max-w-4xl font-display text-5xl font-semibold leading-[0.98] tracking-[-0.04em] sm:text-7xl">
            Thoughts, experiments and things I learn.
          </h1>
          <ul className="mt-10 flex flex-wrap gap-2" aria-label="Topics">
            {tags.map((t) => (
              <li key={t} className="rounded-full border border-ivory-100/15 px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-ivory-300">
                {t}
              </li>
            ))}
          </ul>
        </div>
      </header>
      <div className="shell py-20">
        <ul className="border-t border-emerald-990/10">
          {entries.map((e) => (
            <li key={e.slug} className="border-b border-emerald-990/10" data-reveal>
              <Link href={`/journal/${e.slug}`} className="group grid gap-3 py-10 sm:grid-cols-12 sm:gap-8">
                <span className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-emerald-990/50 sm:col-span-2">
                  {formatDate(e.date)}
                  <br />
                  {e.readingMinutes} min read
                </span>
                <span className="sm:col-span-8">
                  <span className="block font-display text-3xl font-medium tracking-[-0.02em] text-emerald-990 transition-colors group-hover:text-emerald-600 sm:text-4xl">
                    {e.title}
                  </span>
                  <span className="mt-3 block max-w-2xl text-lg leading-relaxed text-emerald-950/70">{e.summary}</span>
                </span>
                <span className="flex items-start justify-end sm:col-span-2">
                  <Arrow className="mt-3 h-5 w-5 text-emerald-600 transition-transform duration-500 group-hover:translate-x-1" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
