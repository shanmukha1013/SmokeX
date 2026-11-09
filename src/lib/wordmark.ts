/**
 * SMOKE X wordmark geometry — the single source of truth for the brand mark.
 *
 * Every letter is a hand-built path on a 100-unit cap height (SVG space, y down).
 * The same data drives the SVG wordmark in the site UI and the extruded 3D letters
 * in the cinematic intro, so the intro's final frame and the homepage hero are the
 * exact same mark.
 *
 * Design notes
 * - Heavy, extended construction: 24-unit stems, 22-unit bars.
 * - The S terminals are cut on the same 0.7 slope as the X strokes, tying the
 *   letters to the signature slash.
 * - The X is not a single glyph: it is two separate blades ("\" and "/").
 *   In the intro each blade is forged by one slash; their intersection is the X.
 */

export type Cmd =
  | ["M", number, number]
  | ["L", number, number]
  | ["C", number, number, number, number, number, number]
  | ["Z"];

export type Contour = Cmd[];

export type GlyphId = "S" | "M" | "O" | "K" | "E" | "X1" | "X2";

export interface Glyph {
  id: GlyphId;
  /** advance width in glyph units */
  width: number;
  /** first contour is the outline, the rest are holes */
  contours: Contour[];
}

/** cubic handle ratio for a quarter circle */
const KAPPA = 0.5523;

/** quarter-round corner: from point P (on incoming edge) around corner K to point Q */
function corner(px: number, py: number, kx: number, ky: number, qx: number, qy: number): Cmd {
  return [
    "C",
    px + (kx - px) * KAPPA,
    py + (ky - py) * KAPPA,
    qx + (kx - qx) * KAPPA,
    qy + (ky - qy) * KAPPA,
    qx,
    qy,
  ];
}

function roundRect(x: number, y: number, w: number, h: number, r: number): Contour {
  return [
    ["M", x + r, y],
    ["L", x + w - r, y],
    corner(x + w - r, y, x + w, y, x + w, y + r),
    ["L", x + w, y + h - r],
    corner(x + w, y + h - r, x + w, y + h, x + w - r, y + h),
    ["L", x + r, y + h],
    corner(x + r, y + h, x, y + h, x, y + h - r),
    ["L", x, y + r],
    corner(x, y + r, x, y, x + r, y),
    ["Z"],
  ];
}

/** slope shared by the X strokes and the S terminals (dx per unit dy) */
export const SLASH_SLOPE = 0.7;

const S: Glyph = {
  id: "S",
  width: 84,
  contours: [
    [
      ["M", 22, 0],
      ["L", 84, 0],
      ["L", 84 - 22 * SLASH_SLOPE, 22],
      ["L", 24, 22],
      ["L", 24, 39],
      ["L", 62, 39],
      corner(62, 39, 84, 39, 84, 61),
      ["L", 84, 78],
      corner(84, 78, 84, 100, 62, 100),
      ["L", 0, 100],
      ["L", 22 * SLASH_SLOPE, 78],
      ["L", 60, 78],
      ["L", 60, 61],
      ["L", 22, 61],
      corner(22, 61, 0, 61, 0, 39),
      ["L", 0, 22],
      corner(0, 22, 0, 0, 22, 0),
      ["Z"],
    ],
  ],
};

const M: Glyph = {
  id: "M",
  width: 100,
  contours: [
    [
      ["M", 0, 100],
      ["L", 0, 0],
      ["L", 24, 0],
      ["L", 50, 38],
      ["L", 76, 0],
      ["L", 100, 0],
      ["L", 100, 100],
      ["L", 76, 100],
      ["L", 76, 44],
      ["L", 56, 72],
      ["L", 44, 72],
      ["L", 24, 44],
      ["L", 24, 100],
      ["Z"],
    ],
  ],
};

const O: Glyph = {
  id: "O",
  width: 96,
  contours: [roundRect(0, 0, 96, 100, 30), roundRect(24, 22, 48, 56, 9)],
};

const K: Glyph = {
  id: "K",
  width: 86,
  contours: [
    [
      ["M", 0, 0],
      ["L", 24, 0],
      ["L", 24, 38],
      ["L", 54, 0],
      ["L", 84, 0],
      ["L", 46, 50],
      ["L", 86, 100],
      ["L", 56, 100],
      ["L", 24, 60],
      ["L", 24, 100],
      ["L", 0, 100],
      ["Z"],
    ],
  ],
};

const E: Glyph = {
  id: "E",
  width: 76,
  contours: [
    [
      ["M", 0, 0],
      ["L", 76, 0],
      ["L", 76, 22],
      ["L", 24, 22],
      ["L", 24, 39],
      ["L", 66, 39],
      ["L", 66, 61],
      ["L", 24, 61],
      ["L", 24, 78],
      ["L", 76, 78],
      ["L", 76, 100],
      ["L", 0, 100],
      ["Z"],
    ],
  ],
};

/** X stroke width (horizontal) and full glyph width */
const XW = 28;
const XG = 98;

/** blade one — "\" — forged by the first slash */
const X1: Glyph = {
  id: "X1",
  width: XG,
  contours: [
    [
      ["M", 0, 0],
      ["L", XW, 0],
      ["L", XG, 100],
      ["L", XG - XW, 100],
      ["Z"],
    ],
  ],
};

/** blade two — "/" — forged by the second slash */
const X2: Glyph = {
  id: "X2",
  width: XG,
  contours: [
    [
      ["M", XG - XW, 0],
      ["L", XG, 0],
      ["L", XW, 100],
      ["L", 0, 100],
      ["Z"],
    ],
  ],
};

export const GLYPHS: Record<GlyphId, Glyph> = { S, M, O, K, E, X1, X2 };

export const LETTER_GAP = 14;
export const WORD_GAP = 44;

export interface PlacedGlyph {
  id: GlyphId;
  x: number;
  y: number;
  scale: number;
}

export interface WordmarkLayout {
  glyphs: PlacedGlyph[];
  width: number;
  height: number;
  stacked: boolean;
}

/**
 * Horizontal: S M O K E   X on one line.
 * Stacked (portrait screens): SMOKE on top, a larger X centred beneath it.
 */
export function wordmarkLayout(stacked = false): WordmarkLayout {
  const glyphs: PlacedGlyph[] = [];
  let x = 0;
  for (const id of ["S", "M", "O", "K", "E"] as const) {
    glyphs.push({ id, x, y: 0, scale: 1 });
    x += GLYPHS[id].width + LETTER_GAP;
  }
  const smokeWidth = x - LETTER_GAP;

  if (!stacked) {
    const xx = smokeWidth + WORD_GAP;
    glyphs.push({ id: "X1", x: xx, y: 0, scale: 1 }, { id: "X2", x: xx, y: 0, scale: 1 });
    return { glyphs, width: xx + XG, height: 100, stacked };
  }

  const s = 1.5;
  const xx = (smokeWidth - XG * s) / 2;
  const yy = 100 + 34;
  glyphs.push({ id: "X1", x: xx, y: yy, scale: s }, { id: "X2", x: xx, y: yy, scale: s });
  return { glyphs, width: smokeWidth, height: yy + 100 * s, stacked };
}

export function contourToSvg(contour: Contour): string {
  return contour
    .map((c) => {
      switch (c[0]) {
        case "M":
        case "L":
          return `${c[0]}${+c[1].toFixed(2)} ${+c[2].toFixed(2)}`;
        case "C":
          return `C${c
            .slice(1)
            .map((n) => +(n as number).toFixed(2))
            .join(" ")}`;
        case "Z":
          return "Z";
      }
    })
    .join("");
}

export function glyphToSvgPath(id: GlyphId): string {
  return GLYPHS[id].contours.map(contourToSvg).join("");
}
