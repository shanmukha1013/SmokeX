"use client";

import { useRef, useState } from "react";
import { services } from "@/data/engineering";
import { site } from "@/lib/site";
import { Arrow } from "@/components/ui/primitives";

const budgets = ["Under $500", "$500 – $1.5k", "$1.5k – $5k", "$5k+", "Not sure yet"];
const timelines = ["ASAP", "Within a month", "1 – 3 months", "Flexible"];

type State =
  | { s: "idle" }
  | { s: "sending" }
  | { s: "sent" }
  | { s: "unconfigured"; mailto: string }
  | { s: "error"; msg: string; mailto?: string };

function buildMailto(d: Record<string, string>) {
  const body = [
    `Name: ${d.name}`,
    `Email: ${d.email}`,
    d.company ? `Company: ${d.company}` : "",
    `Project type: ${d.service || "—"}`,
    `Budget: ${d.budget || "—"}`,
    `Timeline: ${d.timeline || "—"}`,
    "",
    d.message,
  ]
    .filter((l) => l !== "")
    .join("\n");
  return `mailto:${site.owner.email}?subject=${encodeURIComponent(`Project inquiry — ${d.name}`)}&body=${encodeURIComponent(body)}`;
}

function Chips({ name, options, label }: { name: string; options: string[]; label: string }) {
  return (
    <fieldset>
      <legend className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-emerald-300">{label}</legend>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o} className="cursor-pointer">
            <input type="radio" name={name} value={o} className="peer sr-only" />
            <span className="inline-block rounded-full border border-ivory-100/15 px-3.5 py-1.5 text-sm text-ivory-200 transition-colors peer-checked:border-emerald-300 peer-checked:bg-emerald-800/70 peer-checked:text-ivory-50 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-vermilion-500 hover:border-ivory-100/40">
              {o}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const field =
  "mt-1.5 w-full rounded-xl border border-ivory-100/15 bg-emerald-950/60 px-4 py-3 text-ivory-50 lg:py-[clamp(0.55rem,1.4vh,0.8rem)] placeholder:text-ivory-300/40 transition-colors focus:border-emerald-300 focus:outline-none";

export function ContactForm() {
  const [state, setState] = useState<State>({ s: "idle" });
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const mailto = buildMailto(data);
    setState({ s: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
      if (res.ok) {
        setState({ s: "sent" });
        form.reset();
      } else if (json.code === "not_configured") {
        setState({ s: "unconfigured", mailto });
      } else {
        setState({ s: "error", msg: json.error || "Something went wrong sending your message.", mailto });
      }
    } catch {
      setState({ s: "error", msg: "Couldn’t reach the server. Check your connection and try again.", mailto });
    }
    requestAnimationFrame(() => statusRef.current?.focus());
  }

  if (state.s === "sent") {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="rounded-3xl border border-emerald-400/30 bg-emerald-950/60 p-8 sm:p-10">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-emerald-300">Message sent</p>
        <p className="mt-4 font-display text-3xl font-semibold">Thank you — it&rsquo;s in my inbox.</p>
        <p className="mt-3 text-ivory-300">I&rsquo;ll reply to the email address you gave.</p>
        <button type="button" onClick={() => setState({ s: "idle" })} className="mt-8 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-emerald-300 underline-offset-4 hover:underline">
          Send another
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate={false} className="rounded-3xl border border-ivory-100/10 bg-emerald-990/50 p-6 backdrop-blur-sm sm:p-8 lg:px-9 lg:py-[clamp(1.25rem,3.4vh,2.25rem)]" aria-describedby="form-note">
      <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-emerald-300">Project inquiry</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:mt-[clamp(0.75rem,2vh,1.25rem)]">
        <label className="block text-sm text-ivory-200">
          Your name
          <input name="name" required maxLength={100} autoComplete="name" className={field} placeholder="Full name" />
        </label>
        <label className="block text-sm text-ivory-200">
          Email
          <input name="email" type="email" required maxLength={200} autoComplete="email" className={field} placeholder="you@company.com" />
        </label>
        <label className="block text-sm text-ivory-200">
          Company or project <span className="text-ivory-300/50">(optional)</span>
          <input name="company" maxLength={150} autoComplete="organization" className={field} />
        </label>
        <label className="block text-sm text-ivory-200">
          What do you need?
          <select name="service" required defaultValue="" className={`${field} appearance-none`}>
            <option value="" disabled>
              Choose a service
            </option>
            {services.map((s) => (
              <option key={s.title} value={s.title} className="bg-emerald-990">
                {s.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-6 space-y-5 lg:mt-[clamp(0.9rem,2.4vh,1.5rem)] lg:space-y-[clamp(0.75rem,2vh,1.25rem)]">
        <Chips name="budget" label="Budget range" options={budgets} />
        <Chips name="timeline" label="Timeline" options={timelines} />
      </div>
      <label className="mt-6 block text-sm text-ivory-200 lg:mt-[clamp(0.9rem,2.4vh,1.5rem)]">
        Project requirements
        <textarea
          name="message"
          required
          minLength={20}
          maxLength={4000}
          rows={4}
          className={`${field} resize-y lg:h-[clamp(5.5rem,14vh,8.5rem)]`}
          placeholder="What are you building, who is it for, and what should the first version do?"
        />
      </label>
      {/* honeypot — hidden from people, irresistible to bots */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:mt-[clamp(0.9rem,2.4vh,1.5rem)]">
        <p id="form-note" className="max-w-xs text-xs leading-relaxed text-ivory-300/60">
          Your details are only used to reply to this inquiry.
        </p>
        <button
          type="submit"
          disabled={state.s === "sending"}
          className="btn-smoke btn-smoke--vermilion inline-flex items-center justify-center gap-2.5 rounded-full bg-vermilion-500 px-7 py-3.5 font-mono text-[0.74rem] uppercase tracking-[0.18em] text-ivory-50 transition-colors hover:bg-vermilion-600 disabled:cursor-wait disabled:opacity-60"
        >
          {state.s === "sending" ? "Sending…" : "Send inquiry"} <Arrow />
        </button>
      </div>

      <div ref={statusRef} tabIndex={-1} aria-live="polite" className="outline-none">
        {state.s === "unconfigured" && (
          <div className="mt-6 rounded-2xl border border-ivory-100/15 bg-emerald-950/70 p-5 text-sm leading-relaxed text-ivory-200">
            <p>
              The form isn&rsquo;t connected to an inbox yet, so nothing was sent. Your message is ready to go by email instead:
            </p>
            <a href={state.mailto} className="mt-3 inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-emerald-300 hover:text-emerald-200">
              Open in your email app <Arrow />
            </a>
          </div>
        )}
        {state.s === "error" && (
          <div className="mt-6 rounded-2xl border border-vermilion-500/50 bg-emerald-950/70 p-5 text-sm leading-relaxed text-ivory-200" role="alert">
            <p>{state.msg}</p>
            {state.mailto && (
              <a href={state.mailto} className="mt-3 inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-emerald-300 hover:text-emerald-200">
                Send by email instead <Arrow />
              </a>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
