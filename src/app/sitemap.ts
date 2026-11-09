import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { products } from "@/data/products";
import { getJournalEntries } from "@/lib/journal";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: site.url, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...products.map((p) => ({ url: `${site.url}/ecosystem/${p.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 })),
    { url: `${site.url}/journal`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    ...getJournalEntries().map((e) => ({ url: `${site.url}/journal/${e.slug}`, lastModified: new Date(e.date), changeFrequency: "yearly" as const, priority: 0.6 })),
  ];
}
