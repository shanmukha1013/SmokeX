import { NextResponse } from "next/server";

/**
 * Project inquiry endpoint.
 * - Validates and length-limits every field server-side.
 * - Honeypot + same-origin check + per-IP rate limit against spam.
 * - Delivers through Resend using server-only environment variables.
 * - If email delivery isn't configured it says so (503 not_configured) — it never pretends to send.
 */

export const runtime = "nodejs";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>(); // per server instance; fine for a portfolio's traffic

function rateLimited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > MAX_PER_WINDOW;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max) : "");
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json({ error: "Cross-origin requests are not allowed." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // honeypot: quietly accept and drop
  if (clean(body.website, 200)) return NextResponse.json({ ok: true });

  const data = {
    name: clean(body.name, 100),
    email: clean(body.email, 200),
    company: clean(body.company, 150),
    service: clean(body.service, 100),
    budget: clean(body.budget, 50),
    timeline: clean(body.timeline, 50),
    message: clean(body.message, 4000),
  };

  if (!data.name) return NextResponse.json({ error: "Please add your name." }, { status: 422 });
  if (!EMAIL.test(data.email)) return NextResponse.json({ error: "Please use a valid email address." }, { status: 422 });
  if (data.message.length < 20) return NextResponse.json({ error: "Please describe the project in a little more detail (20+ characters)." }, { status: 422 });

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) return NextResponse.json({ error: "Too many messages — please try again in a few minutes." }, { status: 429 });

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL || "SMOKE X <onboarding@resend.dev>";
  if (!key || !to) {
    return NextResponse.json({ error: "Email delivery is not configured.", code: "not_configured" }, { status: 503 });
  }

  const rows: [string, string][] = [
    ["Name", data.name],
    ["Email", data.email],
    ["Company", data.company || "—"],
    ["Project type", data.service || "—"],
    ["Budget", data.budget || "—"],
    ["Timeline", data.timeline || "—"],
  ];
  const text = `${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${data.message}`;
  const html = `<div style="font-family:system-ui,sans-serif;color:#01130F">
  <h2 style="margin:0 0 12px">New project inquiry — SMOKE X</h2>
  <table cellpadding="6" style="border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="color:#00614C;font-size:12px;text-transform:uppercase;letter-spacing:.08em">${esc(k)}</td><td>${esc(v)}</td></tr>`)
    .join("")}</table>
  <p style="white-space:pre-wrap;margin-top:16px;line-height:1.6">${esc(data.message)}</p>
</div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: data.email,
        subject: `Project inquiry — ${data.name}${data.service ? ` · ${data.service}` : ""}`,
        text,
        html,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.error("[contact] Resend rejected the message:", res.status, await res.text().catch(() => ""));
      return NextResponse.json({ error: "The email service didn’t accept the message." }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact] delivery failed:", err);
    return NextResponse.json({ error: "The email service couldn’t be reached." }, { status: 502 });
  }
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405, headers: { Allow: "POST" } });
}
