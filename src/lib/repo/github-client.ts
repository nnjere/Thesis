import { assertReadOnlyGitHubRequest } from "@/lib/safety/workflow-protection";

/**
 * A deliberately limited GitHub client. It can only make GET requests to an
 * allowlist of public endpoints (see workflow-protection.ts), caps response
 * sizes, and treats everything it receives as untrusted data.
 */

export type GitHubErrorCode = "not_found" | "rate_limited" | "network" | "too_large" | "unexpected";

export class GitHubError extends Error {
  constructor(
    public readonly code: GitHubErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

export interface RepoMetadata {
  fullName: string;
  description: string | null;
  homepage: string | null;
  language: string | null;
  topics: string[];
  license: string | null;
  stars: number;
  archived: boolean;
  isFork: boolean;
  defaultBranch: string;
  owner: { login: string; type: string; url: string };
  pushedAt: string | null;
  sizeKb: number;
}

export interface DirEntry {
  name: string;
  path: string;
  type: "file" | "dir" | "symlink" | "submodule";
  size: number;
}

export interface ReleaseInfo {
  name: string | null;
  tag: string;
  url: string;
  assetNames: string[];
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const API_BASE = "https://api.github.com";
const MAX_FILE_BYTES = 200_000;
const MAX_JSON_BYTES = 2_000_000;
const TIMEOUT_MS = 8_000;

export class GitHubReadOnlyClient {
  constructor(
    private readonly fetchImpl: FetchLike = fetch,
    private readonly token: string | undefined = process.env.GITHUB_TOKEN || undefined,
  ) {}

  private async request(path: string, method: "GET" | "HEAD" = "GET"): Promise<unknown> {
    assertReadOnlyGitHubRequest(method, path);
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "openly-prototype (read-only repository analysis)",
    };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    let res: Response;
    try {
      res = await this.fetchImpl(`${API_BASE}${path}`, {
        method,
        headers,
        redirect: "follow",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      });
    } catch (err) {
      throw new GitHubError("network", `Could not reach GitHub: ${(err as Error).message}`);
    }

    if (res.status === 404) throw new GitHubError("not_found", `GitHub returned 404 for ${path}`);
    if (res.status === 403 || res.status === 429) {
      const remaining = res.headers.get("x-ratelimit-remaining");
      throw new GitHubError(
        remaining === "0" || res.status === 429 ? "rate_limited" : "unexpected",
        `GitHub returned ${res.status} for ${path}`,
      );
    }
    if (!res.ok) throw new GitHubError("unexpected", `GitHub returned ${res.status} for ${path}`);

    const text = await res.text();
    if (text.length > MAX_JSON_BYTES) throw new GitHubError("too_large", `Response for ${path} too large`);
    try {
      return JSON.parse(text);
    } catch {
      throw new GitHubError("unexpected", `GitHub returned invalid JSON for ${path}`);
    }
  }

  private repoPath(owner: string, name: string): string {
    return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
  }

  async getRepo(owner: string, name: string): Promise<RepoMetadata> {
    const data = (await this.request(this.repoPath(owner, name))) as Record<string, any>;
    return {
      fullName: String(data.full_name ?? `${owner}/${name}`),
      description: typeof data.description === "string" ? data.description.slice(0, 500) : null,
      homepage: safeHttpUrl(data.homepage),
      language: typeof data.language === "string" ? data.language : null,
      topics: Array.isArray(data.topics) ? data.topics.filter((t: unknown) => typeof t === "string").slice(0, 30) : [],
      license: typeof data.license?.spdx_id === "string" && data.license.spdx_id !== "NOASSERTION" ? data.license.spdx_id : null,
      stars: Number(data.stargazers_count) || 0,
      archived: Boolean(data.archived),
      isFork: Boolean(data.fork),
      defaultBranch: String(data.default_branch ?? "main"),
      owner: {
        login: String(data.owner?.login ?? owner),
        type: String(data.owner?.type ?? "User"),
        url: `https://github.com/${encodeURIComponent(String(data.owner?.login ?? owner))}`,
      },
      pushedAt: typeof data.pushed_at === "string" ? data.pushed_at : null,
      sizeKb: Number(data.size) || 0,
    };
  }

  async listDirectory(owner: string, name: string, dir = ""): Promise<DirEntry[]> {
    const suffix = dir ? `/contents/${dir.split("/").map(encodeURIComponent).join("/")}` : "/contents";
    const data = await this.request(this.repoPath(owner, name) + suffix);
    if (!Array.isArray(data)) return [];
    return data.slice(0, 500).map((e: Record<string, any>) => ({
      name: String(e.name),
      path: String(e.path),
      type: ["file", "dir", "symlink", "submodule"].includes(e.type) ? e.type : "file",
      size: Number(e.size) || 0,
    }));
  }

  /** Returns a text file's content, or null if it is missing or too large. */
  async getTextFile(owner: string, name: string, path: string): Promise<string | null> {
    const encoded = path.split("/").map(encodeURIComponent).join("/");
    let data: Record<string, any>;
    try {
      data = (await this.request(`${this.repoPath(owner, name)}/contents/${encoded}`)) as Record<string, any>;
    } catch (err) {
      if (err instanceof GitHubError && err.code === "not_found") return null;
      throw err;
    }
    return decodeContent(data);
  }

  async getReadme(owner: string, name: string): Promise<string | null> {
    try {
      const data = (await this.request(`${this.repoPath(owner, name)}/readme`)) as Record<string, any>;
      return decodeContent(data);
    } catch (err) {
      if (err instanceof GitHubError && err.code === "not_found") return null;
      throw err;
    }
  }

  async getLatestRelease(owner: string, name: string): Promise<ReleaseInfo | null> {
    try {
      const data = (await this.request(`${this.repoPath(owner, name)}/releases/latest`)) as Record<string, any>;
      const url = safeHttpUrl(data.html_url);
      if (!url) return null;
      return {
        name: typeof data.name === "string" ? data.name.slice(0, 200) : null,
        tag: String(data.tag_name ?? ""),
        url,
        assetNames: Array.isArray(data.assets) ? data.assets.slice(0, 50).map((a: any) => String(a.name)) : [],
      };
    } catch (err) {
      if (err instanceof GitHubError && err.code === "not_found") return null;
      throw err;
    }
  }
}

function decodeContent(data: Record<string, any>): string | null {
  if (data?.type !== "file" || typeof data.content !== "string") return null;
  if (Number(data.size) > MAX_FILE_BYTES) return null;
  if (data.encoding !== "base64") return null;
  return Buffer.from(data.content, "base64").toString("utf8").slice(0, MAX_FILE_BYTES);
}

/** Only allow plain http(s) links from untrusted metadata (no javascript: etc). */
export function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}
