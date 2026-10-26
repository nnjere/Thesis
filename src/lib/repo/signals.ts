/**
 * Turns raw repository files into structured signals. Every input here is
 * untrusted: files are parsed as data (JSON.parse or simple line scanning),
 * never executed, and sizes are capped by the GitHub client.
 */

export const SIGNAL_FILES = [
  "package.json",
  "requirements.txt",
  "pyproject.toml",
  "go.mod",
  "Cargo.toml",
  "Dockerfile",
  "compose.yaml",
  "compose.yml",
  "docker-compose.yml",
  "docker-compose.yaml",
  "Makefile",
  "pubspec.yaml",
] as const;

export interface PackageJsonSignals {
  name?: string;
  deps: string[];
  scripts: Record<string, string>;
  hasBin: boolean;
  hasEntry: boolean;
  workspaces: boolean;
}

export interface RepoSignals {
  /** Root-level file and directory names. */
  rootFiles: string[];
  rootDirs: string[];
  language: string | null;
  topics: string[];
  archived: boolean;
  packageJson?: PackageJsonSignals;
  python?: { deps: string[]; hasScripts: boolean };
  cargo?: { hasBin: boolean; hasLib: boolean; deps: string[] };
  goModule?: { module: string; deps: string[]; hasMainAtRoot: boolean; hasCmdDir: boolean };
  dockerfile?: { exposesPort: boolean };
  compose?: { services: string[] };
  devcontainer: boolean;
  makefileTargets: string[];
  hasEnvExample: boolean;
  hasIndexHtml: boolean;
  mobile: { flutter: boolean; android: boolean; ios: boolean };
  readme: ReadmeSignals | null;
  releaseAssets: string[];
}

export interface ReadmeSignals {
  /** First readable paragraph, stripped of markup. Untrusted text. */
  excerpt: string | null;
  mentionsLocalhost: boolean;
  mentionsDownload: boolean;
  libraryInstall: boolean;
  cliUsage: boolean;
}

export function parsePackageJson(text: string): PackageJsonSignals | undefined {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return undefined;
  }
  if (!data || typeof data !== "object") return undefined;
  const pkg = data as Record<string, unknown>;
  const depObj = (key: string) =>
    pkg[key] && typeof pkg[key] === "object" ? Object.keys(pkg[key] as object) : [];
  const scripts: Record<string, string> = {};
  if (pkg.scripts && typeof pkg.scripts === "object") {
    for (const [k, v] of Object.entries(pkg.scripts as Record<string, unknown>)) {
      if (typeof v === "string") scripts[k] = v.slice(0, 300);
    }
  }
  return {
    name: typeof pkg.name === "string" ? pkg.name : undefined,
    deps: [...new Set([...depObj("dependencies"), ...depObj("devDependencies"), ...depObj("peerDependencies")])],
    scripts,
    hasBin: Boolean(pkg.bin),
    hasEntry: Boolean(pkg.main || pkg.exports || pkg.module),
    workspaces: Boolean(pkg.workspaces),
  };
}

function normalisePythonDep(line: string): string | null {
  const cleaned = line.replace(/#.*/, "").trim();
  if (!cleaned || cleaned.startsWith("-")) return null;
  const match = cleaned.match(/^([A-Za-z0-9_.-]+)/);
  return match ? match[1].toLowerCase().replace(/_/g, "-") : null;
}

export function parseRequirements(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map(normalisePythonDep)
    .filter((d): d is string => Boolean(d));
}

/** Minimal pyproject scan. Not a full TOML parser: we only need hints. */
export function parsePyproject(text: string): { deps: string[]; hasScripts: boolean } {
  const hasScripts = /^\s*\[(project\.scripts|tool\.poetry\.scripts|project\.gui-scripts)\]/m.test(text);
  const deps = new Set<string>();
  const arrayMatch = text.match(/^\s*dependencies\s*=\s*\[([\s\S]*?)\]/m);
  if (arrayMatch) {
    for (const m of arrayMatch[1].matchAll(/["']([^"']+)["']/g)) {
      const dep = normalisePythonDep(m[1]);
      if (dep) deps.add(dep);
    }
  }
  const poetry = text.match(/^\s*\[tool\.poetry\.dependencies\]([\s\S]*?)(^\s*\[|$(?![\s\S]))/m);
  if (poetry) {
    for (const line of poetry[1].split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_.-]+)\s*=/);
      if (m && m[1].toLowerCase() !== "python") deps.add(m[1].toLowerCase().replace(/_/g, "-"));
    }
  }
  return { deps: [...deps], hasScripts };
}

export function parseCargo(text: string): { hasBin: boolean; hasLib: boolean; deps: string[] } {
  const deps: string[] = [];
  const section = text.match(/^\s*\[dependencies\]([\s\S]*?)(^\s*\[|$(?![\s\S]))/m);
  if (section) {
    for (const line of section[1].split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_-]+)\s*=/);
      if (m) deps.push(m[1]);
    }
  }
  return { hasBin: /^\s*\[\[bin\]\]/m.test(text), hasLib: /^\s*\[lib\]/m.test(text), deps };
}

export function parseGoMod(text: string): { module: string; deps: string[] } {
  const module = text.match(/^\s*module\s+(\S+)/m)?.[1] ?? "";
  const deps = [...text.matchAll(/^\s*(?:require\s+)?([a-z0-9.-]+\.[a-z]+\/\S+)\s+v[\d.]+/gm)].map((m) => m[1]);
  return { module, deps };
}

export function parseCompose(text: string): string[] {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => /^services:\s*$/.test(l));
  if (start === -1) return [];
  const services: string[] = [];
  let indent: number | null = null;
  for (const line of lines.slice(start + 1)) {
    if (/^\S/.test(line)) break; // next top-level key
    const m = line.match(/^(\s+)([A-Za-z0-9_.-]+):\s*$/);
    if (!m) continue;
    if (indent === null) indent = m[1].length;
    if (m[1].length === indent) services.push(m[2]);
  }
  return services.slice(0, 30);
}

export function parseMakefileTargets(text: string): string[] {
  return [...new Set([...text.matchAll(/^([A-Za-z0-9_-]+):(?!=)/gm)].map((m) => m[1]))].slice(0, 30);
}

/** Strip markdown/HTML to plain text for a short, safe excerpt. */
export function readmeExcerpt(markdown: string): string | null {
  const withoutCode = markdown.replace(/```[\s\S]*?```/g, " ").replace(/<!--[\s\S]*?-->/g, " ");
  const paragraphs = withoutCode.split(/\n\s*\n/);
  for (const para of paragraphs) {
    const text = para
      .replace(/<[^>]*>/g, " ")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/^[#>*\-\s]+/gm, "")
      .replace(/[`*_~|]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    // Skip headings, badge rows and very short fragments.
    if (text.length >= 40 && /[a-z]{3,}\s+[a-z]{2,}/i.test(text)) {
      return text.length > 400 ? text.slice(0, 397).trimEnd() + "…" : text;
    }
  }
  return null;
}

export function readmeSignals(markdown: string): ReadmeSignals {
  const lower = markdown.toLowerCase();
  return {
    excerpt: readmeExcerpt(markdown),
    mentionsLocalhost: /localhost:\d{2,5}|127\.0\.0\.1:\d{2,5}/.test(lower),
    mentionsDownload: /\b(download|releases page|\.dmg|\.exe|\.appimage|app store|google play|homebrew cask)\b/.test(lower),
    libraryInstall:
      /(npm (install|i)|yarn add|pnpm add|pip install|cargo add|go get)\s+[@a-z0-9]/.test(lower) &&
      /\b(import|require\(|from\s+\S+\s+import|use\s+[a-z_]+::)/.test(lower),
    cliUsage: /\busage:|^\s*\$\s+[a-z]/m.test(lower) || /--help\b/.test(lower),
  };
}
