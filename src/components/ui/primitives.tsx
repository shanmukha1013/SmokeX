import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Tone = "vermilion" | "emerald" | "ghost-light" | "ghost-dark";

const tones: Record<Tone, string> = {
  vermilion: "btn-smoke btn-smoke--vermilion bg-vermilion-500 text-ivory-50 hover:bg-vermilion-600",
  emerald: "btn-smoke bg-emerald-600 text-ivory-50 hover:bg-emerald-700",
  "ghost-light": "btn-smoke border border-ivory-100/30 text-ivory-50 hover:border-ivory-100/70",
  "ghost-dark": "btn-smoke border border-emerald-990/20 text-emerald-990 hover:border-emerald-600",
};

const base =
  "inline-flex items-center justify-center gap-2.5 rounded-full px-6 py-3.5 font-mono text-[0.74rem] uppercase tracking-[0.18em] transition-[background-color,border-color,color] duration-500";

export function ButtonLink({
  href,
  tone = "emerald",
  external,
  children,
  className = "",
  ...rest
}: { href: string; tone?: Tone; external?: boolean; children: ReactNode; className?: string } & Omit<ComponentProps<"a">, "href">) {
  const cls = `${base} ${tones[tone]} ${className}`;
  if (external || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    const isWeb = href.startsWith("http");
    return (
      <a href={href} className={cls} {...(isWeb ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} {...rest}>
      {children}
    </Link>
  );
}

export function Arrow({ diagonal = false, className = "" }: { diagonal?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={`h-3.5 w-3.5 ${className}`} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6">
      {diagonal ? <path d="M4.5 11.5 11.5 4.5M5.5 4.5h6v6" /> : <path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" />}
    </svg>
  );
}

export function SectionLabel({ index, children, light = false }: { index: string; children: ReactNode; light?: boolean }) {
  return (
    <p className={`eyebrow flex items-center gap-3 ${light ? "text-emerald-300" : "text-emerald-700"}`} data-reveal>
      <span className={light ? "text-ivory-300/60" : "text-emerald-990/40"}>{index}</span>
      <span aria-hidden className={`h-px w-8 ${light ? "bg-emerald-300/50" : "bg-emerald-600/40"}`} />
      {children}
    </p>
  );
}

/** Display heading with masked line-by-line reveal. Pass lines as an array. */
export function DisplayHeading({
  lines,
  as: Tag = "h2",
  className = "",
  delay = 0,
}: {
  lines: ReactNode[];
  as?: "h1" | "h2" | "h3";
  className?: string;
  delay?: number;
}) {
  return (
    <Tag className={className}>
      {lines.map((l, i) => (
        <span key={i} className="line-mask" style={{ ["--reveal-delay" as string]: `${delay + i * 90}ms` }}>
          <span>{l}</span>
        </span>
      ))}
    </Tag>
  );
}

export function StatusBadge({ status, light = false }: { status: string; light?: boolean }) {
  const live = status === "Live";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.18em] ${
        light ? "border-ivory-100/20 text-ivory-100" : "border-emerald-990/15 text-emerald-900"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${live ? "bg-emerald-400" : "bg-ivory-400"}`}
        style={live ? { animation: "pulse-dot 2s ease-in-out infinite" } : undefined}
      />
      {status}
    </span>
  );
}
