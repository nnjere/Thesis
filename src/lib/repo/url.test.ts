import { describe, expect, it } from "vitest";
import { parseGitHubUrl } from "./url";

describe("parseGitHubUrl", () => {
  it.each([
    ["https://github.com/excalidraw/excalidraw", "excalidraw", "excalidraw"],
    ["github.com/jqlang/jq", "jqlang", "jq"],
    ["www.github.com/jgm/pandoc/", "jgm", "pandoc"],
    ["https://github.com/processing/p5.js/tree/main/src", "processing", "p5.js"],
    ["https://github.com/openai/whisper.git", "openai", "whisper"],
    ["git@github.com:d3/d3.git", "d3", "d3"],
    ["apache/superset", "apache", "superset"],
    ["  https://github.com/a/b?tab=readme  ", "a", "b"],
  ])("accepts %s", (input, owner, name) => {
    const r = parseGitHubUrl(input);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.repo).toEqual({ owner, name, url: `https://github.com/${owner}/${name}` });
  });

  it.each([
    "",
    "https://gitlab.com/a/b",
    "https://github.com.evil.com/a/b",
    "https://github.com/excalidraw",
    "https://github.com/settings/profile",
    "javascript:alert(1)",
    "ftp://github.com/a/b",
    "https://user:pass@github.com/a/b",
    "https://github.com:8443/a/b",
    "https://github.com/-bad/b",
    "https://github.com/a/..",
    "not a url at all",
  ])("rejects %s with a friendly reason", (input) => {
    const r = parseGitHubUrl(input);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/[A-Z]/);
  });
});
