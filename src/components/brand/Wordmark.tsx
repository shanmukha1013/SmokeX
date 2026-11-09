import { useId } from "react";
import { GLYPHS, glyphToSvgPath, wordmarkLayout } from "@/lib/wordmark";

type Variant = "metal" | "ink" | "ivory" | "emerald";

interface Props {
  stacked?: boolean;
  variant?: Variant;
  className?: string;
  /** accessible label; pass null to hide from assistive tech (e.g. next to visible text) */
  title?: string | null;
  /** data attributes for the intro hand-off */
  heroTarget?: boolean;
}

const fills: Record<Exclude<Variant, "metal">, string> = {
  ink: "var(--color-emerald-990)",
  ivory: "var(--color-ivory-100)",
  emerald: "var(--color-emerald-500)",
};

/** The SMOKE X wordmark, drawn from the shared glyph geometry in lib/wordmark. */
export function Wordmark({ stacked = false, variant = "ink", className = "", title = "SMOKE X", heroTarget = false }: Props) {
  const uid = useId().replace(/:/g, "");
  const L = wordmarkLayout(stacked);
  const metal = variant === "metal";
  const fill = metal ? `url(#wm-metal-${uid})` : fills[variant];

  return (
    <svg
      viewBox={`0 0 ${L.width} ${L.height}`}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title ?? undefined}
      aria-hidden={title ? undefined : true}
      data-hero-wordmark={heroTarget ? "" : undefined}
      data-stacked={heroTarget ? String(stacked) : undefined}
      overflow="visible"
    >
      {metal && (
        <defs>
          <linearGradient id={`wm-metal-${uid}`} x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0" stopColor="#FBF9F3" />
            <stop offset="0.36" stopColor="#E9E3D3" />
            <stop offset="0.5" stopColor="#BFC9C0" />
            <stop offset="0.56" stopColor="#5CC9A7" />
            <stop offset="0.7" stopColor="#9FE0CA" />
            <stop offset="1" stopColor="#E8F7F1" />
          </linearGradient>
          <linearGradient id={`wm-edge-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FBF9F3" stopOpacity="0.9" />
            <stop offset="1" stopColor="#1FAE87" stopOpacity="0.6" />
          </linearGradient>
        </defs>
      )}
      {L.glyphs.map((g) => (
        <path
          key={g.id}
          d={glyphToSvgPath(g.id)}
          transform={`translate(${g.x} ${g.y}) scale(${g.scale})`}
          fill={fill}
          fillRule="evenodd"
          stroke={metal ? `url(#wm-edge-${uid})` : undefined}
          strokeWidth={metal ? 0.6 / g.scale : undefined}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

/** The X alone — two blades. Used as the logomark / favicon. */
export function Logomark({ className = "", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox={`-6 -6 ${GLYPHS.X1.width + 12} 112`} className={className} aria-hidden>
      <path d={glyphToSvgPath("X1")} fill={color} />
      <path d={glyphToSvgPath("X2")} fill={color} />
    </svg>
  );
}
