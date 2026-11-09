import { site } from "@/lib/site";
import { SmokeField } from "@/components/smoke/SmokeField";
import { Arrow, DisplayHeading, SectionLabel } from "@/components/ui/primitives";
import { ContactForm } from "./ContactForm";

export function Contact() {
  const wa = `${site.owner.whatsapp}?text=${encodeURIComponent("Hi MSR — I found SMOKE X and I'd like to talk about a project.")}`;
  const channels = [
    { k: "Email", v: site.owner.email, href: `mailto:${site.owner.email}` },
    { k: "WhatsApp", v: site.owner.phoneDisplay, href: wa, ext: true },
    { k: "Phone", v: site.owner.phoneDisplay, href: site.owner.phoneHref },
  ];
  const profiles = [
    { k: "GitHub", href: site.social.github },
    { k: "LinkedIn", href: site.social.linkedin },
    { k: "LeetCode", href: site.social.leetcode },
  ];
  return (
    <section id="contact" aria-labelledby="contact-title" className="vp grain relative isolate overflow-hidden bg-emerald-990 py-24 text-ivory-100 sm:py-28">
      <SmokeField variant="deep" intensity={1.15} interactive className="-z-10" />
      <div className="shell relative">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-14">
          <div className="lg:col-span-5">
            <SectionLabel index="08" light>
              Contact
            </SectionLabel>
            <DisplayHeading
              lines={[
                <span key="a" id="contact-title">Let’s turn</span>,
                "your idea into",
                <span key="c" className="text-emerald-300">a product.</span>,
              ]}
              className="mt-7 font-display text-[2.4rem] font-semibold leading-[1] tracking-[-0.04em] xs:text-5xl sm:text-7xl lg:mt-[clamp(1rem,3vh,2rem)] lg:text-[clamp(2.75rem,min(4.5vw,7.4vh),4.75rem)]"
            />
            <ul className="mt-10 divide-y divide-ivory-100/10 border-y border-ivory-100/10 lg:mt-[clamp(1.5rem,4.5vh,3rem)]">
              {channels.map((c) => (
                <li key={c.k} data-reveal>
                  <a
                    href={c.href}
                    {...(c.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="group flex items-center justify-between gap-4 py-4 lg:py-[clamp(0.7rem,1.8vh,1.1rem)]"
                  >
                    <span className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1">
                      <span className="w-20 shrink-0 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-emerald-300">{c.k}</span>
                      <span className="break-all text-lg text-ivory-50 transition-colors group-hover:text-emerald-200">{c.v}</span>
                    </span>
                    <Arrow diagonal={!!c.ext} className="shrink-0 text-ivory-300 transition-transform duration-500 group-hover:translate-x-1" />
                  </a>
                </li>
              ))}
            </ul>
            <ul className="mt-6 flex flex-wrap gap-2 lg:mt-[clamp(1rem,2.6vh,1.75rem)]" data-reveal>
              {profiles.map((p) => (
                <li key={p.k}>
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-smoke inline-flex items-center gap-2 rounded-full border border-ivory-100/15 px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ivory-200 transition-colors hover:border-emerald-300/60 hover:text-ivory-50"
                  >
                    {p.k} <Arrow diagonal />
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-ivory-300/70 lg:mt-[clamp(1rem,2.6vh,1.75rem)]" data-reveal>
              Email, WhatsApp, a call or the form — whichever is easiest for you.
            </p>
          </div>
          <div className="lg:col-span-7" data-reveal>
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
