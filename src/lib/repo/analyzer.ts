import { classify, type Classification } from "@/lib/classify/classifier";
import { GitHubError, GitHubReadOnlyClient, type DirEntry, type RepoMetadata } from "./github-client";
import {
  SIGNAL_FILES,
  parseCargo,
  parseCompose,
  parseGoMod,
  parseMakefileTargets,
  parsePackageJson,
  parsePyproject,
  parseRequirements,
  readmeSignals,
  type RepoSignals,
} from "./signals";
import type { RepoRef } from "./url";

/**
 * Repository analysis: reads public metadata and a handful of configuration
 * files, then classifies the project. Nothing is downloaded beyond those
 * files and nothing is executed.
 */

export interface RepoAnalysis {
  repo: RepoRef;
  metadata: RepoMetadata;
  signals: RepoSignals;
  classification: Classification;
  releaseUrl: string | null;
  /** Files we read, for transparency. */
  filesRead: string[];
  analyzedAt: string;
}

export type AnalysisFailure = {
  code: "not_found" | "rate_limited" | "network" | "unexpected";
  /** Plain-English message for users. */
  message: string;
  /** Kept for diagnostics only. */
  detail: string;
};

const FRIENDLY: Record<AnalysisFailure["code"], string> = {
  not_found: "We couldn't find that project. It may be private, renamed or deleted.",
  rate_limited: "GitHub is asking us to slow down. Please try again in a few minutes.",
  network: "We couldn't reach GitHub just now. Check your connection or try again shortly.",
  unexpected: "Something went wrong while looking at this project. Please try again.",
};

export async function analyzeRepository(
  repo: RepoRef,
  client = new GitHubReadOnlyClient(),
): Promise<{ ok: true; analysis: RepoAnalysis } | { ok: false; error: AnalysisFailure }> {
  try {
    const metadata = await client.getRepo(repo.owner, repo.name);
    const root = await client.listDirectory(repo.owner, repo.name);
    const rootFiles = root.filter((e) => e.type === "file").map((e) => e.name);
    const rootDirs = root.filter((e) => e.type === "dir").map((e) => e.name);
    const filesRead: string[] = [];

    const read = async (path: string) => {
      const text = await client.getTextFile(repo.owner, repo.name, path);
      if (text !== null) filesRead.push(path);
      return text;
    };

    const present = SIGNAL_FILES.filter((f) => hasEntry(root, f));
    const contents = Object.fromEntries(await Promise.all(present.map(async (f) => [f, await read(f)] as const)));

    let devcontainer = false;
    if (rootDirs.includes(".devcontainer")) {
      const entries = await client.listDirectory(repo.owner, repo.name, ".devcontainer").catch(() => []);
      devcontainer = entries.some((e) => e.name === "devcontainer.json");
      if (devcontainer) filesRead.push(".devcontainer/devcontainer.json (listed, not read)");
    }
    if (rootFiles.includes(".devcontainer.json")) devcontainer = true;

    const readmeText = await client.getReadme(repo.owner, repo.name);
    if (readmeText !== null) filesRead.push("README");
    const release = await client.getLatestRelease(repo.owner, repo.name).catch(() => null);

    const composeText =
      contents["compose.yaml"] ?? contents["compose.yml"] ?? contents["docker-compose.yml"] ?? contents["docker-compose.yaml"];
    const pyText = [contents["requirements.txt"], contents["pyproject.toml"]];

    const signals: RepoSignals = {
      rootFiles,
      rootDirs,
      language: metadata.language,
      topics: metadata.topics,
      archived: metadata.archived,
      packageJson: contents["package.json"] ? parsePackageJson(contents["package.json"]) : undefined,
      python:
        pyText[0] || pyText[1]
          ? (() => {
              const py = pyText[1] ? parsePyproject(pyText[1]) : { deps: [], hasScripts: false };
              return { deps: [...new Set([...py.deps, ...(pyText[0] ? parseRequirements(pyText[0]) : [])])], hasScripts: py.hasScripts };
            })()
          : undefined,
      cargo: contents["Cargo.toml"] ? parseCargo(contents["Cargo.toml"]) : undefined,
      goModule: contents["go.mod"]
        ? { ...parseGoMod(contents["go.mod"]), hasMainAtRoot: rootFiles.includes("main.go"), hasCmdDir: rootDirs.includes("cmd") }
        : undefined,
      dockerfile: contents["Dockerfile"] ? { exposesPort: /^\s*EXPOSE\s+\d+/im.test(contents["Dockerfile"]) } : undefined,
      compose: composeText ? { services: parseCompose(composeText) } : undefined,
      devcontainer,
      makefileTargets: contents["Makefile"] ? parseMakefileTargets(contents["Makefile"]) : [],
      hasEnvExample: rootFiles.some((f) => /^\.env\.(example|sample|template)$/i.test(f) || f === "example.env"),
      hasIndexHtml: rootFiles.includes("index.html"),
      mobile: {
        flutter: rootFiles.includes("pubspec.yaml"),
        android: rootDirs.includes("android") || rootFiles.includes("build.gradle") || rootFiles.includes("build.gradle.kts"),
        ios: rootDirs.includes("ios") || rootDirs.some((d) => d.endsWith(".xcodeproj")),
      },
      readme: readmeText ? readmeSignals(readmeText) : null,
      releaseAssets: release?.assetNames ?? [],
    };

    return {
      ok: true,
      analysis: {
        repo,
        metadata,
        signals,
        classification: classify(signals),
        releaseUrl: release?.url ?? null,
        filesRead,
        analyzedAt: new Date().toISOString(),
      },
    };
  } catch (err) {
    const code: AnalysisFailure["code"] =
      err instanceof GitHubError && err.code !== "too_large" ? err.code : "unexpected";
    return { ok: false, error: { code, message: FRIENDLY[code], detail: (err as Error).message } };
  }
}

function hasEntry(entries: DirEntry[], name: string): boolean {
  return entries.some((e) => e.type === "file" && e.name === name);
}

// Small in-memory cache so repeated lookups don't burn the GitHub rate limit.
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; value: Awaited<ReturnType<typeof analyzeRepository>> }>();

export async function analyzeRepositoryCached(repo: RepoRef) {
  const key = `${repo.owner}/${repo.name}`.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;
  const value = await analyzeRepository(repo);
  // Don't cache transient failures.
  if (value.ok || value.error.code === "not_found") {
    if (cache.size > 200) cache.delete(cache.keys().next().value!);
    cache.set(key, { at: Date.now(), value });
  }
  return value;
}
