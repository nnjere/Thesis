import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getToolAdapter } from "@/lib/tools";
import { KIND_INFO } from "./labels";
import { CATEGORIES, getProjectByRepo, listProjects, resolveAlternatives } from ".";

const projects = listProjects();

describe("catalog honesty invariants", () => {
  it("has unique slugs", () => {
    expect(new Set(projects.map((p) => p.slug)).size).toBe(projects.length);
  });

  it("only marks built-in demos as verified", () => {
    for (const p of projects.filter((p) => p.status === "verified")) {
      expect(p.source, p.slug).toBe("built-in-demo");
    }
  });

  it("never simulates a built-in demo and never really runs a sample listing", () => {
    for (const p of projects) {
      if (p.source === "built-in-demo") expect(["embedded-web-app", "tool-form"], p.slug).toContain(p.launch.kind);
      if (p.source === "sample-listing") expect(["simulated", "none"], p.slug).toContain(p.launch.kind);
    }
  });

  it("doesn't offer launch for desktop apps or libraries, and marks them not runnable", () => {
    for (const p of projects.filter((p) => p.type === "desktop-app" || p.type === "library")) {
      expect(p.launch.kind, p.slug).toBe("none");
      expect(p.status, p.slug).toBe("not-runnable");
    }
  });

  it("gives every sample listing a real GitHub repository link", () => {
    for (const p of projects.filter((p) => p.source === "sample-listing")) {
      expect(p.repo?.url, p.slug).toBe(`https://github.com/${p.repo?.owner}/${p.repo?.name}`);
      expect(getProjectByRepo(p.repo!.owner.toUpperCase(), p.repo!.name)).toBe(p);
    }
  });

  it("points built-in demos at files and adapters that exist", () => {
    for (const p of projects) {
      if (p.launch.kind === "embedded-web-app") expect(existsSync(path.join(process.cwd(), "public", p.launch.entry)), p.slug).toBe(true);
      if (p.launch.kind === "tool-form") expect(getToolAdapter(p.launch.adapterId)?.selfTest(), p.slug).toBe(true);
    }
  });

  it("resolves every alternative and uses known categories", () => {
    for (const p of projects) {
      expect(resolveAlternatives(p).length, p.slug).toBe(p.alternatives?.length ?? 0);
      expect(CATEGORIES.map((c) => c.id)).toContain(p.category);
    }
  });

  it("gives every project a design kind", () => {
    for (const p of projects) expect(KIND_INFO[p.kind], p.slug).toBeDefined();
  });

  it("covers every category and project type", () => {
    for (const c of CATEGORIES) expect(projects.some((p) => p.category === c.id), c.id).toBe(true);
    for (const t of ["web-app", "cli-tool", "desktop-app", "library"]) expect(projects.some((p) => p.type === t), t).toBe(true);
  });
});
