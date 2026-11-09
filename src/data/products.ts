/**
 * The products inside the SMOKE X ecosystem: ForReal, Flexy, Sidekick and PunchStart.
 *
 * Every fact here comes from the product's public repository README or its live site
 * (checked November 2026). Nothing is invented: no user counts, revenue or metrics.
 * Each product keeps its own deployment, authentication and backend — SMOKE X only links out.
 */

export type ProductStatus = "Live" | "In development" | "Experiment" | "Private";

export interface Product {
  slug: string;
  index: string;
  name: string;
  /** product's own tagline, quoted from its site or README */
  tagline: string;
  category: string;
  summary: string;
  problem: string;
  approach: string;
  features: string[];
  stack: { layer: string; items: string[] }[];
  role: string;
  status: ProductStatus;
  statusNote?: string;
  liveUrl: string;
  repoUrl: string;
  screenshot: { src: string; alt: string; caption: string };
}

export const products: Product[] = [
  {
    slug: "forreal",
    index: "01",
    name: "ForReal",
    tagline: "Don’t just post it. Defend it.",
    category: "Social debate platform",
    summary:
      "A debate platform for meaningful conversation. Members open a question, pick a side, back their argument with evidence and let the community’s vote decide when the clock runs out.",
    problem:
      "Social feeds reward whoever is loudest. Influencer culture optimises for reach, not reasoning — there is no place where the better argument actually wins.",
    approach:
      "ForReal rewards whoever makes the better case. Debates are structured, time-boxed and evidence-aware, and the result is recorded honestly — ties included.",
    features: [
      "Open a motion with 2–4 sides, a category and a timer from 1 hour to 1 week",
      "Evidence-required mode: every top-level argument must cite a source",
      "Vote and switch sides while a debate is live — counts update in real time",
      "The floor: filter arguments by side, sort by Newest or Strongest",
      "Endorse, reply to and quote arguments to rebut them directly",
      "Debate pulse: aggregated participation and evidence statistics",
      "Automatic verdict when the timer ends; the floor becomes read-only",
      "Live WebSocket updates, including “drafting an argument…” indicators",
      "Feed, Explore search, direct messages, notifications and profiles",
      "A five-scene cinematic introduction for first-time visitors",
    ],
    stack: [
      { layer: "Client", items: ["React 19", "Vite", "Tailwind CSS v4", "React Router 7", "Zustand", "Socket.IO client"] },
      { layer: "Server", items: ["Node.js", "Express 5", "Socket.IO", "JWT", "Winston"] },
      { layer: "Data", items: ["MongoDB", "Mongoose"] },
    ],
    role: "Creator — product design and full-stack engineering",
    status: "Live",
    liveUrl: "https://for-real-eight.vercel.app/",
    repoUrl: "https://github.com/shanmukha1013/ForReal",
    screenshot: {
      src: "/screens/forreal.png",
      alt: "ForReal landing page: “Don’t just post it. Defend it.”",
      caption: "ForReal — landing page",
    },
  },
  {
    slug: "flexy",
    index: "02",
    name: "Flexy",
    tagline: "Every item finds its value.",
    category: "Auction marketplace",
    summary:
      "An auction marketplace that connects buyers and sellers of collectibles — list an item, bid live, message each other and showcase a collection in one place.",
    problem:
      "General marketplaces are built for commodities, not collections. Collectors need a dedicated place to discover, bid on and showcase items with a story behind them.",
    approach:
      "Flexy pairs a focused marketplace with real-time bidding and messaging, and a passwordless sign-in flow built carefully around security and abuse limits.",
    features: [
      "Live bids and direct messages over Socket.IO",
      "Passwordless email sign-in with one-time codes, delivered through Resend",
      "Codes stored only as an HMAC, expire after 5 minutes and allow 5 attempts",
      "15-minute access tokens with 30-day HttpOnly refresh cookies; server-side logout",
      "Per-email and per-IP rate limits on authentication endpoints",
      "Item listings with images, marketplace exploration and user profiles",
      "Production start-up guard: refuses to boot with weak or placeholder secrets",
    ],
    stack: [
      { layer: "Client", items: ["HTML", "CSS", "Vanilla JavaScript", "Socket.IO client"] },
      { layer: "Server", items: ["Node.js", "Express 5", "Socket.IO", "JWT", "Resend"] },
      { layer: "Data", items: ["MongoDB", "Mongoose"] },
    ],
    role: "Creator — built from idea to deployment",
    status: "Live",
    liveUrl: "https://flexy-peach.vercel.app/",
    repoUrl: "https://github.com/shanmukha1013/Flexy",
    screenshot: {
      src: "/screens/flexy.png",
      alt: "Flexy sign-in screen with the tagline “Every Item Finds Its Value”",
      caption: "Flexy — sign-in",
    },
  },
  {
    slug: "sidekick",
    index: "03",
    name: "Sidekick",
    tagline: "Part-time work, done right.",
    category: "Part-time job marketplace",
    summary:
      "A part-time job and opportunity marketplace. Students and job seekers find flexible work; employers post jobs, review applicants and hire. One account can do both.",
    problem:
      "Students and job seekers looking for flexible work — and employers hiring for part-time roles — rarely get one simple place to apply, hire and talk.",
    approach:
      "One account with switchable roles, a clear hiring pipeline and messaging on every application, backed by a FastAPI service with revocable sessions.",
    features: [
      "One account for job seekers and employers; roles can be changed any time",
      "Search and filter by keyword, category, location, type, remote, experience and pay",
      "Skill-based job recommendations",
      "Save jobs, apply with a cover letter, track status and withdraw",
      "Employer pipeline: in review → shortlisted → accepted / declined",
      "Messaging on every application, with unread counts",
      "Notifications for applications, status changes and withdrawals",
      "bcrypt hashing, revocable JWTs (jti) and token versioning across devices",
    ],
    stack: [
      { layer: "Frontend", items: ["Next.js 16", "React 19", "Tailwind CSS v4"] },
      { layer: "Backend", items: ["FastAPI", "Motor", "Pydantic v2", "python-jose", "bcrypt"] },
      { layer: "Data & hosting", items: ["MongoDB Atlas", "Vercel", "Render"] },
    ],
    role: "Creator — product design and full-stack engineering",
    status: "Live",
    liveUrl: "https://sidekick-sand-eight.vercel.app/",
    repoUrl: "https://github.com/shanmukha1013/sidekick",
    screenshot: {
      src: "/screens/sidekick.png",
      alt: "Sidekick landing page: “Work that fits around your life.”",
      caption: "Sidekick — landing page",
    },
  },
  {
    slug: "punchstart",
    index: "04",
    name: "PunchStart",
    tagline: "Build the right startup. Not just a startup.",
    category: "AI startup validation",
    summary:
      "An AI-powered platform that helps founders analyse and validate a startup idea before investing time, money and effort into building it.",
    problem:
      "Many startup ideas fail because they are never validated. Founders often commit months of work on assumptions instead of evidence.",
    approach:
      "PunchStart turns an idea into a structured analysis — strengths, weaknesses, opportunities, risks and market potential — using the Gemini API and careful prompt design.",
    features: [
      "AI-powered startup idea analysis",
      "SWOT analysis",
      "Market insights",
      "Startup evaluation",
      "Personalised AI recommendations",
      "Secure authentication",
    ],
    stack: [
      { layer: "Frontend", items: ["Next.js", "React", "Tailwind CSS"] },
      { layer: "Backend", items: ["FastAPI", "Python"] },
      { layer: "AI & data", items: ["Google Gemini API", "Prompt engineering", "MongoDB"] },
    ],
    role: "Creator — AI product design and full-stack engineering",
    status: "Live",
    liveUrl: "https://start-punch.vercel.app/",
    repoUrl: "https://github.com/shanmukha1013/StartPunch",
    screenshot: {
      src: "/screens/punchstart.png",
      alt: "PunchStart landing page: “Build the right startup. Not just a startup.”",
      caption: "PunchStart — landing page",
    },
  },
];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}
