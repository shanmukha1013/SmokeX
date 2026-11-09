"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { IntroEngine, IntroFrame } from "./engine/IntroEngine";
import { IntroAudio } from "./engine/audio";
import { CUES } from "./engine/cues";
import { FallbackIntro } from "./FallbackIntro";

type Phase = "gate" | "playing" | "leaving";

const SOUND_KEY = "smx-sound";

/** Locate the hero wordmark so the intro can land on exactly the same composition. */
function measureFrame(): IntroFrame {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-hero-wordmark]"));
  const el = nodes.find((n) => n.getBoundingClientRect().width > 0);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (!el) {
    const stacked = vw < 640;
    return { cx: vw / 2, cy: vh * 0.45, width: stacked ? vw * 0.8 : Math.min(vw * 0.72, 1100), stacked };
  }
  const r = el.getBoundingClientRect();
  return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, width: r.width, stacked: el.dataset.stacked === "true" };
}

function measureTagline() {
  const el = document.querySelector<HTMLElement>("[data-hero-tagline]");
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0) return null;
  return { top: r.top, left: r.left, width: r.width, className: el.className };
}

export default function IntroOverlay({ onDone }: { onDone: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<IntroEngine | null>(null);
  const audioRef = useRef<IntroAudio | null>(null);
  const [audio, setAudio] = useState<IntroAudio | null>(null);
  const doneRef = useRef(false);
  const [phase, setPhase] = useState<Phase>("gate");
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"webgl" | "fallback" | null>(null);
  const [taglineOn, setTaglineOn] = useState(false);
  const [lifted, setLifted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [tagline, setTagline] = useState<ReturnType<typeof measureTagline>>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setPhase("leaving");
    audioRef.current?.fadeOut(0.5);
    window.setTimeout(() => onDone(), 380);
  }, [onDone]);

  // lock the page at the top while the intro owns the screen
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.getElementById("smx-intro-cover")?.setAttribute("data-handoff", "true");
  }, []);

  // prepare the engine behind the gate
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mod = await import("./engine/IntroEngine");
      if (cancelled) return;
      if (!mod.canRunIntro()) {
        setMode("fallback");
        setReady(true);
        return;
      }
      const host = hostRef.current;
      if (!host) return;
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const small = Math.min(window.innerWidth, window.innerHeight) < 600;
      const engine = new mod.IntroEngine({
        container: host,
        quality: coarse || small || (navigator.hardwareConcurrency || 8) <= 4 ? "low" : "high",
        getFrame: measureFrame,
        onTagline: () => {
          setTagline(measureTagline());
          setTaglineOn(true);
        },
        onTransition: () => {
          setTaglineOn(false);
          setLifted(true);
        },
        onComplete: finish,
      });
      engineRef.current = engine;
      try {
        await engine.init();
        if (cancelled) {
          engine.dispose();
          return;
        }
        setMode("webgl");
        setReady(true);
      } catch (err) {
        console.warn("[SMOKE X] intro fell back to SVG:", err);
        engine.dispose();
        engineRef.current = null;
        if (!cancelled) {
          setMode("fallback");
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      engineRef.current?.dispose();
      engineRef.current = null;
      void audioRef.current?.close();
      audioRef.current = null;
    };
  }, [finish]);

  useEffect(() => {
    if (ready && phase === "gate") primaryRef.current?.focus({ preventScroll: true });
  }, [ready, phase]);

  const start = useCallback(
    (withSound: boolean) => {
      if (phase !== "gate") return;
      try {
        localStorage.setItem(SOUND_KEY, withSound ? "on" : "off");
      } catch {
        /* ignore */
      }
      if (withSound) {
        try {
          // created synchronously inside the click so every browser allows playback
          const a = new IntroAudio();
          a.unlock();
          audioRef.current = a;
          setAudio(a);
        } catch {
          audioRef.current = null;
        }
      }
      setMuted(!withSound);
      setPhase("playing");
      setTagline(measureTagline());
      if (mode === "webgl" && engineRef.current) {
        engineRef.current.play();
        audioRef.current?.playScore();
      }
    },
    [phase, mode],
  );

  const skip = useCallback(() => {
    if (phase === "gate") {
      finish();
      return;
    }
    setTaglineOn(false);
    setLifted(true);
    audioRef.current?.fadeOut(0.5);
    if (engineRef.current) engineRef.current.skip();
    else finish();
  }, [phase, finish]);

  const toggleMute = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    const next = !muted;
    a.setMuted(next);
    setMuted(next);
  }, [muted]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [skip]);

  useEffect(() => {
    const onVis = () => {
      const a = audioRef.current;
      if (!a) return;
      if (document.hidden) a.suspend();
      else a.resume();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const playing = phase !== "gate";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="SMOKE X cinematic introduction"
      className={`fixed inset-0 z-[100] transition-opacity duration-500 ${phase === "leaving" ? "pointer-events-none opacity-0" : "opacity-100"}`}
      style={{ background: playing && mode === "webgl" ? "transparent" : "var(--color-emerald-990)" }}
    >
      <div ref={hostRef} className="absolute inset-0" />

      {mode === "fallback" && playing && (
        <FallbackIntro
          audio={audio}
          getFrame={measureFrame}
          onTagline={() => {
            setTagline(measureTagline());
            setTaglineOn(true);
          }}
          onTransition={() => {
            setTaglineOn(false);
            setLifted(true);
          }}
          onComplete={finish}
        />
      )}

      {/* cinematic letterbox */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[7vh] origin-top bg-emerald-990 transition-transform duration-[1400ms] ease-[var(--ease-cine)]"
        style={{ transform: playing && !lifted ? "scaleY(1)" : "scaleY(0)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[7vh] origin-bottom bg-emerald-990 transition-transform duration-[1400ms] ease-[var(--ease-cine)]"
        style={{ transform: playing && !lifted ? "scaleY(1)" : "scaleY(0)" }}
      />

      {/* tagline — same element styling and position as the hero tagline it hands off to */}
      {tagline && (
        <p
          aria-hidden={!taglineOn}
          className={`${tagline.className} pointer-events-none !m-0 transition-[opacity,filter,transform] duration-[1200ms] ease-[var(--ease-cine)] ${
            taglineOn ? "opacity-100 blur-0" : "opacity-0 blur-sm"
          }`}
          style={{
            position: "absolute",
            top: tagline.top,
            left: tagline.left,
            width: tagline.width,
            transform: taglineOn ? "none" : "translateY(10px)",
          }}
        >
          <span className={`light-sweep ${taglineOn ? "is-on" : ""}`}>Turning ideas into products.</span>
        </p>
      )}

      {/* gate */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center px-6 text-center transition-opacity duration-700 ${
          playing ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <div aria-hidden className="absolute inset-0 grain" />
        <p className="eyebrow text-emerald-300/80">A personal technology ecosystem</p>
        <p className="mt-5 font-display text-3xl font-semibold tracking-[0.18em] text-ivory-100 sm:text-4xl">SMOKE X</p>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-ivory-300/80">
          A {Math.round(CUES.end)}-second cinematic title sequence. Best experienced with sound.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <button
            ref={primaryRef}
            type="button"
            disabled={!ready}
            onClick={() => start(true)}
            className="btn-smoke group inline-flex min-w-[15rem] items-center justify-center gap-3 rounded-full border border-emerald-400/60 bg-emerald-900/60 px-7 py-3.5 font-mono text-[0.78rem] uppercase tracking-[0.22em] text-ivory-50 transition-colors hover:border-emerald-300 disabled:cursor-wait disabled:opacity-50"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-vermilion-500" style={{ animation: "pulse-dot 1.6s ease-in-out infinite" }} />
            </span>
            {ready ? "Enter with sound" : "Preparing…"}
          </button>
          <button
            type="button"
            disabled={!ready}
            onClick={() => start(false)}
            className="rounded-full px-6 py-3.5 font-mono text-[0.72rem] uppercase tracking-[0.22em] text-ivory-300 transition-colors hover:text-ivory-50 disabled:opacity-40"
          >
            Enter silently
          </button>
        </div>
      </div>

      {/* controls */}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 sm:p-7">
        {playing && audio ? (
          <button
            type="button"
            onClick={toggleMute}
            aria-pressed={muted}
            className="rounded-full px-3 py-2 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-ivory-200/80 transition-colors hover:text-ivory-50"
          >
            {muted ? "Sound off" : "Sound on"}
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={skip}
          className="group inline-flex items-center gap-2 rounded-full border border-ivory-100/20 px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-ivory-200/90 backdrop-blur-sm transition-colors hover:border-ivory-100/50 hover:text-ivory-50"
        >
          Skip intro
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </button>
      </div>
    </div>
  );
}
