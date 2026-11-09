import type { Metadata, Viewport } from "next";
import { Fraunces, JetBrains_Mono, Manrope, Unbounded } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";
import { Nav } from "@/components/nav/Nav";
import { Footer } from "@/components/nav/Footer";
import { IntroController, introBootScript } from "@/components/intro/IntroController";
import { RevealObserver } from "@/components/ui/Reveal";

const unbounded = Unbounded({ subsets: ["latin"], variable: "--font-unbounded", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-fraunces", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: "%s — SMOKE X" },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.owner.name, url: site.social.github }],
  creator: site.owner.name,
  keywords: [
    "SMOKE X",
    "Marella Shanmukha Reddy",
    "MSR",
    "software developer",
    "full-stack developer",
    "AI engineer",
    "machine learning",
    "Next.js",
    "FastAPI",
    "RAG",
    "product builder",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: site.url,
    siteName: site.name,
    title: site.title,
    description: site.description,
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image", title: site.title, description: site.description },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#01130F",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${site.url}/#person`,
      name: site.owner.name,
      alternateName: site.owner.short,
      url: site.url,
      email: `mailto:${site.owner.email}`,
      jobTitle: "Software Developer",
      knowsAbout: ["Full-stack development", "Artificial intelligence", "Machine learning", "Retrieval-Augmented Generation", "FastAPI", "Next.js"],
      sameAs: [site.social.github, site.social.linkedin, site.social.leetcode],
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: site.url,
      name: site.name,
      description: site.description,
      publisher: { "@id": `${site.url}/#person` },
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${unbounded.variable} ${manrope.variable} ${fraunces.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: introBootScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        {/* painted before hydration for first-time visitors, so the homepage never flashes before the intro */}
        <div id="smx-intro-cover" aria-hidden className="fixed inset-0 z-[99] bg-emerald-990" />
        <Nav />
        <main id="main">{children}</main>
        <Footer />
        <IntroController />
        <RevealObserver />
      </body>
    </html>
  );
}
