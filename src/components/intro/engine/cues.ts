/**
 * The intro cue sheet (seconds). Visual timeline and audio score both read from here,
 * so picture and sound can never drift apart.
 *
 * Tempo: a short breath of darkness, then the letters land on a tight, accelerating
 * rhythm, one held beat of silence, and the X is cut. About 11 seconds end to end.
 */
export const CUES = {
  S: 1.2,
  M: 2.05,
  O: 2.85,
  K: 3.65,
  E: 4.4,
  quiet: 5.3,
  glint: 5.6,
  slash1: 6.0,
  slash2: 6.38,
  slashDur: 0.24,
  lock: 7.05,
  tagline: 7.55,
  transition: 8.75,
  clear: 9.6,
  end: 10.7,
} as const;

/** the instant both blades intersect: slash two reaches the centre of the X */
export const IMPACT_TIME = CUES.slash2 + CUES.slashDur * 0.5;
