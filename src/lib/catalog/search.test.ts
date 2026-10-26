import { describe, expect, it } from "vitest";
import { listProjects } from ".";
import { queryTerms, searchCatalog, stemWord } from "./search";

const projects = listProjects();
const top = (q: string, n = 3) => searchCatalog(projects, q).hits.slice(0, n).map((h) => h.project.slug);

describe("natural-language keyword search", () => {
  it("drops filler words and stems", () => {
    expect(queryTerms("A tool that removes backgrounds from images")).toEqual(["remove", "background", "image"].map(stemWord));
    expect(stemWord("visualizes")).toBe(stemWord("visualize"));
  });

  it("finds background removal", () => {
    expect(top("A tool that removes backgrounds from images", 1)).toEqual(["rembg"]);
  });

  it("finds data visualization tools", () => {
    expect(top("Something that visualizes data")).toContain("quick-chart");
  });

  it("finds generative art", () => {
    expect(top("A tool for creating generative art", 2)).toContain("flow-fields");
  });

  it("is honest when there is no exact match", () => {
    const result = searchCatalog(projects, "An AI tool for summarizing documents");
    expect(result.hits.length).toBeGreaterThan(0);
    // Nothing in the catalog summarises documents, but transformers mentions it.
    expect(result.hits[0].project.slug).toBe("transformers");
    expect(result.approximate).toBe(true);
  });

  it("does not flag strong matches as approximate", () => {
    for (const q of ["A tool that removes backgrounds from images", "Something that visualizes data", "A tool for creating generative art"]) {
      expect(searchCatalog(projects, q).approximate, q).toBe(false);
    }
  });

  it("flags weak matches as approximate", () => {
    expect(searchCatalog(projects, "flying submarine banana").approximate).toBe(true);
    expect(searchCatalog(projects, "flying submarine banana").hits).toHaveLength(0);
  });

  it("matches name prefixes", () => {
    expect(top("excali", 1)).toEqual(["excalidraw"]);
  });

  it("applies filters", () => {
    const runnable = searchCatalog(projects, "", { runnableOnly: true }).hits;
    expect(runnable.length).toBeGreaterThan(0);
    expect(runnable.every((h) => h.project.source === "built-in-demo")).toBe(true);
    const desktop = searchCatalog(projects, "", { type: "desktop-app" }).hits;
    expect(desktop.every((h) => h.project.type === "desktop-app")).toBe(true);
  });

  it("lists everything, verified first, for an empty query", () => {
    const hits = searchCatalog(projects, "   ").hits;
    expect(hits).toHaveLength(projects.length);
    expect(hits[0].project.status).toBe("verified");
  });
});
