/**
 * Lightweight smoke field: raw WebGL, one full-screen triangle, no dependencies.
 * Renders at a fraction of CSS resolution (smoke is soft — nobody can tell) and
 * pauses whenever it is off-screen or the tab is hidden.
 */

export type SmokeVariant = "deep" | "ivory" | "inlay";

export interface SmokeOptions {
  variant: SmokeVariant;
  intensity: number;
  interactive: boolean;
  /** starting cover amount (1 = fully smoked over); animated to 0 by reveal() */
  cover?: number;
}

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main(){ vUv = aPos * .5 + .5; gl_Position = vec4(aPos, 0., 1.); }`;

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform float uTime;
uniform float uAspect;
uniform float uIntensity;
uniform float uCover;
uniform float uVariant;
uniform vec3 uTrail[12];
uniform vec3 uBg;
uniform vec3 uDeep;
uniform vec3 uMid;
uniform vec3 uLight;

float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*f*(f*(f*6.-15.)+10.);
  return mix(mix(hash12(i), hash12(i+vec2(1,0)), u.x), mix(hash12(i+vec2(0,1)), hash12(i+vec2(1,1)), u.x), u.y); }
const mat2 R = mat2(.8,.6,-.6,.8);
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*vnoise(p); p=R*p*2.03+vec2(3.1,1.7); a*=.5; } return v; }
float smoke(vec2 p, float t, float sc, vec2 drift){
  vec2 q = p*sc + drift*t;
  vec2 w = vec2(fbm(q + vec2(0., t*.12)), fbm(q + vec2(5.2,1.3) - vec2(t*.1, 0.)));
  return fbm(q + 1.7*w + vec2(t*.03, -t*.05));
}

void main(){
  vec2 p = (vUv - .5) * vec2(uAspect, 1.);
  float t = uTime;
  vec2 disp = vec2(0.);
  float glow = 0.;
  for (int i = 0; i < 12; i++) {
    vec3 tr = uTrail[i];
    if (tr.z <= 0.) continue;
    vec2 d = p - tr.xy;
    float r2 = dot(d, d);
    float k = exp(-r2 / .012) * tr.z;
    glow += k;
    disp += vec2(-d.y, d.x) * k * 1.6 + d * k * .4;
  }
  vec2 b = p + disp * .35;
  float d1 = smoke(b, t*.5, 1.4, vec2(.05, .02));
  float d2 = smoke(b + vec2(4.2, 1.7), t*.7, 2.3, vec2(-.05, .03));

  float key = smoothstep(1.3, -.2, length((p - vec2(-.15, .55)) * vec2(.55, 1.)));
  float a1 = smoothstep(.34, .88, d1) * uIntensity;
  float a2 = smoothstep(.42, .94, d2) * uIntensity * .8;

  float th = 1. - uCover * 1.6;
  float cov = smoothstep(th, th + .35, d2*.6 + d1*.4);

  if (uVariant < .5) {
    vec3 col = uBg * (.55 + .45*key);
    col = mix(col, uDeep + uMid * key * .6, a1 * .85);
    col = mix(col, uMid * (.5 + .7*key) + uLight * glow * .5, a2 * .8);
    col += uLight * glow * (a1 + a2 + .15) * .55;
    col = mix(col, mix(uDeep, uMid, d1), cov);
    float g = hash12(vUv * 913. + fract(t) * 37.) - .5;
    col += g * .025;
    outColor = vec4(col, 1.);
  } else if (uVariant > 1.5) {
    // inlay: smoke living inside letterforms (the canvas is masked to the glyphs).
    // Deep emerald body drifts through the metal; lighter wisps catch the light at its edges.
    float body = smoothstep(.3, .82, d1);
    float wisp = smoothstep(.5, .92, d2);
    float edge = wisp * (1. - wisp) * 4.;
    vec3 col = mix(uDeep, uMid, body * .7 + key * .3);
    col = mix(col, uLight, clamp(edge * .55 + glow * .6, 0., 1.));
    float a = clamp(body * .52 + wisp * .2 + edge * .1 + glow * .25, 0., .8) * uIntensity;
    outColor = vec4(col * a, a);
  } else {
    float a = clamp(a1 * .55 + a2 * .45 + glow * .35 * (a1 + .3), 0., 1.) * .5;
    vec3 col = mix(uMid, uLight, a2 + glow * .5);
    outColor = vec4(col * a, a);
  }
}`;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  // sRGB → linear-ish (gamma 2.2) so colours mix like the intro does, then back in output
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export class SmokeGL {
  private gl: WebGL2RenderingContext;
  private prog: WebGLProgram;
  private buf: WebGLBuffer;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private raf = 0;
  private running = false;
  private start = performance.now();
  private frozenTime: number | null = null;
  private trail: { x: number; y: number; t: number }[] = [];
  private trailData = new Float32Array(36);
  private scale: number;
  private cover: number;
  private coverAnim: { from: number; to: number; start: number; dur: number } | null = null;
  private lost = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private opts: SmokeOptions,
  ) {
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: opts.variant !== "deep", premultipliedAlpha: true, powerPreference: "low-power" });
    if (!gl) throw new Error("WebGL2 unavailable");
    this.gl = gl;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    this.scale = coarse ? 0.3 : 0.45;
    this.cover = opts.cover ?? 0;

    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.bindAttribLocation(prog, 0, "aPos");
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || "link");
    this.prog = prog;
    gl.useProgram(prog);

    this.buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    for (const n of ["uTime", "uAspect", "uIntensity", "uCover", "uVariant", "uTrail", "uBg", "uDeep", "uMid", "uLight"])
      this.u[n] = gl.getUniformLocation(prog, n);

    const palette: Record<SmokeVariant, [string, string, string, string, number]> = {
      deep: ["#01130F", "#02211A", "#00614C", "#5CC9A7", 0],
      ivory: ["#F3EFE4", "#E8F7F1", "#5CC9A7", "#009473", 1],
      inlay: ["#01130F", "#01261E", "#00614C", "#5CC9A7", 2],
    };
    const [bg, dp, md, lt, v] = palette[opts.variant];
    gl.uniform3fv(this.u.uBg, hexToRgb(bg));
    gl.uniform3fv(this.u.uDeep, hexToRgb(dp));
    gl.uniform3fv(this.u.uMid, hexToRgb(md));
    gl.uniform3fv(this.u.uLight, hexToRgb(lt));
    gl.uniform1f(this.u.uVariant, v);

    canvas.addEventListener("webglcontextlost", this.onLost);
    this.resize();
  }

  private onLost = (e: Event) => {
    e.preventDefault();
    this.lost = true;
    this.stop();
  };

  resize() {
    const r = this.canvas.getBoundingClientRect();
    const w = Math.max(2, Math.round(r.width * this.scale));
    const h = Math.max(2, Math.round(r.height * this.scale));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.gl.viewport(0, 0, w, h);
    this.gl.uniform1f(this.u.uAspect, r.width / Math.max(1, r.height));
  }

  /** pointer in client coordinates */
  pointer(clientX: number, clientY: number) {
    if (!this.opts.interactive) return;
    const r = this.canvas.getBoundingClientRect();
    if (r.height === 0) return;
    const x = ((clientX - r.left) / r.width - 0.5) * (r.width / r.height);
    const y = 0.5 - (clientY - r.top) / r.height;
    const last = this.trail[this.trail.length - 1];
    const now = performance.now();
    if (last && Math.hypot(last.x - x, last.y - y) < 0.012 && now - last.t < 40) return;
    this.trail.push({ x, y, t: now });
    if (this.trail.length > 12) this.trail.shift();
  }

  /** animate the smoke cover away (used to continue the intro's transition) */
  reveal(duration = 1400) {
    this.coverAnim = { from: this.cover, to: 0, start: performance.now(), dur: duration };
  }

  freeze(time = 7.5) {
    this.frozenTime = time;
  }

  play() {
    if (this.running || this.lost) return;
    this.running = true;
    const tick = () => {
      if (!this.running) return;
      this.draw();
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  draw() {
    if (this.lost) return;
    const gl = this.gl;
    const now = performance.now();
    const t = this.frozenTime ?? (now - this.start) / 1000;
    if (this.coverAnim) {
      const k = Math.min(1, (now - this.coverAnim.start) / this.coverAnim.dur);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      this.cover = this.coverAnim.from + (this.coverAnim.to - this.coverAnim.from) * e;
      if (k >= 1) this.coverAnim = null;
    }
    this.trailData.fill(0);
    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      const age = (now - p.t) / 1400;
      if (age >= 1) continue;
      this.trailData[i * 3] = p.x;
      this.trailData[i * 3 + 1] = p.y;
      this.trailData[i * 3 + 2] = (1 - age) * (1 - age);
    }
    gl.useProgram(this.prog);
    gl.uniform1f(this.u.uTime, t);
    gl.uniform1f(this.u.uIntensity, this.opts.intensity);
    gl.uniform1f(this.u.uCover, this.cover);
    gl.uniform3fv(this.u.uTrail, this.trailData);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  dispose() {
    this.stop();
    this.canvas.removeEventListener("webglcontextlost", this.onLost);
    const gl = this.gl;
    gl.deleteBuffer(this.buf);
    gl.deleteProgram(this.prog);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
