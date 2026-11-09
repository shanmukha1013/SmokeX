import { site } from "./site";

export interface Repo {
  name: string;
  description: string | null;
  language: string | null;
  url: string;
  homepage: string | null;
  updatedAt: string;
  stars: number;
  fork: boolean;
}

export interface GitHubProfile {
  login: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string;
  url: string;
  publicRepos: number;
  repos: Repo[];
  fetchedAt: string;
  live: boolean;
}

/** Snapshot taken from the public GitHub API (Nov 2026) — used only if the live request fails. */
const SNAPSHOT: GitHubProfile = {
  login: "shanmukha1013",
  name: "Marella Shanmukha Reddy",
  bio: "AI & Machine Learning Engineer | Full-Stack Developer | Building AI Products from Ideas to Reality",
  avatarUrl: "https://avatars.githubusercontent.com/u/265555043?v=4",
  url: "https://github.com/shanmukha1013",
  publicRepos: 8,
  fetchedAt: "2026-11-09T00:00:00Z",
  live: false,
  repos: [
    { name: "sidekick", description: null, language: "TypeScript", url: "https://github.com/shanmukha1013/sidekick", homepage: null, updatedAt: "2026-11-09T12:10:30Z", stars: 0, fork: false },
    { name: "Flexy", description: null, language: "JavaScript", url: "https://github.com/shanmukha1013/Flexy", homepage: null, updatedAt: "2026-11-09T10:38:00Z", stars: 0, fork: false },
    { name: "StartPunch", description: null, language: "JavaScript", url: "https://github.com/shanmukha1013/StartPunch", homepage: null, updatedAt: "2026-11-03T16:37:55Z", stars: 0, fork: false },
    { name: "ForReal", description: null, language: "JavaScript", url: "https://github.com/shanmukha1013/ForReal", homepage: null, updatedAt: "2026-10-25T20:05:17Z", stars: 0, fork: false },
    { name: "FeatureFlow", description: null, language: "Python", url: "https://github.com/shanmukha1013/FeatureFlow", homepage: null, updatedAt: "2026-09-29T16:13:07Z", stars: 0, fork: false },
    { name: "ContextForge", description: null, language: "Python", url: "https://github.com/shanmukha1013/ContextForge", homepage: null, updatedAt: "2026-09-29T16:13:05Z", stars: 0, fork: false },
    { name: "shanmukha-portfolio", description: null, language: "HTML", url: "https://github.com/shanmukha1013/shanmukha-portfolio", homepage: null, updatedAt: "2026-09-29T16:13:09Z", stars: 0, fork: false },
  ],
};

export async function getGitHubProfile(): Promise<GitHubProfile> {
  const headers: Record<string, string> = { Accept: "application/vnd.github+json", "User-Agent": "smokex-site" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const opts = { headers, next: { revalidate: 3600 } } as RequestInit;
  try {
    const [u, r] = await Promise.all([
      fetch(`https://api.github.com/users/${site.githubUser}`, opts),
      fetch(`https://api.github.com/users/${site.githubUser}/repos?per_page=100&sort=updated`, opts),
    ]);
    if (!u.ok || !r.ok) throw new Error(`GitHub API ${u.status}/${r.status}`);
    const user = await u.json();
    const repos = (await r.json()) as Array<Record<string, unknown>>;
    return {
      login: String(user.login),
      name: (user.name as string) ?? null,
      bio: (user.bio as string) ?? null,
      avatarUrl: String(user.avatar_url),
      url: String(user.html_url),
      publicRepos: Number(user.public_repos ?? repos.length),
      fetchedAt: new Date().toISOString(),
      live: true,
      repos: repos
        .filter((x) => x.name !== site.githubUser)
        .map((x) => ({
          name: String(x.name),
          description: (x.description as string) ?? null,
          language: (x.language as string) ?? null,
          url: String(x.html_url),
          homepage: (x.homepage as string) || null,
          updatedAt: String(x.pushed_at ?? x.updated_at),
          stars: Number(x.stargazers_count ?? 0),
          fork: Boolean(x.fork),
        })),
    };
  } catch {
    return SNAPSHOT;
  }
}
