import { glyphToSvgPath, wordmarkLayout } from "@/lib/wordmark";

/** SVG strings built from the shared wordmark geometry, for generated images. */
export function wordmarkSvg(fill = "#F3EFE4") {
  const L = wordmarkLayout(false);
  const paths = L.glyphs
    .map((g) => `<path d="${glyphToSvgPath(g.id)}" transform="translate(${g.x} ${g.y}) scale(${g.scale})" fill="${fill}" fill-rule="evenodd"/>`)
    .join("");
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L.width} ${L.height}">${paths}</svg>`, w: L.width, h: L.height };
}

export function markSvg(a = "#F3EFE4", b = "#009473", bg = "#01130F") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-30 -24 158 148"><rect x="-30" y="-24" width="158" height="148" rx="30" fill="${bg}"/><path d="${glyphToSvgPath("X1")}" fill="${a}"/><path d="${glyphToSvgPath("X2")}" fill="${b}"/></svg>`;
}

export const dataUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
