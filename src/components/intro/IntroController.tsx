"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";

const IntroOverlay = dynamic(() => import("./IntroOverlay"), { ssr: false });

export const INTRO_KEY = "smx-intro-v1";
export const INTRO_DONE_EVENT = "smx:intro-complete";
export const INTRO_REPLAY_EVENT = "smx:replay-intro";

/** Fire from any button to replay the title sequence. */
export function replayIntro() {
  window.dispatchEvent(new Event(INTRO_REPLAY_EVENT));
}

/** True while the intro owns the screen (set before paint by the inline head script). */
export function introIsPlaying() {
  return typeof document !== "undefined" && document.documentElement.dataset.intro === "play";
}

/**
 * Decides whether the intro runs:
 * - first visit (no flag in storage) and no reduced-motion preference → plays
 * - returning visitors → straight to the homepage, with a "Replay intro" option
 */
export function IntroController() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      if (introIsPlaying()) setActive(true);
    });
    const onReplay = () => {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      document.documentElement.dataset.intro = "play";
      setActive(true);
    };
    window.addEventListener(INTRO_REPLAY_EVENT, onReplay);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener(INTRO_REPLAY_EVENT, onReplay);
    };
  }, []);

  const done = useCallback(() => {
    try {
      localStorage.setItem(INTRO_KEY, String(Date.now()));
    } catch {
      /* storage unavailable: the intro simply plays again next time */
    }
    document.documentElement.dataset.intro = "done";
    setActive(false);
    window.dispatchEvent(new Event(INTRO_DONE_EVENT));
  }, []);

  return active ? <IntroOverlay onDone={done} /> : null;
}

/** Inline script that runs before first paint — avoids a flash of the homepage before the intro. */
export const introBootScript = `(function(){try{var d=document.documentElement;var seen=localStorage.getItem('${INTRO_KEY}');var rm=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;var bot=/bot|crawl|spider|slurp|facebookexternalhit|embedly|preview/i.test(navigator.userAgent);if(!seen&&!rm&&!bot){d.dataset.intro='play';}else{d.dataset.intro='skip';}}catch(e){}})();`;
