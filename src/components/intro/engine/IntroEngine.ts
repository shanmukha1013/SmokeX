import * as THREE from "three";
import gsap from "gsap";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { GLYPHS, wordmarkLayout, type Contour, type GlyphId, type WordmarkLayout } from "@/lib/wordmark";
import { brand } from "@/lib/brand";
import { CUES, IMPACT_TIME } from "./cues";
import * as SH from "./shaders";

/** Where the wordmark must land, in CSS pixels relative to the viewport (the hero wordmark's box). */
export interface IntroFrame {
  cx: number;
  cy: number;
  width: number;
  stacked: boolean;
}

export interface IntroEngineOptions {
  container: HTMLElement;
  quality: "high" | "low";
  getFrame: () => IntroFrame;
  onTagline: () => void;
  onTransition: () => void;
  onComplete: () => void;
}

type LetterUniforms = {
  uGlow: { value: number };
  uGlowCol: { value: THREE.Color };
  uHotCol: { value: THREE.Color };
  uSweepX: { value: number };
  uSweepAmt: { value: number };
  uReveal: { value: number };
  uSeed: { value: number };
  uCut: { value: THREE.Vector4 };
  uCutO: { value: THREE.Vector2 };
  uHot: { value: number };
  uYRange: { value: THREE.Vector2 };
  uChrome: { value: THREE.Color[] };
};

interface Letter {
  id: GlyphId;
  mesh: THREE.Mesh;
  u: LetterUniforms;
  home: THREE.Vector3;
  scale: number;
}

interface Blade {
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  start: THREE.Vector3;
  end: THREE.Vector3;
  dir: THREE.Vector3;
  normal: THREE.Vector3;
  length: number;
}

const C = (hex: string, mul = 1) => new THREE.Color(hex).multiplyScalar(mul);

function contourToPath(c: Contour, path: THREE.Path) {
  for (const cmd of c) {
    switch (cmd[0]) {
      case "M":
        path.moveTo(cmd[1], -cmd[2]);
        break;
      case "L":
        path.lineTo(cmd[1], -cmd[2]);
        break;
      case "C":
        path.bezierCurveTo(cmd[1], -cmd[2], cmd[3], -cmd[4], cmd[5], -cmd[6]);
        break;
      case "Z":
        path.closePath();
        break;
    }
  }
}

function glyphShape(id: GlyphId) {
  const g = GLYPHS[id];
  const shape = new THREE.Shape();
  contourToPath(g.contours[0], shape);
  for (const hole of g.contours.slice(1)) {
    const p = new THREE.Path();
    contourToPath(hole, p);
    shape.holes.push(p);
  }
  return shape;
}

/** ─── GPU-light particle pool for sparks (CPU-simulated, one draw call) ─── */
class Sparks {
  readonly points: THREE.Points;
  private pos: Float32Array;
  private vel: Float32Array;
  private life: Float32Array;
  private max: Float32Array;
  private alpha: Float32Array;
  private size: Float32Array;
  private baseSize: Float32Array;
  private heat: Float32Array;
  private cursor = 0;
  private geo: THREE.BufferGeometry;

  constructor(
    private n: number,
    material: THREE.ShaderMaterial,
  ) {
    this.pos = new Float32Array(n * 3);
    this.vel = new Float32Array(n * 3);
    this.life = new Float32Array(n);
    this.max = new Float32Array(n).fill(1);
    this.alpha = new Float32Array(n);
    this.size = new Float32Array(n);
    this.baseSize = new Float32Array(n);
    this.heat = new Float32Array(n);
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute("aAlpha", new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute("aSize", new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute("aHeat", new THREE.BufferAttribute(this.heat, 1).setUsage(THREE.DynamicDrawUsage));
    this.points = new THREE.Points(this.geo, material);
    this.points.frustumCulled = false;
  }

  spawn(x: number, y: number, z: number, vx: number, vy: number, vz: number, life: number, size: number) {
    const i = this.cursor;
    this.cursor = (this.cursor + 1) % this.n;
    this.pos.set([x, y, z], i * 3);
    this.vel.set([vx, vy, vz], i * 3);
    this.life[i] = life;
    this.max[i] = life;
    this.baseSize[i] = size;
    this.heat[i] = 1;
  }

  burst(c: THREE.Vector3, count: number, speed: [number, number], life: [number, number], flat = 0.35) {
    for (let k = 0; k < count; k++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed[0] + Math.random() * (speed[1] - speed[0]);
      const z = (Math.random() * 2 - 1) * flat;
      this.spawn(
        c.x,
        c.y,
        c.z + 10,
        Math.cos(a) * s,
        Math.sin(a) * s,
        z * s,
        life[0] + Math.random() * (life[1] - life[0]),
        2.5 + Math.random() * 4.5,
      );
    }
  }

  update(dt: number) {
    const drag = Math.exp(-2.2 * dt);
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) {
        this.alpha[i] = 0;
        continue;
      }
      this.life[i] -= dt;
      const j = i * 3;
      this.vel[j] *= drag;
      this.vel[j + 1] = this.vel[j + 1] * drag - 140 * dt;
      this.vel[j + 2] *= drag;
      this.pos[j] += this.vel[j] * dt;
      this.pos[j + 1] += this.vel[j + 1] * dt;
      this.pos[j + 2] += this.vel[j + 2] * dt;
      const k = Math.max(0, this.life[i] / this.max[i]);
      this.alpha[i] = k * k;
      this.heat[i] = Math.min(1, k * 1.6);
      this.size[i] = this.baseSize[i] * (0.4 + 0.6 * k);
    }
    for (const name of ["position", "aAlpha", "aSize", "aHeat"]) this.geo.attributes[name].needsUpdate = true;
  }

  dispose() {
    this.geo.dispose();
  }
}

export class IntroEngine {
  private opts: IntroEngineOptions;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 1, 8000);
  private composer!: EffectComposer;
  private bloom!: UnrealBloomPass;
  private composite!: ShaderPass;
  private smokeRT!: THREE.WebGLRenderTarget;
  private smokeScene = new THREE.Scene();
  private smokeCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private smokeMat!: THREE.ShaderMaterial;
  private envRT: THREE.WebGLRenderTarget | null = null;
  private layout: WordmarkLayout;
  private letters = new Map<GlyphId, Letter>();
  private bladeA!: Blade;
  private bladeB!: Blade;
  private bladeK!: Blade;
  private ring!: THREE.Mesh;
  private ringMat!: THREE.ShaderMaterial;
  private embers!: THREE.Points;
  private emberMat!: THREE.ShaderMaterial;
  private sparks!: Sparks;
  private sparkMat!: THREE.ShaderMaterial;
  private edgeLight = new THREE.PointLight(brand.emerald[300], 0, 520, 0);
  private impactLight = new THREE.PointLight(brand.emerald[200], 0, 1400, 0);
  private keyLight = new THREE.DirectionalLight(brand.ivory[50], 1.3);
  private rest = new THREE.Vector3();
  private tl: gsap.core.Timeline | null = null;
  private exitTl: gsap.core.Timeline | null = null;
  private raf = 0;
  private last = 0;
  private time = 0;
  private disposed = false;
  private finished = false;
  private transitioning = false;
  private pr = 1;
  private smokeScale = 0.5;
  private perf = { frames: 0, acc: 0, downgraded: false };
  private _v = new THREE.Vector3();
  private _p = new THREE.Vector2();
  private smokeLights: { at: THREE.Vector3; r: number; key: "l0" | "l1" | "l2" | "l3" }[] = [];
  private swirlAt = new THREE.Vector3();
  private ringAt = new THREE.Vector3();
  private xCenter = new THREE.Vector3();

  /** Every animated value lives here; GSAP tweens it, the render loop reads it. */
  private st = {
    fade: 0,
    density: 0.2,
    bright: 0.55,
    front: 0,
    cover: 0,
    clear: 0,
    flash: 0,
    exposure: 1,
    ember: 0,
    camZ: 0.48,
    camY: -26,
    shake: 0,
    env: 0.85,
    sweepX: -9,
    sweepAmt: 0,
    swirlAmt: 0,
    swirlR: 0.2,
    ringR: 0,
    ringAmt: 0,
    ringMeshR: 0.05,
    ringMeshAmt: 0,
    burstR: 0,
    burstAmt: 0,
    aHead: 0,
    aPush: 0,
    aGlow: 0,
    aInt: 0,
    bHead: 0,
    bPush: 0,
    bGlow: 0,
    bInt: 0,
    kHead: 0,
    kInt: 0,
    edgeI: 0,
    impactI: 0,
    l0: 0,
    l1: 0,
    l2: 0,
    l3: 0,
  };

  constructor(opts: IntroEngineOptions) {
    this.opts = opts;
    const low = opts.quality === "low";
    this.pr = Math.min(window.devicePixelRatio || 1, low ? 1.5 : 2);
    this.smokeScale = low ? 0.34 : 0.5;

    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      premultipliedAlpha: true,
      powerPreference: "high-performance",
      stencil: false,
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.setPixelRatio(this.pr);
    const canvas = this.renderer.domElement;
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
    canvas.setAttribute("aria-hidden", "true");
    canvas.addEventListener("webglcontextlost", this.onContextLost, false);
    opts.container.appendChild(canvas);

    this.layout = wordmarkLayout(opts.getFrame().stacked);
  }

  // ─────────────────────────── setup ───────────────────────────

  async init() {
    const low = this.opts.quality === "low";
    this.buildEnvironment();
    this.buildSmoke(low);
    this.buildLetters();
    this.buildFx(low);
    this.buildPost(low);
    this.resize();
    window.addEventListener("resize", this.resize);
    document.addEventListener("visibilitychange", this.onVisibility);

    // compile every program up front so the first frames don't hitch
    try {
      await this.renderer.compileAsync(this.scene, this.camera);
    } catch {
      this.renderer.compile(this.scene, this.camera);
    }
    this.renderFrame(0);
  }

  private buildEnvironment() {
    // A tiny "studio" for reflections: ivory softboxes above, emerald strips at the sides,
    // and a chrome-horizon gradient in front — platinum metal with emerald reflections.
    const env = new THREE.Scene();
    const disposables: (THREE.BufferGeometry | THREE.Material)[] = [];
    const add = (geo: THREE.BufferGeometry, mat: THREE.Material, pos: [number, number, number], look = true) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(...pos);
      if (look) m.lookAt(0, 0, 0);
      env.add(m);
      disposables.push(geo, mat);
    };
    add(
      new THREE.BoxGeometry(200, 200, 200),
      new THREE.MeshBasicMaterial({ color: C(brand.emerald[990], 0.6), side: THREE.BackSide }),
      [0, 0, 0],
      false,
    );
    const grad = new THREE.PlaneGeometry(140, 90, 1, 8);
    const cols: number[] = [];
    const pos = grad.attributes.position;
    const top = C(brand.ivory[50], 1.35);
    const mid = C(brand.ivory[100], 1.05);
    const bot = C(brand.emerald[300], 0.9);
    for (let i = 0; i < pos.count; i++) {
      const y = (pos.getY(i) + 45) / 90;
      const c = y > 0.5 ? mid.clone().lerp(top, (y - 0.5) * 2) : bot.clone().lerp(mid, y * 2);
      cols.push(c.r, c.g, c.b);
    }
    grad.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    add(grad, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }), [0, 0, 60]);
    const panel = (w: number, h: number, col: THREE.Color, p: [number, number, number]) =>
      add(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide }), p);
    panel(90, 10, C(brand.ivory[50], 2.2), [0, 55, 10]);
    panel(12, 60, C(brand.emerald[300], 3.2), [-62, 0, 20]);
    panel(12, 60, C(brand.emerald[400], 2.6), [62, 0, 20]);
    panel(120, 30, C(brand.emerald[600], 1.2), [0, -60, 0]);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envRT = pmrem.fromScene(env, 0.035);
    pmrem.dispose();
    disposables.forEach((d) => d.dispose());
    this.scene.environment = this.envRT.texture;
  }

  private buildSmoke(low: boolean) {
    this.smokeRT = new THREE.WebGLRenderTarget(4, 4, {
      type: THREE.HalfFloatType,
      depthBuffer: false,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });
    const v4 = () => new THREE.Vector4();
    this.smokeMat = new THREE.ShaderMaterial({
      vertexShader: SH.FULLSCREEN_VERT,
      fragmentShader: SH.SMOKE_FRAG,
      defines: low ? { OCTAVES: 4 } : { OCTAVES: 5, SELF_SHADOW: "" },
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uAspect: { value: 1 },
        uDensity: { value: 0 },
        uBright: { value: 1 },
        uCam: { value: new THREE.Vector3() },
        uDeep: { value: C(brand.emerald[990], 1.2) },
        uMid: { value: C(brand.emerald[700], 0.55) },
        uLight: { value: C(brand.emerald[300], 1.1) },
        uHot: { value: C(brand.ivory[50], 1) },
        uLights: { value: [v4(), v4(), v4(), v4()] },
        uSlashA: { value: v4() },
        uSlashAP: { value: new THREE.Vector3() },
        uSlashB: { value: v4() },
        uSlashBP: { value: new THREE.Vector3() },
        uBurst: { value: v4() },
        uSwirl: { value: v4() },
        uSweep: { value: new THREE.Vector2() },
        uRing: { value: v4() },
      },
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.smokeMat);
    quad.frustumCulled = false;
    this.smokeScene.add(quad);
    this.scene.background = this.smokeRT.texture;
  }

  private makeLetterMaterial(): { m: THREE.MeshStandardMaterial; u: LetterUniforms } {
    const u: LetterUniforms = {
      uGlow: { value: 0 },
      uGlowCol: { value: C(brand.emerald[300], 1) },
      uHotCol: { value: C(brand.ivory[50], 1) },
      uSweepX: { value: -1e5 },
      uSweepAmt: { value: 0 },
      uReveal: { value: 0 },
      uSeed: { value: Math.random() * 50 },
      uCut: { value: new THREE.Vector4(0, 0, 0, 0) },
      uCutO: { value: new THREE.Vector2() },
      uHot: { value: 0 },
      uYRange: { value: new THREE.Vector2(0, 50) },
      uChrome: { value: ["#FBF9F3", "#E9E3D3", "#BFC9C0", "#5CC9A7", "#9FE0CA", "#E8F7F1"].map((h) => new THREE.Color(h)) },
    };
    const m = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#ffffff"),
      metalness: 1,
      roughness: 0.26,
      envMapIntensity: 1,
    });
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, u);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWPos;")
        .replace("#include <project_vertex>", "#include <project_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\n" + SH.LETTER_FRAG_HEAD)
        .replace("#include <clipping_planes_fragment>", "#include <clipping_planes_fragment>\n" + SH.LETTER_FRAG_CLIP)
        .replace("#include <color_fragment>", "#include <color_fragment>\n" + SH.LETTER_FRAG_COLOR)
        .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n" + SH.LETTER_FRAG_EMISSIVE);
    };
    m.customProgramCacheKey = () => "smx-letter-v2";
    return { m, u };
  }

  private buildLetters() {
    const L = this.layout;
    const depth = 16;
    for (const pg of L.glyphs) {
      const g = GLYPHS[pg.id];
      const geo = new THREE.ExtrudeGeometry(glyphShape(pg.id), {
        depth,
        bevelEnabled: true,
        bevelThickness: 3.2,
        bevelSize: 1.6,
        bevelSegments: 4,
        curveSegments: 14,
      });
      geo.translate(-g.width / 2, 50, -depth / 2);
      const { m, u } = this.makeLetterMaterial();
      const mesh = new THREE.Mesh(geo, m);
      mesh.scale.setScalar(pg.scale);
      const cx = pg.x + (g.width * pg.scale) / 2 - L.width / 2;
      const cy = -(pg.y + 50 * pg.scale) + L.height / 2;
      mesh.position.set(cx, cy, pg.id === "X2" ? 1.4 : 0);
      u.uYRange.value.set(cy, 50 * pg.scale);
      this.scene.add(mesh);
      this.letters.set(pg.id, { id: pg.id, mesh, u, home: mesh.position.clone(), scale: pg.scale });
    }
    const x1 = this.letter("X1");
    this.xCenter.set(x1.home.x, x1.home.y, 0);

    this.scene.add(this.keyLight);
    this.keyLight.position.set(-0.4, 1, 0.9);
    this.scene.add(this.edgeLight, this.impactLight);
    this.impactLight.position.set(this.xCenter.x, this.xCenter.y, 140);
  }

  private makeBlade(dir2d: THREE.Vector2, center: THREE.Vector3, length: number, height: number, z: number): Blade {
    const dir = new THREE.Vector3(dir2d.x, dir2d.y, 0).normalize();
    const mat = new THREE.ShaderMaterial({
      vertexShader: SH.STREAK_VERT,
      fragmentShader: SH.STREAK_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uHead: { value: 0 },
        uTail: { value: 0.09 },
        uIntensity: { value: 0 },
        uWidth: { value: 1 },
        uTime: { value: 0 },
        uCore: { value: C(brand.ivory[50], 1.6) },
        uGlow: { value: C(brand.emerald[300], 1.6) },
      },
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    mesh.scale.set(length, height, 1);
    mesh.rotation.z = Math.atan2(dir.y, dir.x);
    mesh.position.set(center.x, center.y, z);
    mesh.frustumCulled = false;
    this.scene.add(mesh);
    const start = center.clone().addScaledVector(dir, -length / 2);
    const end = center.clone().addScaledVector(dir, length / 2);
    start.z = end.z = z;
    return { mesh, mat, start, end, dir, normal: new THREE.Vector3(-dir.y, dir.x, 0), length };
  }

  private buildFx(low: boolean) {
    const L = this.layout;
    const span = L.width * 3.2;
    const xs = this.letter("X1").scale;
    // blade directions follow the X strokes exactly: "\" then "/"
    this.bladeA = this.makeBlade(new THREE.Vector2(70, -100), this.xCenter, span, 80 * xs, 16);
    this.bladeB = this.makeBlade(new THREE.Vector2(-70, -100), this.xCenter, span, 80 * xs, 17);
    const k = this.letter("K");
    this.bladeK = this.makeBlade(new THREE.Vector2(-30, -38), k.home, span * 0.8, 50 * k.scale, 18);
    this.bladeK.mat.uniforms.uTail.value = 0.06;

    for (const id of ["X1", "X2"] as const) {
      const b = id === "X1" ? this.bladeA : this.bladeB;
      const u = this.letter(id).u;
      u.uCut.value.set(b.dir.x, b.dir.y, -1e5, 1);
      u.uCutO.value.set(b.start.x, b.start.y);
      u.uReveal.value = 1;
    }

    // circular energy wave for O
    const o = this.letter("O");
    this.ringMat = new THREE.ShaderMaterial({
      vertexShader: SH.STREAK_VERT,
      fragmentShader: SH.RING_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uR: { value: 0.05 },
        uAmt: { value: 0 },
        uTime: { value: 0 },
        uCol: { value: C(brand.emerald[300], 1.8) },
        uHot: { value: C(brand.ivory[50], 1.5) },
      },
    });
    this.ring = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.ringMat);
    this.ring.scale.setScalar(320 * o.scale);
    this.ring.position.set(o.home.x, o.home.y, 22);
    this.scene.add(this.ring);
    this.ringAt.copy(o.home);

    // ambient embers
    const n = low ? 520 : 1500;
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    const size = new Float32Array(n);
    const range = L.width * 1.1;
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() * 2 - 1) * L.width * 1.25;
      pos[i * 3 + 1] = (Math.random() - 0.5) * range;
      pos[i * 3 + 2] = -700 + Math.random() * 950;
      seed[i] = Math.random();
      size[i] = 1.2 + Math.pow(Math.random(), 3) * 5;
    }
    const eg = new THREE.BufferGeometry();
    eg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    eg.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    eg.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    this.emberMat = new THREE.ShaderMaterial({
      vertexShader: SH.EMBER_VERT,
      fragmentShader: SH.EMBER_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPR: { value: this.pr },
        uAlpha: { value: 0 },
        uRange: { value: range },
        uCol: { value: C(brand.emerald[300], 1.2) },
        uHot: { value: C(brand.ivory[50], 1.4) },
      },
    });
    this.embers = new THREE.Points(eg, this.emberMat);
    this.embers.frustumCulled = false;
    this.scene.add(this.embers);

    this.sparkMat = new THREE.ShaderMaterial({
      vertexShader: SH.SPARK_VERT,
      fragmentShader: SH.SPARK_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uPR: { value: this.pr },
        uCol: { value: C(brand.emerald[300], 1.4) },
        uHot: { value: C(brand.ivory[50], 2) },
      },
    });
    this.sparks = new Sparks(low ? 600 : 1400, this.sparkMat);
    this.scene.add(this.sparks.points);

    this.smokeLights = [
      { at: new THREE.Vector3(), r: 0.16, key: "l0" },
      { at: this.xCenter.clone(), r: 0.22, key: "l1" },
      { at: this.ringAt.clone(), r: 0.18, key: "l2" },
      { at: this.letter("E").home.clone(), r: 0.16, key: "l3" },
    ];
  }

  private buildPost(low: boolean) {
    const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: low ? 0 : 4 });
    this.composer = new EffectComposer(this.renderer, rt);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.8, 0.55, 0.95);
    this.composer.addPass(this.bloom);
    this.composite = new ShaderPass(
      new THREE.ShaderMaterial({
        vertexShader: SH.FULLSCREEN_VERT,
        fragmentShader: SH.COMPOSITE_FRAG,
        uniforms: {
          tDiffuse: { value: null },
          tSmoke: { value: this.smokeRT.texture },
          uFront: { value: 0 },
          uCover: { value: 0 },
          uClear: { value: 0 },
          uFlash: { value: 0 },
          uFade: { value: 0 },
          uExposure: { value: 1 },
          uTime: { value: 0 },
          uGrain: { value: 0.035 },
          uRes: { value: new THREE.Vector2(1, 1) },
          uDeep: { value: C(brand.emerald[990], 1.2) },
          uMid: { value: C(brand.emerald[700], 0.55) },
          uLight: { value: C(brand.emerald[300], 1) },
          uHot: { value: C(brand.ivory[50], 1) },
        },
      }),
    );
    this.composer.addPass(this.composite);
  }

  private letter(id: GlyphId) {
    return this.letters.get(id)!;
  }

  // ─────────────────────────── framing ───────────────────────────

  private resize = () => {
    if (this.disposed) return;
    const el = this.opts.container;
    const w = Math.max(1, el.clientWidth);
    const h = Math.max(1, el.clientHeight);
    this.renderer.setPixelRatio(this.pr);
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(this.pr);
    this.composer.setSize(w, h);
    this.bloom.resolution.set((w * this.pr) / 2, (h * this.pr) / 2);
    this.smokeRT.setSize(Math.ceil(w * this.smokeScale), Math.ceil(h * this.smokeScale));
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.smokeMat.uniforms.uAspect.value = w / h;
    this.composite.uniforms.uRes.value.set(w * this.pr, h * this.pr);

    const f = this.opts.getFrame();
    const tanH = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const k = this.layout.width / Math.max(40, f.width); // world units per CSS px
    const D = (k * h) / (2 * tanH);
    this.rest.set(-(f.cx - w / 2) * k, (f.cy - h / 2) * k, D + 11);
  };

  private onVisibility = () => {
    if (!this.tl) return;
    if (document.hidden) this.tl.pause();
    else if (!this.finished) this.tl.resume();
  };

  private onContextLost = (e: Event) => {
    e.preventDefault();
    this.finish();
  };

  // ─────────────────────────── choreography ───────────────────────────

  play() {
    const st = this.st;
    const c = CUES;
    // never stretch time after a slow frame: the score runs on the audio clock, picture must keep up
    gsap.ticker.lagSmoothing(0);
    const tl = gsap.timeline({ onComplete: () => this.finish() });
    this.tl = tl;
    const S = this.letter("S");
    const M = this.letter("M");
    const O = this.letter("O");
    const K = this.letter("K");
    const E = this.letter("E");
    const X1 = this.letter("X1");
    const X2 = this.letter("X2");
    const all = [...this.letters.values()];
    const W = this.layout.width;

    // ── Scene 01 · darkness: particles wake, smoke gathers ──
    tl.to(st, { fade: 1, duration: 1.1, ease: "power2.out" }, 0)
      .to(st, { density: 1, duration: 2.2, ease: "power1.inOut" }, 0)
      .to(st, { bright: 1, duration: 2, ease: "power1.inOut" }, 0.25)
      .to(st, { ember: 1, duration: 1.6, ease: "power1.out" }, 0.2)
      .to(st, { front: 0.4, duration: 1.8 }, 0.4)
      .to(st, { camZ: 0.34, camY: -10, duration: c.S, ease: "power1.inOut" }, 0);

    // ── S · bass impact, emerges with a camera push-in, light runs its edges ──
    tl.call(() => this.smokeLights[0].at.copy(S.home), [], c.S - 0.1)
      .fromTo(S.mesh.position, { z: -720 }, { z: S.home.z, duration: 1.15, ease: "expo.out" }, c.S)
      .fromTo(S.u.uReveal, { value: 0 }, { value: 1, duration: 0.55, ease: "power2.out" }, c.S)
      .fromTo(S.u.uGlow, { value: 1.4 }, { value: 0.25, duration: 1.6, ease: "power2.out" }, c.S)
      .to(st, { camZ: 0.22, camY: 0, duration: 1.4, ease: "expo.out" }, c.S)
      .fromTo(st, { flash: 0.32 }, { flash: 0, duration: 0.7, ease: "power2.out", immediateRender: false }, c.S)
      .fromTo(st, { shake: 7 }, { shake: 0, duration: 0.6, ease: "power2.out", immediateRender: false }, c.S)
      .fromTo(st, { l0: 1.6 }, { l0: 0.25, duration: 1.4, ease: "power2.out", immediateRender: false }, c.S)
      .fromTo(
        S.u.uSweepX,
        { value: S.home.x - 90 },
        { value: S.home.x + 90, duration: 1.3, ease: "power2.inOut", immediateRender: false },
        c.S + 0.15,
      )
      .fromTo(S.u.uSweepAmt, { value: 1.4 }, { value: 0, duration: 1.4, ease: "power1.in", immediateRender: false }, c.S + 0.15)
      .fromTo(this.edgeLight.position, { x: S.home.x - 70, y: S.home.y + 70, z: 60 }, { x: S.home.x + 80, y: S.home.y - 60, z: 60, duration: 1.4, ease: "power2.inOut", immediateRender: false }, c.S + 0.1)
      .fromTo(st, { edgeI: 7 }, { edgeI: 0, duration: 1.5, ease: "power2.in", immediateRender: false }, c.S + 0.1);

    // ── M · smoke sweeps the frame, M slams in, particles scatter ──
    tl.fromTo(st, { sweepX: -1.4 }, { sweepX: 1.4, duration: 1.05, ease: "power2.inOut", immediateRender: false }, c.M - 0.45)
      .fromTo(st, { sweepAmt: 0 }, { sweepAmt: 1, duration: 0.45, yoyo: true, repeat: 1, ease: "sine.inOut", immediateRender: false }, c.M - 0.45)
      .fromTo(M.mesh.position, { x: M.home.x + 340, z: 280 }, { x: M.home.x, z: M.home.z, duration: 0.55, ease: "power4.out", immediateRender: false }, c.M)
      .fromTo(M.mesh.rotation, { y: -0.95 }, { y: 0, duration: 0.7, ease: "power4.out", immediateRender: false }, c.M)
      .fromTo(M.u.uReveal, { value: 0 }, { value: 1, duration: 0.25, ease: "power1.out", immediateRender: false }, c.M)
      .fromTo(M.u.uGlow, { value: 1.6 }, { value: 0.25, duration: 1.2, immediateRender: false }, c.M + 0.08)
      .call(() => {
        this.sparks.burst(M.home, this.opts.quality === "low" ? 70 : 160, [120, 520], [0.5, 1.2]);
        this.smokeLights[0].at.copy(M.home);
      }, [], c.M + 0.08)
      .fromTo(st, { l0: 1.4 }, { l0: 0.2, duration: 1, immediateRender: false }, c.M + 0.08)
      .fromTo(st, { shake: 9 }, { shake: 0, duration: 0.5, immediateRender: false }, c.M + 0.08)
      .fromTo(st, { flash: 0.22 }, { flash: 0, duration: 0.5, immediateRender: false }, c.M + 0.08)
      .to(st, { camZ: 0.18, duration: 1.2, ease: "power2.out" }, c.M + 0.08);

    // ── O · a circular energy wave forms the letter ──
    tl.fromTo(st, { ringMeshR: 0.05, ringMeshAmt: 0 }, { ringMeshR: 0.92, duration: 1.1, ease: "expo.out", immediateRender: false }, c.O)
      .fromTo(st, { ringMeshAmt: 2.4 }, { ringMeshAmt: 0, duration: 1.3, ease: "power2.in", immediateRender: false }, c.O)
      .fromTo(st, { ringR: 0 }, { ringR: 0.3, duration: 1.2, ease: "expo.out", immediateRender: false }, c.O)
      .fromTo(st, { ringAmt: 1.2 }, { ringAmt: 0, duration: 1.2, ease: "power2.in", immediateRender: false }, c.O)
      .call(() => this.swirlAt.copy(O.home), [], c.O - 0.3)
      .fromTo(st, { swirlAmt: 0, swirlR: 0.2 }, { swirlAmt: 1.3, duration: 0.7, ease: "power2.out", immediateRender: false }, c.O - 0.3)
      .to(st, { swirlAmt: 0, duration: 1.4, ease: "power2.inOut" }, c.O + 0.5)
      .fromTo(O.mesh.rotation, { y: Math.PI * 1.25 }, { y: 0, duration: 1.15, ease: "expo.out", immediateRender: false }, c.O)
      .fromTo(O.mesh.scale, { x: 0.25 * O.scale, y: 0.25 * O.scale, z: 0.25 * O.scale }, { x: O.scale, y: O.scale, z: O.scale, duration: 1.1, ease: "expo.out", immediateRender: false }, c.O)
      .fromTo(O.u.uReveal, { value: 0 }, { value: 1, duration: 0.6, ease: "power2.out", immediateRender: false }, c.O + 0.05)
      .fromTo(O.u.uGlow, { value: 1.8 }, { value: 0.25, duration: 1.5, immediateRender: false }, c.O)
      .fromTo(st, { l2: 1.5 }, { l2: 0.15, duration: 1.4, immediateRender: false }, c.O)
      .call(() => this.ringSparks(O.home, 320 * O.scale * 0.46), [], c.O + 0.12)
      .to(st, { camZ: 0.15, duration: 1.2, ease: "power2.out" }, c.O);

    // ── K · cuts through on a diagonal light streak ──
    const kOff = this.bladeK.dir.clone().multiplyScalar(-260);
    tl.fromTo(st, { kHead: 0, kInt: 1.3 }, { kHead: 1.12, duration: 0.36, ease: "power1.in", immediateRender: false }, c.K - 0.12)
      .to(st, { kInt: 0, duration: 0.6, ease: "power2.out" }, c.K + 0.26)
      .fromTo(K.mesh.position, { x: K.home.x + kOff.x, y: K.home.y + kOff.y, z: 120 }, { x: K.home.x, y: K.home.y, z: K.home.z, duration: 0.5, ease: "power4.out", immediateRender: false }, c.K)
      .fromTo(K.u.uReveal, { value: 0 }, { value: 1, duration: 0.22, immediateRender: false }, c.K)
      .fromTo(K.u.uSweepX, { value: K.home.x + 70 }, { value: K.home.x - 70, duration: 0.9, ease: "power2.out", immediateRender: false }, c.K + 0.05)
      .fromTo(K.u.uSweepAmt, { value: 1.6 }, { value: 0, duration: 1, ease: "power1.in", immediateRender: false }, c.K + 0.05)
      .fromTo(K.u.uGlow, { value: 1.4 }, { value: 0.25, duration: 1.2, immediateRender: false }, c.K + 0.1)
      .call(() => {
        this.lineSparks(this.bladeK, 0.42, 0.58, this.opts.quality === "low" ? 50 : 120);
        this.smokeLights[0].at.copy(K.home);
      }, [], c.K + 0.1)
      .fromTo(st, { l0: 1.2 }, { l0: 0.15, duration: 0.9, immediateRender: false }, c.K + 0.1)
      .fromTo(st, { shake: 6 }, { shake: 0, duration: 0.45, immediateRender: false }, c.K + 0.1);

    // ── E · emerges from swirling smoke; tension rises ──
    tl.call(() => this.swirlAt.copy(E.home), [], c.E - 0.35)
      // .to (not fromTo): the O's swirl is still settling when the E arrives — continue it, don't snap it
      .to(st, { swirlAmt: 1.7, swirlR: 0.17, duration: 1.0, ease: "sine.inOut" }, c.E - 0.3)
      .to(st, { swirlAmt: 0.25, duration: 0.8, ease: "sine.inOut" }, c.E + 0.75)
      .fromTo(E.u.uReveal, { value: 0 }, { value: 1, duration: 1.3, ease: "power1.inOut", immediateRender: false }, c.E)
      .fromTo(E.mesh.rotation, { z: 0.22 }, { z: 0, duration: 1.4, ease: "expo.out", immediateRender: false }, c.E)
      .fromTo(E.mesh.position, { z: -140 }, { z: E.home.z, duration: 1.4, ease: "expo.out", immediateRender: false }, c.E)
      .fromTo(E.u.uGlow, { value: 1.2 }, { value: 0.3, duration: 1.4, immediateRender: false }, c.E)
      .fromTo(st, { l3: 1.1 }, { l3: 0.3, duration: 1.3, immediateRender: false }, c.E)
      .to(st, { density: 1.15, bright: 1.1, camZ: 0.1, duration: c.quiet - c.E, ease: "power1.in" }, c.E);

    // ── Silence. A thin light appears upper-left. ──
    tl.to(st, { density: 0.7, bright: 0.4, ember: 0.3, front: 0.25, swirlAmt: 0, env: 0.5, l0: 0, l1: 0, l2: 0, l3: 0, duration: 0.25, ease: "power2.out" }, c.quiet)
      .to(all.map((l) => l.u.uGlow), { value: 0.04, duration: 0.3 }, c.quiet)
      .to(st, { camZ: 0.07, duration: c.slash1 - c.quiet, ease: "sine.inOut" }, c.quiet)
      .fromTo(st, { aInt: 0, aHead: 0 }, { aInt: 0.35, aHead: 0.05, duration: c.slash1 - c.glint, ease: "power1.in", immediateRender: false }, c.glint);

    // ── The two slashes ──
    const slash = (
      at: number,
      head: "aHead" | "bHead",
      push: "aPush" | "bPush",
      glow: "aGlow" | "bGlow",
      int: "aInt" | "bInt",
      fromHead: number,
    ) => {
      tl.fromTo(st, { [head]: fromHead, [int]: 1 }, { [head]: 1.12, duration: c.slashDur * 1.12, ease: "none", immediateRender: false }, at)
        .fromTo(st, { [push]: 0, [glow]: 0 }, { [push]: 1, [glow]: 1.2, duration: 0.12, immediateRender: false }, at)
        .to(st, { [glow]: 0, duration: 0.9, ease: "power2.out" }, at + c.slashDur)
        .to(st, { [push]: 0.3, duration: 1.4, ease: "power2.out" }, at + c.slashDur)
        .to(st, { [int]: 0, duration: 0.7, ease: "power2.out" }, at + c.slashDur + 0.05)
        .fromTo(st, { flash: 0.05 }, { flash: 0, duration: 0.3, immediateRender: false }, at + c.slashDur * 0.5)
        .fromTo(st, { shake: 6 }, { shake: 0, duration: 0.35, immediateRender: false }, at + c.slashDur * 0.5);
    };
    slash(c.slash1, "aHead", "aPush", "aGlow", "aInt", 0.05);
    tl.fromTo(X1.u.uHot, { value: 1 }, { value: 0.15, duration: 0.9, immediateRender: false }, c.slash1 + c.slashDur * 0.5);
    slash(c.slash2, "bHead", "bPush", "bGlow", "bInt", 0);

    // ── Intersection: the X is born ──
    const I = IMPACT_TIME;
    const xRingR = 320 * O.scale * 1.3;
    tl.call(() => {
      this.sparks.burst(this.xCenter, this.opts.quality === "low" ? 260 : 640, [180, 1050], [0.6, 1.9], 0.6);
      // the O's energy ring returns as the X's shockwave
      this.ring.position.set(this.xCenter.x, this.xCenter.y, this.xCenter.z + 24);
      this.ring.scale.setScalar(xRingR);
      this.ringSparks(this.xCenter, xRingR * 0.18);
    }, [], I)
      .fromTo(st, { ringMeshR: 0.04 }, { ringMeshR: 0.98, duration: 0.85, ease: "expo.out", immediateRender: false }, I)
      .fromTo(st, { ringMeshAmt: 1.1 }, { ringMeshAmt: 0, duration: 0.75, ease: "power2.out", immediateRender: false }, I)
      // camera punch: a hard push in on the hit, then it breathes back out before the lock-up
      .fromTo(st, { camZ: -0.05 }, { camZ: 0.06, duration: 0.7, ease: "expo.out", immediateRender: false }, I)
      .fromTo(st, { flash: 0.5 }, { flash: 0, duration: 0.4, ease: "power3.out", immediateRender: false }, I)
      .fromTo(st, { shake: 30 }, { shake: 0, duration: 0.9, ease: "power3.out", immediateRender: false }, I)
      .fromTo(st, { burstR: 0, burstAmt: 0.9 }, { burstR: 1.6, burstAmt: 0, duration: 1.5, ease: "power2.out", immediateRender: false }, I)
      .fromTo(st, { impactI: 40 }, { impactI: 0, duration: 1.4, ease: "power2.out", immediateRender: false }, I)
      .fromTo(st, { l1: 1.3 }, { l1: 0.2, duration: 1.4, ease: "power2.out", immediateRender: false }, I)
      .fromTo(st, { exposure: 1.2 }, { exposure: 1, duration: 0.9, ease: "power2.out", immediateRender: false }, I)
      .to(st, { density: 1.1, bright: 0.95, ember: 0.9, env: 1.1, front: 0.3, duration: 0.25, ease: "power2.out" }, I)
      .to(st, { density: 1, bright: 1, front: 0.18, duration: 1.6, ease: "power1.inOut" }, I + 0.3)
      .fromTo([X1.u.uHot, X2.u.uHot], { value: 1.2 }, { value: 0, duration: 1.7, ease: "power2.out", immediateRender: false }, I)
      .to([X1.u.uGlow, X2.u.uGlow], { value: 0.3, duration: 1.2 }, I);

    // ── Lock-up: the wordmark settles into its final composition ──
    tl.to(st, { camZ: 0, camY: 0, duration: 1.3, ease: "power3.inOut" }, c.lock)
      .to(all.map((l) => l.u.uGlow), { value: 0.12, duration: 1.2 }, c.lock)
      .fromTo(all.map((l) => l.u.uSweepX), { value: -W / 2 - 160 }, { value: W / 2 + 160, duration: 1.6, ease: "power2.inOut", immediateRender: false }, c.lock + 0.2)
      .fromTo(all.map((l) => l.u.uSweepAmt), { value: 0.75 }, { value: 0.45, duration: 1.6, immediateRender: false }, c.lock + 0.2)
      .to(all.map((l) => l.u.uSweepAmt), { value: 0, duration: 0.3 }, c.lock + 1.8)
      .call(() => this.opts.onTagline(), [], c.tagline);

    // ── Transition: smoke expands, the camera moves through it, then it clears ──
    tl.call(() => {
      this.transitioning = true;
      this.opts.onTransition();
    }, [], c.transition)
      .to(st, { density: 1.5, bright: 1.15, front: 1, duration: 1.1, ease: "power2.in" }, c.transition)
      .to(st, { cover: 1, duration: c.clear - c.transition, ease: "power2.in" }, c.transition)
      .to(st, { camZ: -0.55, camY: 10, duration: 1.4, ease: "power2.in" }, c.transition)
      .to(st, { ember: 0, duration: 0.8 }, c.transition + 0.4)
      .to(st, { clear: 1, duration: c.end - c.clear, ease: "power1.inOut" }, c.clear);

    this.last = performance.now();
    this.loop();
  }

  /** Skip: let the smoke swallow the frame quickly, then clear to the homepage. */
  skip() {
    if (this.finished || this.exitTl) return;
    this.tl?.kill();
    this.transitioning = true;
    const st = this.st;
    this.exitTl = gsap
      .timeline({ onComplete: () => this.finish() })
      .to(st, { cover: 1, front: 1, density: 1.4, duration: 0.45, ease: "power2.in" }, 0)
      .to(st, { flash: 0, shake: 0, duration: 0.2 }, 0)
      .to(st, { clear: 1, duration: 0.65, ease: "power1.inOut" }, 0.45);
    if (!this.raf) this.loop();
  }

  private ringSparks(c: THREE.Vector3, r: number) {
    const n = this.opts.quality === "low" ? 60 : 140;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const s = 80 + Math.random() * 260;
      this.sparks.spawn(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, c.z + 20, Math.cos(a) * s, Math.sin(a) * s, (Math.random() - 0.5) * 80, 0.5 + Math.random() * 0.8, 2 + Math.random() * 3);
    }
  }

  private lineSparks(b: Blade, from: number, to: number, n: number) {
    for (let i = 0; i < n; i++) {
      const t = from + Math.random() * (to - from);
      const p = b.start.clone().lerp(b.end, t);
      const side = Math.random() < 0.5 ? -1 : 1;
      const s = 80 + Math.random() * 420;
      const along = 100 + Math.random() * 500;
      this.sparks.spawn(p.x, p.y, p.z, b.normal.x * s * side + b.dir.x * along, b.normal.y * s * side + b.dir.y * along, (Math.random() - 0.5) * 120, 0.35 + Math.random() * 0.8, 2 + Math.random() * 3.5);
    }
  }

  // ─────────────────────────── frame loop ───────────────────────────

  private loop = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.renderFrame(dt);
    this.adapt(dt);
  };

  private adapt(dt: number) {
    if (this.perf.downgraded || this.time < 1.2) return;
    this.perf.frames++;
    this.perf.acc += dt;
    if (this.perf.frames < 75) return;
    const avg = this.perf.acc / this.perf.frames;
    this.perf.frames = 0;
    this.perf.acc = 0;
    if (avg > 0.026) {
      this.perf.downgraded = true;
      this.pr = Math.min(this.pr, 1);
      this.smokeScale = Math.min(this.smokeScale, 0.33);
      this.emberMat.uniforms.uPR.value = this.pr;
      this.sparkMat.uniforms.uPR.value = this.pr;
      this.resize();
    }
  }

  private toP(v: THREE.Vector3, out: THREE.Vector2) {
    this._v.copy(v).project(this.camera);
    return out.set(this._v.x * 0.5 * this.camera.aspect, this._v.y * 0.5);
  }

  private renderFrame(dt: number) {
    const st = this.st;
    this.time += dt;
    const t = this.time;

    // camera: rest framing + choreographed offsets + controlled shake
    const D = this.rest.z;
    const sh = st.shake;
    this.camera.position.set(
      this.rest.x + (Math.sin(t * 67.3) + Math.sin(t * 41.9 + 1.3)) * 0.5 * sh,
      this.rest.y + st.camY + (Math.sin(t * 59.1 + 0.7) + Math.sin(t * 37.3 + 2.1)) * 0.5 * sh,
      this.rest.z + st.camZ * D,
    );
    this.camera.rotation.set(0, 0, Math.sin(t * 47.0) * sh * 0.0007);
    this.camera.updateMatrixWorld();

    // smoke uniforms
    const su = this.smokeMat.uniforms;
    su.uTime.value = t;
    su.uDensity.value = st.density;
    su.uBright.value = st.bright;
    su.uCam.value.set((this.camera.position.x - this.rest.x) / this.layout.width, (this.camera.position.y - this.rest.y) / this.layout.width, Math.max(-0.6, -st.camZ * 0.55));
    const lights = su.uLights.value as THREE.Vector4[];
    this.smokeLights.forEach((L, i) => {
      this.toP(L.at, this._p);
      lights[i].set(this._p.x, this._p.y, L.r, st[L.key]);
    });
    const setSlash = (b: Blade, uL: THREE.Vector4, uP: THREE.Vector3, head: number, push: number, glow: number) => {
      const a = this.toP(b.start, this._p).clone();
      const e = this.toP(b.end, this._p);
      uL.set(a.x, a.y, e.x, e.y);
      uP.set(head, push, glow);
    };
    setSlash(this.bladeA, su.uSlashA.value, su.uSlashAP.value, st.aHead, st.aPush, st.aGlow);
    setSlash(this.bladeB, su.uSlashB.value, su.uSlashBP.value, st.bHead, st.bPush, st.bGlow);
    this.toP(this.xCenter, this._p);
    su.uBurst.value.set(this._p.x, this._p.y, st.burstR, st.burstAmt);
    this.toP(this.swirlAt, this._p);
    su.uSwirl.value.set(this._p.x, this._p.y, st.swirlR, st.swirlAmt);
    su.uSweep.value.set(st.sweepX * this.camera.aspect * 0.5, st.sweepAmt);
    this.toP(this.ringAt, this._p);
    su.uRing.value.set(this._p.x, this._p.y, st.ringR, st.ringAmt);

    // blades: streak heads + the X strokes they forge
    const blade = (b: Blade, head: number, int: number, letter?: Letter) => {
      b.mat.uniforms.uHead.value = head;
      b.mat.uniforms.uIntensity.value = int;
      b.mat.uniforms.uTime.value = t;
      if (letter) letter.u.uCut.value.z = head > 0.051 ? head * b.length : -1e5;
      if (head > 0.06 && head < 1.05 && int > 0.5 && dt > 0) {
        const p = b.start.clone().lerp(b.end, head);
        const n = this.opts.quality === "low" ? 3 : 7;
        for (let i = 0; i < n; i++) {
          const side = Math.random() < 0.5 ? -1 : 1;
          const s = 60 + Math.random() * 360;
          const back = -(80 + Math.random() * 300);
          this.sparks.spawn(p.x, p.y, p.z, b.normal.x * s * side + b.dir.x * back, b.normal.y * s * side + b.dir.y * back, (Math.random() - 0.5) * 100, 0.3 + Math.random() * 0.7, 2 + Math.random() * 3);
        }
      }
    };
    blade(this.bladeA, st.aHead, st.aInt, this.letter("X1"));
    blade(this.bladeB, st.bHead, st.bInt, this.letter("X2"));
    blade(this.bladeK, st.kHead, st.kInt);
    if (st.aHead > 1.1) this.letter("X1").u.uCut.value.z = 1e5;
    if (st.bHead > 1.1) this.letter("X2").u.uCut.value.z = 1e5;

    this.ringMat.uniforms.uR.value = st.ringMeshR;
    this.ringMat.uniforms.uAmt.value = st.ringMeshAmt;
    this.ringMat.uniforms.uTime.value = t;
    this.ring.visible = st.ringMeshAmt > 0.001;

    this.emberMat.uniforms.uTime.value = t;
    this.emberMat.uniforms.uAlpha.value = st.ember;
    this.sparks.update(dt);

    this.edgeLight.intensity = st.edgeI;
    this.impactLight.intensity = st.impactI;
    this.scene.environmentIntensity = st.env;

    const cu = this.composite.uniforms;
    cu.uFront.value = st.front;
    cu.uCover.value = st.cover;
    cu.uClear.value = st.clear;
    cu.uFlash.value = st.flash;
    cu.uFade.value = st.fade;
    cu.uExposure.value = st.exposure;
    cu.uTime.value = t;

    this.renderer.setRenderTarget(this.smokeRT);
    this.renderer.render(this.smokeScene, this.smokeCam);
    this.renderer.setRenderTarget(null);
    this.composer.render(dt);
  }

  private finish() {
    if (this.finished) return;
    this.finished = true;
    this.opts.onComplete();
  }

  get isTransitioning() {
    return this.transitioning;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.tl?.kill();
    this.exitTl?.kill();
    gsap.ticker.lagSmoothing(500, 33);
    window.removeEventListener("resize", this.resize);
    document.removeEventListener("visibilitychange", this.onVisibility);
    const canvas = this.renderer.domElement;
    canvas.removeEventListener("webglcontextlost", this.onContextLost);

    const disposeObj = (o: THREE.Object3D) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose();
    };
    this.scene.traverse(disposeObj);
    this.smokeScene.traverse(disposeObj);
    this.sparks?.dispose();
    this.smokeRT?.dispose();
    this.envRT?.dispose();
    this.bloom?.dispose();
    this.composer?.dispose();
    this.scene.background = null;
    this.scene.environment = null;
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    canvas.remove();
  }
}

/** Feature test used before loading the engine. */
export function canRunIntro(): boolean {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    if (!gl) return false;
    const ok = !!gl.getExtension("EXT_color_buffer_float") || !!gl.getExtension("EXT_color_buffer_half_float");
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return ok;
  } catch {
    return false;
  }
}
