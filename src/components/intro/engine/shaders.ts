/* GLSL for the SMOKE X intro. All colour math is linear; tone mapping happens in the composite pass. */

export const FULLSCREEN_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

const NOISE = /* glsl */ `
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * .1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6. - 15.) + 10.);
  float a = hash12(i);
  float b = hash12(i + vec2(1., 0.));
  float c = hash12(i + vec2(0., 1.));
  float d = hash12(i + vec2(1., 1.));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
const mat2 ROT = mat2(.8, .6, -.6, .8);
float fbm(vec2 p) {
  float v = 0., a = .5;
  for (int i = 0; i < OCTAVES; i++) {
    v += a * vnoise(p);
    p = ROT * p * 2.03 + vec2(3.1, 1.7);
    a *= .5;
  }
  return v;
}
float smokeLayer(vec2 p, float t, float sc, vec2 drift) {
  vec2 q = p * sc + drift * t;
  vec2 w = vec2(fbm(q + vec2(0., t * .15)), fbm(q + vec2(5.2, 1.3) - vec2(t * .12, 0.)));
  return fbm(q + 1.8 * w + vec2(t * .04, -t * .07));
}
vec2 rot2(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }
`;

/**
 * Smoke simulation, rendered into a low-resolution HDR target.
 * rgb = lit back smoke (scene background) · a = density of the front wisp layer.
 * Coordinates: p in "aspect space" — y in [-.5,.5], x scaled by aspect.
 */
export const SMOKE_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uAspect;
uniform float uDensity;
uniform float uBright;
uniform vec3 uCam;
uniform vec3 uDeep;
uniform vec3 uMid;
uniform vec3 uLight;
uniform vec3 uHot;
uniform vec4 uLights[4];
uniform vec4 uSlashA;
uniform vec3 uSlashAP;
uniform vec4 uSlashB;
uniform vec3 uSlashBP;
uniform vec4 uBurst;
uniform vec4 uSwirl;
uniform vec2 uSweep;
uniform vec4 uRing;

${NOISE}

// displacement (xy) + light (z) along a blade path. P = (head 0..1, push strength, glow)
vec3 slashField(vec2 p, vec4 L, vec3 P) {
  if (P.y < .001 && P.z < .001) return vec3(0.);
  vec2 a = L.xy, b = L.zw;
  vec2 ab = b - a;
  float len = length(ab);
  vec2 dir = ab / len;
  vec2 n = vec2(-dir.y, dir.x);
  float along = dot(p - a, dir) / len;
  float side = dot(p - a, n);
  float behind = smoothstep(P.x + .01, P.x - .05, along);
  float near = exp(-abs(side) * 8.);
  vec2 d = n * sign(side) * near * behind * P.y * .1;
  vec2 head = a + ab * clamp(P.x, 0., 1.);
  float light = exp(-abs(side) * 34.) * behind * P.z
              + exp(-length(p - head) * 12.) * P.z * 2. * step(P.x, 1.02) * step(0., P.x);
  return vec3(d, light);
}

void main() {
  vec2 p = (vUv - .5) * vec2(uAspect, 1.);
  float t = uTime;
  vec2 disp = vec2(0.);
  float dyn = 0.;

  vec3 sa = slashField(p, uSlashA, uSlashAP); disp += sa.xy; dyn += sa.z;
  vec3 sb = slashField(p, uSlashB, uSlashBP); disp += sb.xy; dyn += sb.z;

  // shockwave from the X impact
  vec2 bd = p - uBurst.xy;
  float br = length(bd);
  vec2 bn = bd / max(br, 1e-3);
  float shock = exp(-pow((br - uBurst.z) * 6., 2.)) * uBurst.w;
  disp += bn * (shock * .08 + uBurst.w * .05 * smoothstep(uBurst.z, 0., br));
  dyn += shock * 1.5 + uBurst.w * exp(-br * 3.5) * .9;

  // swirl around a point (O and E entrances)
  vec2 sd = p - uSwirl.xy;
  float sr2 = dot(sd, sd);
  float sw = uSwirl.w * exp(-sr2 / (uSwirl.z * uSwirl.z));
  disp += (uSwirl.xy + rot2(sd, sw * 2.6)) - p;
  dyn += sw * .45;

  // horizontal gust (M entrance)
  float band = exp(-pow((p.x - uSweep.x) * 2.6, 2.)) * uSweep.y;
  disp.x -= band * .13;
  disp.y += band * .02 * sin(p.y * 9. + t);
  dyn += band * .3;

  // circular energy wave (O entrance)
  vec2 rd = p - uRing.xy;
  float rr = length(rd);
  float ring = exp(-pow((rr - uRing.z) * 20., 2.)) * uRing.w;
  disp += (rd / max(rr, 1e-3)) * ring * .03;
  dyn += ring * 2.;

  for (int i = 0; i < 4; i++) {
    vec4 L = uLights[i];
    vec2 ld = p - L.xy;
    dyn += L.w * exp(-dot(ld, ld) / (L.z * L.z));
  }

  float zoom = 1. + uCam.z;
  vec2 base = p / zoom + disp;

  float d1 = smokeLayer(base * .85 + uCam.xy * .04, t * .55, 1.25, vec2(.05, .015));
  float d2 = smokeLayer(base * .95 + uCam.xy * .08 + vec2(3.3, 1.1), t * .75, 2., vec2(-.06, .03));
  float d3 = smokeLayer(base * 1.1 + uCam.xy * .14 + vec2(7., 4.), t * .95, 2.9, vec2(.08, .04));

  float key = smoothstep(1.25, -.2, length((p - vec2(0., .58)) * vec2(.55, 1.))) * .6 + .1;
  float vign = smoothstep(1.4, .2, length(p * vec2(.72, 1.15)));

  float a1 = smoothstep(.3, .85, d1) * uDensity;
  float a2 = smoothstep(.36, .9, d2) * uDensity * .9;
  float a3 = smoothstep(.44, .95, d3) * uDensity * .75;

#ifdef SELF_SHADOW
  float d2l = smokeLayer(base * .95 + uCam.xy * .08 + vec2(3.3, 1.1) + vec2(-.02, .04), t * .75, 2., vec2(-.06, .03));
  float shade = clamp(.65 + (d2 - d2l) * 4.5, .25, 1.5);
#else
  float shade = 1.;
#endif

  vec3 lit = uMid * key + uLight * dyn + uHot * dyn * dyn * .3;
  vec3 col = uDeep * (.3 + .7 * key) * vign;
  col = mix(col, uDeep * 1.4 + lit * .5, a1 * .8);
  col = mix(col, uMid * .45 + lit * shade * .8, a2 * .75);
  col = mix(col, uMid * .6 + lit * 1.05, a3 * .6);
  col *= uBright;
  col += uLight * dyn * .05;

  float df = smokeLayer(base * 1.3 + uCam.xy * .25 + vec2(11., 2.), t * 1.15, 1.7, vec2(.1, .02));
  gl_FragColor = vec4(col, df);
}`;

/** Final composite: front wisps, cover/clear transition, flash, ACES, vignette, grain, premultiplied alpha. */
export const COMPOSITE_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform sampler2D tSmoke;
uniform float uFront;
uniform float uCover;
uniform float uClear;
uniform float uFlash;
uniform float uFade;
uniform float uExposure;
uniform float uTime;
uniform float uGrain;
uniform vec2 uRes;
uniform vec3 uDeep;
uniform vec3 uMid;
uniform vec3 uLight;
uniform vec3 uHot;

float h(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * .1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec3 aces(vec3 x) {
  const float a = 2.51, b = .03, c = 2.43, d = .59, e = .14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0., 1.);
}
vec3 toSRGB(vec3 c) {
  c = max(c, 0.);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1. / 2.4)) - .055, step(.0031308, c));
}

void main() {
  vec3 col = texture2D(tDiffuse, vUv).rgb;
  vec4 sm = texture2D(tSmoke, vUv);
  float df = sm.a;

  float fa = smoothstep(.52, .95, df) * uFront;
  vec3 fcol = mix(uDeep * 1.6, uMid * 1.1, smoothstep(.5, 1., df)) + sm.rgb * .25;
  col = mix(col, fcol, fa);

  float th = 1. - uCover * 1.6;
  float cov = smoothstep(th, th + .35, df);
  vec3 ccol = mix(uDeep * 1.3, uMid * 1.25, smoothstep(.2, .9, df)) + sm.rgb * .45 + uLight * .05;
  col = mix(col, ccol, cov);

  col += (uLight * .95 + uHot * .12) * uFlash;
  col *= uExposure * uFade;
  col = aces(col);

  vec2 q = vUv - .5;
  col *= mix(1., smoothstep(.95, .18, length(q * vec2(1., 1.25))), .5);
  col = toSRGB(col);
  col += (h(vUv * uRes + fract(uTime * 7.3) * 113.) - .5) * uGrain;

  float alpha = 1.;
  if (uClear > 0.) {
    float ct = uClear * 1.55 - .35;
    alpha = smoothstep(ct, ct + .18, df);
    float edge = alpha * (1. - alpha) * 4.;
    col += toSRGB(uLight * .35) * edge * .5;
  }
  gl_FragColor = vec4(col * alpha, alpha);
}`;

/** Energy streak: used for the K light streak and both X blades. Additive, HDR. */
export const STREAK_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export const STREAK_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uHead;
uniform float uTail;
uniform float uIntensity;
uniform float uWidth;
uniform float uTime;
uniform vec3 uCore;
uniform vec3 uGlow;
void main() {
  float u = vUv.x;
  float v = (vUv.y - .5) * 2.;
  float behind = uHead - u;
  if (behind < -.004 || uIntensity < .001) discard;
  float tailFade = exp(-max(behind, 0.) / uTail);
  float taper = mix(1., .2, clamp(behind / (uTail * 3.), 0., 1.));
  float w = uWidth * taper;
  float core = exp(-pow(v / (w * .085), 2.));
  float glow = exp(-abs(v) / (w * .55)) * .55;
  float headGlow = exp(-pow(behind * 70., 2.)) * exp(-abs(v) * 2.2) * 2.2;
  float shimmer = .78 + .22 * sin(u * 1400. - uTime * 90.);
  vec3 col = uCore * core * shimmer * 3.2 + uGlow * (glow + headGlow) + uCore * headGlow * .6;
  gl_FragColor = vec4(col * tailFade * uIntensity, 1.);
}`;

export const RING_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uR;
uniform float uAmt;
uniform float uTime;
uniform vec3 uCol;
uniform vec3 uHot;
void main() {
  vec2 p = vUv * 2. - 1.;
  float r = length(p);
  float ang = atan(p.y, p.x);
  float ring = exp(-pow((r - uR) * 16., 2.));
  float inner = exp(-pow((r - uR * .8) * 26., 2.)) * .35;
  float flick = .7 + .3 * sin(ang * 12. + uTime * 9.) * sin(ang * 5. - uTime * 5.);
  vec3 col = (uCol * (ring * 1.3 + inner) + uHot * pow(ring, 5.) * 1.6) * flick * uAmt;
  if (dot(col, col) < 1e-6) discard;
  gl_FragColor = vec4(col, 1.);
}`;

export const EMBER_VERT = /* glsl */ `
attribute float aSeed;
attribute float aSize;
uniform float uTime;
uniform float uPR;
uniform float uAlpha;
uniform float uRange;
varying float vA;
varying float vHot;
void main() {
  vec3 p = position;
  float t = uTime * (.35 + aSeed * .55);
  p.y = mod(p.y + t * 20. + aSeed * 400. + uRange * .5, uRange) - uRange * .5;
  p.x += sin(t * .6 + aSeed * 30.) * 26.;
  p.z += cos(t * .4 + aSeed * 20.) * 22.;
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uPR * (620. / -mv.z);
  float flick = .55 + .45 * sin(uTime * 2.6 + aSeed * 50.);
  vA = uAlpha * flick * smoothstep(uRange * .5, uRange * .32, abs(p.y));
  vHot = step(.9, aSeed);
}`;

export const EMBER_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uCol;
uniform vec3 uHot;
varying float vA;
varying float vHot;
void main() {
  float d = length(gl_PointCoord - .5);
  float a = smoothstep(.5, 0., d);
  a *= a;
  vec3 c = mix(uCol, uHot, vHot);
  gl_FragColor = vec4(c * a * vA * 1.4, 1.);
}`;

export const SPARK_VERT = /* glsl */ `
attribute float aAlpha;
attribute float aSize;
attribute float aHeat;
uniform float uPR;
varying float vA;
varying float vHeat;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uPR * (620. / -mv.z);
  vA = aAlpha;
  vHeat = aHeat;
}`;

export const SPARK_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uCol;
uniform vec3 uHot;
varying float vA;
varying float vHeat;
void main() {
  if (vA < .003) discard;
  float d = length(gl_PointCoord - .5);
  float a = smoothstep(.5, .05, d);
  vec3 c = mix(uCol, uHot, vHeat);
  gl_FragColor = vec4(c * a * vA * 3.5, 1.);
}`;

/* ── Metallic letter material extensions (injected into MeshStandardMaterial) ── */

export const LETTER_FRAG_HEAD = /* glsl */ `
uniform vec3 uGlowCol;
uniform vec3 uHotCol;
uniform float uGlow;
uniform float uSweepX;
uniform float uSweepAmt;
uniform float uReveal;
uniform float uSeed;
uniform vec4 uCut;
uniform vec2 uCutO;
uniform float uHot;
uniform vec2 uYRange;
uniform vec3 uChrome[6];
varying vec3 vWPos;
// chrome horizon — the same stops as the SVG wordmark gradient, so 3D and 2D match
vec3 smxChrome(float t) {
  if (t < .36) return mix(uChrome[0], uChrome[1], t / .36);
  if (t < .5) return mix(uChrome[1], uChrome[2], (t - .36) / .14);
  if (t < .56) return mix(uChrome[2], uChrome[3], (t - .5) / .06);
  if (t < .7) return mix(uChrome[3], uChrome[4], (t - .56) / .14);
  return mix(uChrome[4], uChrome[5], clamp((t - .7) / .3, 0., 1.));
}
float smxH3(vec3 p) {
  p = fract(p * .3183099 + .1);
  p *= 17.;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float smxN3(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3. - 2. * f);
  return mix(
    mix(mix(smxH3(i), smxH3(i + vec3(1, 0, 0)), f.x), mix(smxH3(i + vec3(0, 1, 0)), smxH3(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(smxH3(i + vec3(0, 0, 1)), smxH3(i + vec3(1, 0, 1)), f.x), mix(smxH3(i + vec3(0, 1, 1)), smxH3(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}`;

export const LETTER_FRAG_CLIP = /* glsl */ `
float smxEdge = 0.;
if (uReveal < .999) {
  float dn = smxN3(vWPos * .045 + uSeed) * .65 + smxN3(vWPos * .16 + uSeed * 2.) * .35;
  float e = dn - (1. - uReveal) * 1.08;
  if (e < 0.) discard;
  smxEdge = 1. - smoothstep(0., .07, e);
}
float smxCut = 0.;
if (uCut.w > .5) {
  float s = dot(vWPos.xy - uCutO, uCut.xy);
  if (s > uCut.z) discard;
  smxCut = 1. - smoothstep(0., 30., uCut.z - s);
}`;

export const LETTER_FRAG_COLOR = /* glsl */ `
{
  float smxT = clamp(.5 - (vWPos.y - uYRange.x) / (2. * uYRange.y), 0., 1.);
  diffuseColor.rgb *= smxChrome(smxT);
}`;

export const LETTER_FRAG_EMISSIVE = /* glsl */ `
{
  vec3 smxV = normalize(vViewPosition);
  float fres = pow(1. - clamp(abs(dot(normalize(normal), smxV)), 0., 1.), 2.5);
  float sweep = exp(-pow((vWPos.x - uSweepX) / 40., 2.)) * uSweepAmt;
  totalEmissiveRadiance += uGlowCol * (fres * uGlow * 1.5 + sweep * (.3 + fres * 1.6));
  totalEmissiveRadiance += uHotCol * sweep * fres * .7;
  totalEmissiveRadiance += mix(uGlowCol, uHotCol, .55) * smxEdge * 5.;
  totalEmissiveRadiance += mix(uGlowCol, uHotCol, smxCut) * smxCut * 7.;
  totalEmissiveRadiance += mix(uGlowCol * 1.4, uHotCol, uHot * .6) * uHot * (.3 + fres * 1.5);
}`;
