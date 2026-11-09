---
title: "Three colours, nothing else"
date: 2026-11-09
summary: How ForReal enforces a strict three-colour design system in code — and why SMOKE X does the same with ivory, emerald and vermilion.
tags: [Design systems, Frontend, ForReal]
---

A colour palette written in a design document is a suggestion. A colour palette enforced by the build is a rule.

When I built [ForReal](https://for-real-eight.vercel.app/), I decided the entire interface — focus rings, toasts, charts, badges, even the intro — would use exactly three colours plus opacity variants of them.

| Token | Hex | Role |
|---|---|---|
| `ember` | `#CA6230` | ~60% · brand surfaces, selection, emphasis |
| `ivory` | `#F2E2C5` | ~30% · reading surfaces, cards, forms |
| `ink` | `#171614` | ~10% · text, rules, dark accents |

## Removing the escape hatches

The trick is that the stylesheet doesn't just *define* the three tokens — it **removes Tailwind's default palette**. A class like `bg-blue-500` or `text-white` generates no CSS at all. If someone (including me, at 2 a.m.) reaches for an off-brand colour, nothing happens, and the mistake is obvious immediately.

## Measured, not eyeballed

The orange started as `#C65D2E`. Ink text on it failed WCAG AA by a hair, so I nudged it to `#CA6230`, which reaches **4.56:1**. Ink on ivory sits at **14.2:1**. The ivory is deliberately warm so it never reads as plain white.

## Status without extra hues

The hard part of a three-colour system is state. How do you show an error without red, or tell two debate sides apart without blue and green? ForReal uses dashed borders, an icon and text for errors, and solid versus hatched tones with letter labels for sides. Colour is never the only signal — which also happens to be what accessibility asks for.

## The same rule, here

SMOKE X follows the same discipline with its own three colours: **ivory** for the surfaces you read, **emerald** for the brand and everything interactive, and **vermilion** reserved for the few things that genuinely need your attention. The default palette is removed here too — so the rule holds as the site grows.
