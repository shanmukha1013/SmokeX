import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";

/**
 * Journal entries live as Markdown files in /content/journal.
 * Add a new `.md` file with front matter and it appears on the site — no code changes.
 *
 * ---
 * title: My entry
 * date: 2026-11-09
 * summary: One sentence for listings and SEO.
 * tags: [Engineering, AI]
 * draft: false
 * ---
 */

export interface JournalMeta {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  readingMinutes: number;
}

export interface JournalEntry extends JournalMeta {
  html: string;
}

const DIR = path.join(process.cwd(), "content", "journal");

function parseFrontMatter(src: string): { data: Record<string, string | string[] | boolean>; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(src);
  if (!m) return { data: {}, body: src };
  const data: Record<string, string | string[] | boolean> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i < 0) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if (val.startsWith("[") && val.endsWith("]")) {
      data[key] = val
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else if (val === "true" || val === "false") {
      data[key] = val === "true";
    } else {
      val = val.replace(/^["']|["']$/g, "");
      data[key] = val;
    }
  }
  return { data, body: m[2] };
}

function read(file: string): JournalEntry | null {
  const slug = file.replace(/\.md$/, "");
  const src = fs.readFileSync(path.join(DIR, file), "utf8");
  const { data, body } = parseFrontMatter(src);
  if (data.draft === true) return null;
  const words = body.split(/\s+/).filter(Boolean).length;
  return {
    slug,
    title: String(data.title ?? slug),
    date: String(data.date ?? ""),
    summary: String(data.summary ?? ""),
    tags: Array.isArray(data.tags) ? data.tags : [],
    readingMinutes: Math.max(1, Math.round(words / 220)),
    html: marked.parse(body, { async: false, gfm: true }) as string,
  };
}

export function getJournalEntries(): JournalEntry[] {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".md"))
    .map(read)
    .filter((e): e is JournalEntry => e !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getJournalEntry(slug: string): JournalEntry | null {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const file = `${slug}.md`;
  if (!fs.existsSync(path.join(DIR, file))) return null;
  return read(file);
}

export function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
