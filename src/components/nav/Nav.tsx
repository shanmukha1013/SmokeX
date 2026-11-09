"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { navItems, site } from "@/lib/site";
import { Wordmark } from "@/components/brand/Wordmark";

export function Nav() {
  const pathname = usePathname();
  const home = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("home");
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // highlight the section in view
  useEffect(() => {
    if (!home) return;
    const ids = navItems.map((n) => n.id);
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (vis) setActive(vis.target.id);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.2, 0.6] },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [home]);

  const close = useCallback(() => {
    setOpen(false);
    toggleRef.current?.focus({ preventScroll: true });
  }, []);

  // mobile menu: lock scroll, trap focus, close on Escape
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = menuRef.current?.querySelector<HTMLElement>("a,button");
    first?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab" && menuRef.current) {
        const f = Array.from(menuRef.current.querySelectorAll<HTMLElement>("a,button"));
        if (!f.length) return;
        const [a, z] = [f[0], f[f.length - 1]];
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          z.focus();
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  // close the menu on navigation (state reset during render, not in an effect)
  const [prevPath, setPrevPath] = useState(pathname);
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setOpen(false);
  }

  const pill = scrolled || !home;

  return (
    <>
      <a
        href="#main"
        className="sr-only z-[120] rounded-full bg-vermilion-500 px-4 py-2 text-ivory-50 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-5 sm:pt-4">
        <nav
          aria-label="Primary"
          className={`flex w-full items-center justify-between gap-6 rounded-full transition-[background-color,padding,max-width,box-shadow,backdrop-filter] duration-700 ease-[var(--ease-cine)] ${
            pill
              ? "max-w-6xl bg-emerald-990/80 py-2 pl-5 pr-2 shadow-[0_10px_40px_-12px_rgba(1,19,15,0.6)] backdrop-blur-xl"
              : "max-w-[88rem] bg-transparent px-3 py-3 sm:px-6"
          }`}
        >
          <Link href="/#home" aria-label="SMOKE X — home" className="group flex items-center gap-3 py-1 text-ivory-50">
            <Wordmark variant="ivory" title={null} className="h-[0.95rem] w-auto transition-opacity group-hover:opacity-80 sm:h-4" />
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {navItems.map((n) => {
              const isActive = home && active === n.id;
              return (
                <li key={n.id}>
                  <Link
                    href={n.href}
                    aria-current={isActive ? "true" : undefined}
                    className={`relative rounded-full px-3.5 py-2 font-mono text-[0.68rem] uppercase tracking-[0.2em] transition-colors duration-300 ${
                      isActive ? "text-ivory-50" : "text-ivory-300/75 hover:text-ivory-50"
                    }`}
                  >
                    {n.label}
                    <span
                      aria-hidden
                      className={`absolute inset-x-3.5 -bottom-0.5 h-px origin-left bg-emerald-300 transition-transform duration-500 ${
                        isActive ? "scale-x-100" : "scale-x-0"
                      }`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            <Link
              href="/#contact"
              className="btn-smoke btn-smoke--vermilion hidden rounded-full bg-vermilion-500 px-5 py-2.5 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ivory-50 transition-colors hover:bg-vermilion-600 sm:inline-flex"
            >
              Start a project
            </Link>
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              className="flex items-center gap-2.5 rounded-full px-3 py-2.5 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-ivory-50 lg:hidden"
            >
              Menu
              <span aria-hidden className="flex flex-col gap-[5px]">
                <span className="block h-px w-5 bg-current" />
                <span className="block h-px w-3.5 self-end bg-current" />
              </span>
            </button>
          </div>
        </nav>
      </header>

      {/* full-screen mobile navigation */}
      <div
        id="mobile-menu"
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        aria-hidden={!open}
        inert={!open}
        className={`fixed inset-0 z-[60] overflow-y-auto bg-emerald-990 text-ivory-50 transition-[clip-path] duration-[900ms] ease-[var(--ease-cine)] lg:hidden`}
        style={{ clipPath: open ? "circle(150% at calc(100% - 3rem) 2.2rem)" : "circle(0% at calc(100% - 3rem) 2.2rem)" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(60% 40% at 80% 10%, rgba(0,97,76,.55), transparent 70%), radial-gradient(70% 50% at 10% 90%, rgba(1,74,58,.6), transparent 70%)",
            filter: "blur(20px)",
          }}
        />
        <div className="relative flex min-h-full flex-col px-6 pb-10 pt-5">
          <div className="flex items-center justify-between">
            <Wordmark variant="ivory" title="SMOKE X" className="h-4 w-auto" />
            <button
              type="button"
              onClick={close}
              className="rounded-full border border-ivory-100/20 px-4 py-2.5 font-mono text-[0.68rem] uppercase tracking-[0.2em]"
            >
              Close
            </button>
          </div>
          <ul className="mt-14 flex flex-col gap-1">
            {navItems.map((n, i) => (
              <li
                key={n.id}
                className="transition-[opacity,transform] duration-700 ease-[var(--ease-cine)]"
                style={{
                  transitionDelay: open ? `${120 + i * 55}ms` : "0ms",
                  opacity: open ? 1 : 0,
                  transform: open ? "none" : "translateY(24px)",
                }}
              >
                <Link href={n.href} onClick={() => setOpen(false)} className="group flex items-baseline gap-4 py-2">
                  <span className="font-mono text-xs text-emerald-300/70">0{i + 1}</span>
                  <span className="font-display text-[2.05rem] font-semibold uppercase leading-none tracking-tight transition-colors group-hover:text-emerald-300 xs:text-[2.6rem] sm:text-5xl">
                    {n.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-12">
            <Link
              href="/#contact"
              onClick={() => setOpen(false)}
              className="inline-flex rounded-full bg-vermilion-500 px-6 py-3.5 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-ivory-50"
            >
              Start a project
            </Link>
            <div className="mt-8 space-y-1.5 text-sm text-ivory-300">
              <a className="block hover:text-ivory-50" href={`mailto:${site.owner.email}`}>
                {site.owner.email}
              </a>
              <a className="block hover:text-ivory-50" href={site.owner.phoneHref}>
                {site.owner.phoneDisplay}
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
