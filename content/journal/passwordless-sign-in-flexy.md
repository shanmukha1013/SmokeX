---
title: Building passwordless sign-in for Flexy
date: 2026-11-09
summary: One-time email codes sound simple. Getting expiry, attempts, rate limits and token rotation right is where the real work is.
tags: [Backend, Security, Flexy]
---

[Flexy](https://flexy-peach.vercel.app/) uses passwordless email sign-in. Enter a new address and an account is created; enter an existing one and you're signed straight in. It feels effortless to the user. Underneath, it's a small security system.

## The flow

1. `POST /api/auth/request-otp` validates the email and generates a six-digit code with `crypto.randomInt`.
2. Only an **HMAC of the code**, bound to the email, is stored — never the code itself.
3. The code is sent with Resend. The API returns `200` only after Resend accepts the message; otherwise it answers honestly with `502`, `503` or `429`.
4. The login screen shows the code input only after that `200`.
5. `POST /api/auth/verify-otp` checks the code.

## The rules that make it safe

- A code **expires after 5 minutes**, works **once**, and allows **5 attempts**.
- Requesting a new code invalidates the previous one.
- One code per email per 60 seconds, ten per email per hour, plus per-IP limits on both endpoints.

On success the API returns a **15-minute access token** and sets a **30-day HttpOnly refresh cookie**. Logging out revokes refresh tokens on the server, so a stolen cookie doesn't outlive the session.

## Failing loudly in production

In production the server refuses to start unless the database URL and both JWT secrets are set — and the secrets must be at least 32 characters, different from each other and not known placeholder values. A misconfigured deploy should crash on boot, not quietly accept weak secrets.

## What I'd change at scale

The per-IP counters live in memory, so they are per server instance. That's fine for a single instance, but scaling out would need a shared store such as Redis. Writing that limitation down is part of the work too.
