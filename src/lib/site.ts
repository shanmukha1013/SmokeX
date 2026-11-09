export const site = {
  name: "SMOKE X",
  tagline: "Turning ideas into products.",
  title: "SMOKE X — Turning Ideas Into Products.",
  description:
    "Explore SMOKE X, the personal technology ecosystem of Marella Shanmukha Reddy, featuring software products, AI engineering, innovation and digital experiences.",
  // canonical URL: explicit setting first, then Vercel's production domain (a system variable set at build time)
  url: (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://smokex.vercel.app")
  ).replace(/\/$/, ""),
  owner: {
    name: "Marella Shanmukha Reddy",
    short: "MSR",
    email: "marellashanmukhareddy@gmail.com",
    phoneDisplay: "+91 63010 98682",
    phoneHref: "tel:+916301098682",
    whatsapp: "https://wa.me/916301098682",
  },
  /** Only profiles that are publicly listed by the owner (GitHub profile README). */
  social: {
    github: "https://github.com/shanmukha1013",
    linkedin: "https://linkedin.com/in/marellashanmukhareddy",
    leetcode: "https://leetcode.com/u/marellashmareddy",
  },
  githubUser: "shanmukha1013",
} as const;

export const navItems = [
  { label: "Home", href: "/#home", id: "home" },
  { label: "Ecosystem", href: "/#ecosystem", id: "ecosystem" },
  { label: "About", href: "/#about", id: "about" },
  { label: "Engineering", href: "/#engineering", id: "engineering" },
  { label: "Journal", href: "/#journal", id: "journal" },
  { label: "Contact", href: "/#contact", id: "contact" },
] as const;
