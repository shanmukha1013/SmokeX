"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems, site } from "@/lib/site";
import { products } from "@/data/products";
import { Wordmark } from "@/components/brand/Wordmark";
import { SmokeField } from "@/components/smoke/SmokeField";
import { glyphToSvgPath, wordmarkLayout } from "@/lib/wordmark";
import { replayIntro } from "@/components/intro/IntroController";

/** CSS mask of the letters S-M-O-K-E only, in the wordmark's own coordinate space (the X stays pure metal). */
const SMOKE_MASK = (() => {
  const L = wordmarkLayout(false);
  const paths = L.glyphs
    .filter((g) => g.id !== "X1" && g.id !== "X2")
    .map((g) => `<path d="${glyphToSvgPath(g.id)}" transform="translate(${g.x} ${g.y}) scale(${g.scale})" fill-rule="evenodd"/>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L.width} ${L.height}" preserveAspectRatio="none">${paths}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
})();

const maskStyle = {
  maskImage: SMOKE_MASK,
  WebkitMaskImage: SMOKE_MASK,
  maskSize: "100% 100%",
  WebkitMaskSize: "100% 100%",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
} as const;

/** The signature: metal wordmark with slow emerald smoke living inside SMOKE. Pauses off-screen. */
function SmokeSignature() {
  return (
    <div className="relative mt-20">
      <Wordmark variant="metal" title={null} className="block h-auto w-full opacity-90" />
      <SmokeField variant="inlay" intensity={1} interactive style={maskStyle} />
    </div>
  );
}

export function Footer() {
  const home = usePathname() === "/";
  return (
    <footer className="relative overflow-hidden bg-emerald-990 text-ivory-200">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-emerald-500/40 to-transparent" />
      <div className="shell pb-10 pt-20">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="font-serif text-2xl italic text-ivory-100">Turning ideas into products.</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ivory-300/80">
              SMOKE X is the personal technology ecosystem of {site.owner.name} — products, AI engineering and experiments, built in public.
            </p>
            {home && (
              <button
                type="button"
                onClick={replayIntro}
                className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-ivory-100/15 px-4 py-2.5 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-ivory-200 transition-colors hover:border-emerald-300/60 hover:text-ivory-50"
              >
                <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden>
                  <path d="M2 1.2v9.6L10.5 6z" fill="currentColor" />
                </svg>
                Replay the intro
              </button>
            )}
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7">
            <div>
              <p className="eyebrow text-emerald-300/80">Navigate</p>
              <ul className="mt-4 space-y-2 text-sm">
                {navItems.map((n) => (
                  <li key={n.id}>
                    <Link href={n.href} className="transition-colors hover:text-ivory-50">
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="eyebrow text-emerald-300/80">Products</p>
              <ul className="mt-4 space-y-2 text-sm">
                {products.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/ecosystem/${p.slug}`} className="transition-colors hover:text-ivory-50">
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="eyebrow text-emerald-300/80">Connect</p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <a href={`mailto:${site.owner.email}`} className="break-all transition-colors hover:text-ivory-50">
                    Email
                  </a>
                </li>
                <li>
                  <a href={site.owner.whatsapp} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-ivory-50">
                    WhatsApp
                  </a>
                </li>
                <li>
                  <a href={site.social.github} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-ivory-50">
                    GitHub
                  </a>
                </li>
                <li>
                  <a href={site.social.linkedin} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-ivory-50">
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a href={site.social.leetcode} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-ivory-50">
                    LeetCode
                  </a>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        <SmokeSignature />

        <div className="mt-8 flex flex-col gap-3 border-t border-ivory-100/10 pt-6 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ivory-300/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.owner.name} · {site.owner.short}
          </p>
          <p>Designed &amp; engineered in-house</p>
        </div>
      </div>
    </footer>
  );
}
