import type { Metadata } from "next";
import Link from "next/link";
import { Logomark } from "@/components/brand/Wordmark";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <section className="grain relative flex min-h-[80svh] flex-col items-center justify-center overflow-hidden bg-emerald-990 px-6 pt-24 text-center text-ivory-100">
      <Logomark className="h-16 w-auto text-emerald-500" />
      <p className="eyebrow mt-10 text-emerald-300">404 · Lost in the smoke</p>
      <h1 className="mt-5 max-w-xl font-display text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">This page hasn&rsquo;t been built yet.</h1>
      <p className="mt-5 max-w-md text-ivory-300">Maybe it&rsquo;s still an idea. Head back to the ecosystem.</p>
      <Link href="/" className="btn-smoke mt-10 rounded-full bg-ivory-100 px-6 py-3.5 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-emerald-990">
        Back to SMOKE X
      </Link>
    </section>
  );
}
