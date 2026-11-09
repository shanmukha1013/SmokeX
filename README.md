# SMOKE X

**Turning ideas into products.**

The personal technology ecosystem of Marella Shanmukha Reddy (MSR): a cinematic title sequence, the product ecosystem, engineering work, a journal and a project-inquiry flow.

Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Three.js and GSAP.

---

## Quick start

```bash
npm install
cp .env.example .env.local   # optional: only needed for contact-form delivery
npm run dev                  # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm run typecheck` | TypeScript, no emit |

Requires Node.js 20.9 or newer.

## Environment variables

All are optional. The site builds and runs without any of them.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL used for metadata, Open Graph, sitemap and robots. Set it to your production domain, without a trailing slash. |
| `RESEND_API_KEY` | Server-only. Enables the contact form to deliver email through [Resend](https://resend.com). |
| `CONTACT_TO_EMAIL` | The inbox that receives inquiries. |
| `CONTACT_FROM_EMAIL` | A verified Resend sender, for example `SMOKE X <hello@yourdomain.com>`. Resend's default `onboarding@resend.dev` only delivers to the Resend account owner's own address. |
| `GITHUB_TOKEN` | Optional, read-only token with no scopes. Raises the GitHub API rate limit for the repository section. |

**If `RESEND_API_KEY` or `CONTACT_TO_EMAIL` is missing**, `/api/contact` responds `503 not_configured`. The form then tells the visitor that nothing was sent and offers a pre-filled email instead. It never pretends a message was delivered.

## Deploying to Vercel

1. Push this folder to a GitHub repository. It is independent of the product repositories and doesn't touch them.
2. In Vercel, go to **Add New → Project**, import the repository and keep the defaults (framework: Next.js, build command `next build`).
3. Under **Settings → Environment Variables**, add `NEXT_PUBLIC_SITE_URL`. To make the contact form send email, also add the three Resend variables.
4. Deploy. Every page is statically generated except `/api/contact`. The GitHub section revalidates hourly.

You can also use the CLI: `npx vercel` for a preview deployment and `npx vercel --prod` for production.

## Project structure

```
content/journal/          Journal entries (Markdown + front matter)
public/screens/           Real screenshots of the live products
src/app/                  Routes, metadata, sitemap, robots, OG image, icons, /api/contact
src/components/intro/     The cinematic intro
  engine/IntroEngine.ts   Three.js scene, shaders, choreography (GSAP)
  engine/audio.ts         Original sound design, synthesised live with Web Audio
  engine/cues.ts          The cue sheet that drives both picture and sound
  FallbackIntro.tsx       SVG version for devices without WebGL2
src/components/smoke/     Lightweight raw-WebGL smoke used in page sections
src/components/sections/  Homepage sections
src/data/                 Products, lab projects, technologies, experience, services
src/lib/wordmark.ts       The SMOKE X letterforms — used by both the 3D intro and the SVG logo
```

## Editing content

- **Products:** `src/data/products.ts`. Every fact there comes from the product's public README or live site. Keep it that way.
- **Lab, experience and technologies:** `src/data/lab.ts` and `src/data/engineering.ts`. A technology appears on the site only once its `usedIn` list is non-empty. PyTorch, LangChain/LangGraph and Hugging Face are listed there but stay hidden until you add the work they were used in.
- **Journal:** add a Markdown file to `content/journal/`. It appears on the site with no code changes.

  ```markdown
  ---
  title: My new entry
  date: 2026-12-01
  summary: One sentence for listings and search results.
  tags: [Engineering, AI]
  draft: false
  ---

  Your writing here…
  ```

- **Brand colours:** tokens are defined once in `src/app/globals.css` (`@theme`), and the same values appear in `src/lib/brand.ts`. Tailwind's default palette is removed, so only Ivory, Emerald and Vermilion exist.

## The intro

- **First visit:** a short gate lets the visitor choose sound on or off. Browsers only allow audio after a click.
- **Returning visitors** go straight to the homepage. *Replay the intro* is in the footer.
- **Reduced motion:** the intro is skipped automatically.
- **No WebGL2:** an SVG version with the same cue sheet and audio plays instead.
- **Skip:** the button, or the `Esc` key, dissolves the smoke straight to the homepage.
- **Slower devices:** they get fewer particles, lower-resolution smoke and fewer noise octaves. If frames run slow, pixel ratio drops automatically. The timeline stays locked to the audio clock.
- **Clean-up:** all GPU resources (geometries, materials, render targets, the WebGL context) are disposed when the intro ends.

All visuals and sound are generated in the browser. No video, stock footage or licensed audio is used.
