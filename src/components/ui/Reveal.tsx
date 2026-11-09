"use client";

import { useEffect } from "react";

/**
 * One observer for the whole page: any element with [data-reveal] (or .line-mask) gets
 * `.is-revealed` as it enters the viewport — the "smoke clearing" entrance defined in CSS.
 */
export function RevealObserver() {
  useEffect(() => {
    const els = () => document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-revealed), .line-mask:not(.is-revealed)");
    if (!("IntersectionObserver" in window)) {
      els().forEach((e) => e.classList.add("is-revealed"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-revealed");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    const scan = () => els().forEach((e) => io.observe(e));
    scan();
    // pick up content rendered after navigation
    const mo = new MutationObserver(() => scan());
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return null;
}
