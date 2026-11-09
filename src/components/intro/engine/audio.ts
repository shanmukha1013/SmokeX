/**
 * IntroAudio — original sound design, synthesised live with the Web Audio API.
 * No recorded or licensed audio is used: every impact, whoosh, blade ring and
 * orchestral swell is generated from oscillators and noise, scheduled sample-accurately
 * against the same cue sheet that drives the visual timeline.
 */
import { CUES, IMPACT_TIME } from "./cues";

type Pan = [from: number, to: number];

export class IntroAudio {
  readonly ctx: AudioContext;
  private master: GainNode;
  private bus: GainNode;
  private verbSend: GainNode;
  private noiseBuf: AudioBuffer;
  private t0 = 0;
  private sources: AudioScheduledSourceNode[] = [];
  private droneGain: GainNode | null = null;
  private closed = false;
  muted = false;

  constructor() {
    const AC: typeof AudioContext =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AC({ latencyHint: "interactive" });
    const ctx = this.ctx;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.knee.value = 8;
    comp.ratio.value = 4;
    comp.attack.value = 0.003;
    comp.release.value = 0.25;

    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(comp).connect(ctx.destination);

    this.bus = ctx.createGain();
    this.bus.connect(this.master);

    const verb = ctx.createConvolver();
    verb.buffer = this.impulse(3.4, 3);
    this.verbSend = ctx.createGain();
    this.verbSend.gain.value = 0.42;
    this.verbSend.connect(verb).connect(this.master);

    this.noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  /** Must be called from a user gesture. */
  unlock() {
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  suspend() {
    if (!this.closed && this.ctx.state === "running") void this.ctx.suspend();
  }
  resume() {
    if (!this.closed && this.ctx.state === "suspended") void this.ctx.resume();
  }

  setMuted(m: boolean) {
    this.muted = m;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(m ? 0 : 0.9, now, 0.08);
  }

  fadeOut(seconds = 0.6) {
    if (this.closed) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0, now + seconds);
  }

  async close() {
    if (this.closed) return;
    this.closed = true;
    for (const s of this.sources) {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    }
    this.sources = [];
    try {
      await this.ctx.close();
    } catch {
      /* ignore */
    }
  }

  /** Schedule the full score relative to "now + lead". */
  playScore(lead = 0.06) {
    this.t0 = this.ctx.currentTime + lead;
    const C = CUES;

    this.drone();
    this.whoosh(C.S - 0.55, 0.7, [0, 0], 220, 1400, 0.35);
    this.impact(C.S, 1.1);
    this.metalRing(C.S + 0.05, [196, 392.5, 587, 911], 0.05, 2.4, 0);

    this.whoosh(C.M - 0.35, 0.65, [-0.9, 0.7], 300, 2600, 0.55);
    this.impact(C.M + 0.08, 0.9);

    this.energyWave(C.O);

    this.blade(C.K - 0.05, [0.7, -0.4], 0.55);
    this.impact(C.K + 0.12, 0.65);

    this.whoosh(C.E - 0.2, 1.3, [-0.3, 0.3], 160, 900, 0.32);
    this.riser(C.E, C.quiet - C.E);
    const span = C.quiet - C.E;
    for (const [f, s] of [
      [0.04, 0.32],
      [0.46, 0.36],
      [0.77, 0.4],
      [0.92, 0.45],
    ] as const)
      this.impact(C.E + span * f, s);

    this.glint(C.glint, C.slash1 - C.glint);
    this.blade(C.slash1 - 0.06, [-0.85, 0.85], 1);
    this.blade(C.slash2 - 0.06, [0.85, -0.85], 1);
    this.finalHit(IMPACT_TIME);

    this.shimmer(C.tagline);
    this.whoosh(C.transition, 1.9, [0, 0], 140, 2200, 0.5);
  }

  // ───────────────────────── building blocks ─────────────────────────

  private at(t: number) {
    return this.t0 + Math.max(0, t);
  }

  private impulse(seconds: number, decay: number) {
    const rate = this.ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = this.ctx.createBuffer(2, len, rate);
    for (let c = 0; c < 2; c++) {
      const ch = buf.getChannelData(c);
      for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  private track<T extends AudioScheduledSourceNode>(n: T) {
    this.sources.push(n);
    n.onended = () => {
      const i = this.sources.indexOf(n);
      if (i >= 0) this.sources.splice(i, 1);
    };
    return n;
  }

  private noiseSrc(start: number, dur: number, loop = false) {
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    s.loop = loop;
    s.start(start, Math.random() * 1.5);
    s.stop(start + dur + 0.05);
    return this.track(s);
  }

  private osc(type: OscillatorType, freq: number, start: number, dur: number, detune = 0) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, start);
    o.detune.value = detune;
    o.start(start);
    o.stop(start + dur + 0.05);
    return this.track(o);
  }

  private env(start: number, peak: number, attack: number, decay: number) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), start + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, start + attack + decay);
    return g;
  }

  private out(node: AudioNode, verb = 0.3, pan?: Pan, start = 0, dur = 0) {
    let last: AudioNode = node;
    if (pan) {
      const p = this.ctx.createStereoPanner();
      p.pan.setValueAtTime(pan[0], start);
      p.pan.linearRampToValueAtTime(pan[1], start + Math.max(dur, 0.01));
      last.connect(p);
      last = p;
    }
    last.connect(this.bus);
    if (verb > 0) {
      const s = this.ctx.createGain();
      s.gain.value = verb;
      last.connect(s).connect(this.verbSend);
    }
  }

  // ───────────────────────── instruments ─────────────────────────

  private drone() {
    const ctx = this.ctx;
    const C = CUES;
    const start = this.at(0);
    const end = this.at(C.end + 0.5);
    const dur = end - start;

    const g = ctx.createGain();
    this.droneGain = g;
    const pts: [number, number][] = [
      [0, 0.0001],
      [C.S + 0.4, 0.5],
      [C.E, 0.55],
      [C.quiet - 0.02, 0.5],
      [C.quiet + 0.12, 0.05],
      [IMPACT_TIME - 0.01, 0.05],
      [IMPACT_TIME + 0.3, 0.42],
      [C.transition, 0.36],
      [C.end, 0.0001],
    ];
    g.gain.setValueAtTime(pts[0][1], this.at(pts[0][0]));
    for (let i = 1; i < pts.length; i++) g.gain.exponentialRampToValueAtTime(pts[i][1], this.at(pts[i][0]));

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 150;
    lp.Q.value = 0.8;
    lp.connect(g);

    for (const [type, f, gain, det] of [
      ["sine", 36.71, 0.9, 0],
      ["sine", 55, 0.45, 3],
      ["sawtooth", 73.42, 0.16, -5],
      ["sawtooth", 73.42, 0.16, 6],
    ] as const) {
      const o = this.osc(type, f, start, dur, det);
      const og = ctx.createGain();
      og.gain.value = gain;
      o.connect(og).connect(lp);
    }

    // airy wind layer
    const wind = this.noiseSrc(start, dur, true);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 420;
    bp.Q.value = 0.6;
    const lfo = this.osc("sine", 0.09, start, dur);
    const lfoAmt = ctx.createGain();
    lfoAmt.gain.value = 220;
    lfo.connect(lfoAmt).connect(bp.frequency);
    const wg = ctx.createGain();
    wg.gain.value = 0.16;
    wind.connect(bp).connect(wg).connect(g);

    this.out(g, 0.25);
  }

  impact(t: number, size = 1) {
    const ctx = this.ctx;
    const s = this.at(t);

    const sub = this.osc("sine", 110 * Math.min(1.2, 0.85 + size * 0.15), s, 2.4);
    sub.frequency.exponentialRampToValueAtTime(31, s + 0.55);
    const sg = this.env(s, 0.95 * size, 0.004, 1.9 * size);
    sub.connect(sg);
    this.out(sg, 0.12);

    const thump = this.noiseSrc(s, 0.6);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(1400, s);
    lp.frequency.exponentialRampToValueAtTime(180, s + 0.35);
    const tg = this.env(s, 0.7 * size, 0.003, 0.32);
    thump.connect(lp).connect(tg);
    this.out(tg, 0.45);

    const crack = this.noiseSrc(s, 0.12);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 2800;
    const cg = this.env(s, 0.22 * size, 0.001, 0.07);
    crack.connect(hp).connect(cg);
    this.out(cg, 0.5);
  }

  private whoosh(t: number, dur: number, pan: Pan, f0: number, f1: number, peak: number) {
    const ctx = this.ctx;
    const s = this.at(t);
    const n = this.noiseSrc(s, dur);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.3;
    bp.frequency.setValueAtTime(f0, s);
    bp.frequency.exponentialRampToValueAtTime(f1, s + dur * 0.65);
    bp.frequency.exponentialRampToValueAtTime(f0 * 1.4, s + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, s);
    g.gain.exponentialRampToValueAtTime(peak, s + dur * 0.62);
    g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
    n.connect(bp).connect(g);
    this.out(g, 0.35, pan, s, dur);
  }

  private metalRing(t: number, partials: number[], gain: number, decay: number, pan: number) {
    const s = this.at(t);
    const sum = this.ctx.createGain();
    partials.forEach((f, i) => {
      const o = this.osc("sine", f, s, decay + 0.2, (Math.random() - 0.5) * 8);
      const g = this.env(s, gain / (1 + i * 0.35), 0.004, decay * (1 - i * 0.12));
      o.connect(g).connect(sum);
    });
    this.out(sum, 0.7, [pan, pan], s, decay);
  }

  private energyWave(t: number) {
    const ctx = this.ctx;
    const s = this.at(t);
    const o = this.osc("sine", 140, s, 1.6);
    o.frequency.exponentialRampToValueAtTime(520, s + 0.5);
    o.frequency.exponentialRampToValueAtTime(260, s + 1.4);
    const g = this.env(s, 0.18, 0.06, 1.3);
    o.connect(g);
    this.out(g, 0.6);

    const hum = this.osc("sawtooth", 82.4, s, 1.4);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(200, s);
    lp.frequency.exponentialRampToValueAtTime(1600, s + 0.4);
    lp.frequency.exponentialRampToValueAtTime(220, s + 1.3);
    const hg = this.env(s, 0.12, 0.05, 1.2);
    hum.connect(lp).connect(hg);
    this.out(hg, 0.4);

    this.metalRing(t + 0.05, [523, 1231, 1987, 2840], 0.045, 2, 0);
    this.impact(t + 0.02, 0.55);
  }

  /** the metallic cutting sound: air tear + steel shing + inharmonic ring */
  private blade(t: number, pan: Pan, size: number) {
    const ctx = this.ctx;
    const s = this.at(t);

    const air = this.noiseSrc(s - 0.08, 0.35);
    const abp = ctx.createBiquadFilter();
    abp.type = "bandpass";
    abp.Q.value = 2;
    abp.frequency.setValueAtTime(700, s - 0.08);
    abp.frequency.exponentialRampToValueAtTime(7200, s + 0.06);
    const ag = ctx.createGain();
    ag.gain.setValueAtTime(0.0001, s - 0.08);
    ag.gain.exponentialRampToValueAtTime(0.55 * size, s + 0.04);
    ag.gain.exponentialRampToValueAtTime(0.0001, s + 0.25);
    air.connect(abp).connect(ag);
    this.out(ag, 0.3, pan, s - 0.08, 0.3);

    const shing = this.noiseSrc(s, 0.8);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 3800;
    const pk = ctx.createBiquadFilter();
    pk.type = "peaking";
    pk.frequency.value = 7400;
    pk.Q.value = 4;
    pk.gain.value = 12;
    const sg = this.env(s + 0.02, 0.28 * size, 0.006, 0.5);
    shing.connect(hp).connect(pk).connect(sg);
    this.out(sg, 0.55, pan, s, 0.4);

    this.metalRing(t + 0.02, [1843, 2961, 4410, 5873, 7690], 0.07 * size, 1.9, pan[1] * 0.6);

    const low = this.osc("sine", 90, s + 0.03, 0.5);
    low.frequency.exponentialRampToValueAtTime(38, s + 0.35);
    const lg = this.env(s + 0.03, 0.4 * size, 0.004, 0.35);
    low.connect(lg);
    this.out(lg, 0.1);
  }

  /** orchestral tension: detuned string cluster, opening filter, accelerating tremolo, hard stop */
  private riser(t: number, dur: number) {
    const ctx = this.ctx;
    const s = this.at(t);
    const e = s + dur;

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.Q.value = 1.2;
    lp.frequency.setValueAtTime(320, s);
    lp.frequency.exponentialRampToValueAtTime(4200, e);

    const trem = ctx.createGain();
    trem.gain.value = 0.6;
    const lfo = this.osc("sine", 6, s, dur);
    lfo.frequency.linearRampToValueAtTime(15, e);
    const depth = ctx.createGain();
    depth.gain.value = 0.4;
    lfo.connect(depth).connect(trem.gain);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, s);
    g.gain.exponentialRampToValueAtTime(0.05, s + dur * 0.4);
    g.gain.exponentialRampToValueAtTime(0.22, e - 0.03);
    g.gain.linearRampToValueAtTime(0.0001, e + 0.02); // sudden silence

    for (const f of [146.83, 174.61, 220, 277.18, 293.66, 440]) {
      for (const det of [-7, 6]) {
        const o = this.osc("sawtooth", f, s, dur + 0.1, det);
        o.detune.linearRampToValueAtTime(det + 90, e);
        o.connect(lp);
      }
    }
    lp.connect(trem).connect(g);
    this.out(g, 0.4);
  }

  private glint(t: number, dur: number) {
    const s = this.at(t);
    const o = this.osc("sine", 2637, s, dur + 0.1);
    o.frequency.exponentialRampToValueAtTime(3520, s + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, s);
    g.gain.exponentialRampToValueAtTime(0.03, s + dur * 0.9);
    g.gain.linearRampToValueAtTime(0.0001, s + dur + 0.02);
    o.connect(g);
    this.out(g, 0.6, [-0.7, -0.5], s, dur);
  }

  private finalHit(t: number) {
    const ctx = this.ctx;
    const s = this.at(t);
    this.impact(t, 1.5);

    const boom = this.osc("sine", 48, s, 4.5);
    boom.frequency.exponentialRampToValueAtTime(34, s + 2.5);
    const bg = this.env(s, 0.6, 0.01, 4);
    boom.connect(bg);
    this.out(bg, 0.2);

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(3000, s);
    lp.frequency.exponentialRampToValueAtTime(380, s + 2.8);
    const cg = this.env(s, 0.2, 0.012, 3.6);
    for (const f of [73.42, 110, 146.83, 174.61, 220, 293.66]) {
      for (const det of [-9, 8]) this.osc("sawtooth", f, s, 4, det).connect(lp);
    }
    lp.connect(cg);
    this.out(cg, 0.55);

    this.metalRing(t, [1046, 1568, 2349, 3136], 0.05, 3.2, 0);
  }

  private shimmer(t: number) {
    [1318.5, 1975.5, 2637].forEach((f, i) => {
      const s = this.at(t + i * 0.18);
      const o = this.osc("sine", f, s, 3.2);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(0.03, s + 0.35);
      g.gain.exponentialRampToValueAtTime(0.0001, s + 3);
      o.connect(g);
      this.out(g, 0.8, [-0.4 + i * 0.4, -0.4 + i * 0.4], s, 3);
    });
  }
}
