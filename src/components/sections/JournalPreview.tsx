import Link from "next/link";
import { formatDate, getJournalEntries } from "@/lib/journal";
import { Arrow, DisplayHeading, SectionLabel } from "@/components/ui/primitives";

export function JournalPreview() {
  const entries = getJournalEntries().slice(0, 3);
  return (
    <section id="journal" aria-labelledby="journal-title" className="vp bg-ivory-50 py-24 sm:py-28">
      <div className="shell">
        <SectionLabel index="07">Journal</SectionLabel>
        <div className="mt-8 flex flex-col justify-between lg:mt-[clamp(1rem,2.6vh,1.75rem)] gap-8 sm:flex-row sm:items-end">
          <DisplayHeading
            lines={[<span key="a" id="journal-title">Thoughts, experiments</span>, "and things I learn."]}
            className="font-display text-[2.1rem] font-semibold leading-[1.04] tracking-[-0.03em] text-emerald-990 sm:text-5xl lg:text-[clamp(2.5rem,min(4.4vw,6.8vh),3.75rem)]"
          />
          <Link
            href="/journal"
            className="group inline-flex shrink-0 items-center gap-2.5 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-emerald-800 hover:text-emerald-600"
            data-reveal
          >
            All entries <Arrow className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <ul className="mt-12 border-t border-emerald-990/10 lg:mt-[clamp(1.75rem,5vh,3.5rem)]">
          {entries.map((e, i) => (
            <li key={e.slug} className="border-b border-emerald-990/10" data-reveal style={{ ["--reveal-delay" as string]: `${i * 80}ms` }}>
              <Link href={`/journal/${e.slug}`} className="group grid gap-3 py-7 sm:grid-cols-12 lg:py-[clamp(1.1rem,3vh,2rem)] sm:items-baseline sm:gap-8">
                <span className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-emerald-990/50 sm:col-span-2">{formatDate(e.date)}</span>
                <span className="sm:col-span-7">
                  <span className="block font-display text-2xl font-medium tracking-[-0.02em] text-emerald-990 transition-colors group-hover:text-emerald-600 sm:text-3xl">
                    {e.title}
                  </span>
                  <span className="mt-2 block max-w-2xl leading-relaxed text-emerald-950/70">{e.summary}</span>
                </span>
                <span className="flex items-center justify-between gap-3 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-emerald-700 sm:col-span-3 sm:justify-end">
                  {e.tags.slice(0, 2).join(" · ")}
                  <Arrow className="text-emerald-600 transition-transform duration-500 group-hover:translate-x-1" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
