import { getGitHubProfile } from "@/lib/github";
import { products } from "@/data/products";
import { Arrow, SectionLabel } from "@/components/ui/primitives";

const describe: Record<string, string> = {
  ...Object.fromEntries(products.map((p) => [new URL(p.repoUrl).pathname.split("/").pop()!.toLowerCase(), `${p.name} — ${p.category.toLowerCase()}`])),
  featureflow: "FeatureFlow — feature platform for ML systems",
  contextforge: "ContextForge — enterprise AI knowledge platform (in development)",
  "shanmukha-portfolio": "Earlier personal portfolio site",
};

/** language bar shades, darkest for the most-used language — all from the emerald scale */
const shades = ["bg-emerald-700", "bg-emerald-500", "bg-emerald-300", "bg-emerald-200", "bg-ivory-400"];

function monthYear(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}

export async function GitHubSection() {
  const gh = await getGitHubProfile();
  const own = gh.repos.filter((r) => !r.fork);
  const repos = own.slice(0, 8);

  // primary language of each public repository, counted — straight from the API, nothing estimated
  const counts = new Map<string, number>();
  for (const r of own) if (r.language) counts.set(r.language, (counts.get(r.language) ?? 0) + 1);
  const langs = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const total = langs.reduce((n, [, c]) => n + c, 0);

  return (
    <section id="github" aria-labelledby="gh-title" className="vp bg-ivory-200 py-24 sm:py-28">
      <div className="shell">
        <SectionLabel index="05">Developer profile</SectionLabel>
        <div className="mt-8 grid gap-10 lg:mt-[clamp(1.25rem,3vh,2rem)] lg:grid-cols-12 lg:gap-12">
          <div className="flex flex-col lg:col-span-4">
            <h2 id="gh-title" className="font-display text-3xl font-semibold tracking-[-0.02em] text-emerald-990 sm:text-4xl lg:text-[clamp(2rem,4.6vh,2.5rem)]" data-reveal>
              Built in the open.
            </h2>
            <p className="mt-4 leading-relaxed text-emerald-950/75" data-reveal>
              {gh.bio}
            </p>

            {/* profile card */}
            <div className="mt-7 overflow-hidden rounded-2xl bg-emerald-990 text-ivory-100 lg:mt-[clamp(1.25rem,3vh,2rem)]" data-reveal>
              <div className="flex items-baseline justify-between gap-4 border-b border-ivory-100/10 px-5 py-4">
                <span className="font-mono text-sm text-ivory-50">
                  <span className="text-emerald-300">@</span>
                  {gh.login}
                </span>
                <span className="flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ivory-300/60">
                  <span className={`h-1.5 w-1.5 rounded-full ${gh.live ? "bg-emerald-400" : "bg-ivory-400"}`} />
                  {gh.live ? "Live" : "Snapshot"}
                </span>
              </div>
              <dl className="grid grid-cols-2 divide-x divide-ivory-100/10">
                <div className="px-5 py-4">
                  <dt className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-emerald-300">Public repos</dt>
                  <dd className="mt-1 font-display text-3xl font-semibold">{gh.publicRepos}</dd>
                </div>
                <div className="px-5 py-4">
                  <dt className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-emerald-300">Languages</dt>
                  <dd className="mt-1 font-display text-3xl font-semibold">{langs.length}</dd>
                </div>
              </dl>
              {total > 0 && (
                <div className="border-t border-ivory-100/10 px-5 py-4">
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ivory-300/60">Primary language by repository</p>
                  <div className="mt-3 flex h-1.5 gap-0.5 overflow-hidden rounded-full" aria-hidden>
                    {langs.map(([l, c], i) => (
                      <span key={l} className={shades[Math.min(i, shades.length - 1)]} style={{ width: `${(c / total) * 100}%` }} />
                    ))}
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ivory-200">
                    {langs.map(([l, c], i) => (
                      <li key={l} className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${shades[Math.min(i, shades.length - 1)]}`} />
                        {l} <span className="font-mono text-ivory-300/50">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <a
              href={gh.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-smoke mt-6 inline-flex items-center gap-2.5 self-start rounded-full bg-emerald-990 px-6 py-3.5 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-ivory-50"
              data-reveal
            >
              github.com/{gh.login} <Arrow diagonal />
            </a>
            <p className="mt-3 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-emerald-990/45">
              {gh.live ? "Live from the GitHub API · refreshed hourly" : "From the public GitHub API · cached snapshot"}
            </p>
          </div>

          <ul className="grid gap-px self-start overflow-hidden rounded-2xl bg-emerald-990/10 sm:grid-cols-2 lg:col-span-8">
            {repos.map((r, i) => (
              <li key={r.name} className={`bg-ivory-200 ${repos.length % 2 === 1 && i === repos.length - 1 ? "sm:col-span-2" : ""}`} data-reveal style={{ ["--reveal-delay" as string]: `${i * 40}ms` }}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex h-full flex-col p-5 transition-colors duration-500 hover:bg-ivory-50 sm:px-6 lg:py-[clamp(0.95rem,2.4vh,1.5rem)]"
                >
                  <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-emerald-500 transition-transform duration-500 ease-[var(--ease-cine)] group-hover:scale-x-100" />
                  <span className="flex items-start justify-between gap-4">
                    <span className="min-w-0">
                      <span className="block font-mono text-[0.6rem] uppercase tracking-[0.16em] text-emerald-990/40">{gh.login} /</span>
                      <span className="mt-1 block truncate font-display text-[1.08rem] font-semibold tracking-[-0.01em] text-emerald-990 transition-colors group-hover:text-emerald-700">
                        {r.name}
                      </span>
                    </span>
                    <Arrow
                      diagonal
                      className="mt-1 shrink-0 -translate-x-1 translate-y-1 text-emerald-600 opacity-0 transition-[opacity,translate] duration-500 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100"
                    />
                  </span>
                  <span className="mt-2 line-clamp-2 text-sm leading-relaxed text-emerald-950/65">
                    {r.description || describe[r.name.toLowerCase()] || "Public repository"}
                  </span>
                  <span className="mt-auto flex items-center gap-4 pt-4 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-emerald-990/50">
                    {r.language && (
                      <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {r.language}
                      </span>
                    )}
                    <span>Updated {monthYear(r.updatedAt)}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
