import { describe, expect, it } from "vitest";
import { ToolInputError, runTool } from ".";
import { countSyllables, readabilityStats } from "./readability";

describe("readability adapter", () => {
  it("counts syllables reasonably", () => {
    expect(countSyllables("cat")).toBe(1);
    expect(countSyllables("table")).toBe(2);
    expect(countSyllables("readable")).toBe(3);
  });

  it("scores simple text as easier than complex text", () => {
    const simple = readabilityStats("The cat sat on the mat. It was warm. The sun was out.");
    const hard = readabilityStats(
      "Notwithstanding considerable organisational heterogeneity, interdisciplinary collaboration necessitates comprehensive communicative infrastructure.",
    );
    expect(simple.readingEase).toBeGreaterThan(hard.readingEase);
    expect(simple.sentences).toBe(3);
  });

  it("flags long sentences and builds a report", () => {
    const long = "This sentence " + "keeps going and ".repeat(10) + "finally ends.";
    const r = runTool("readability", `Short one. ${long}`, { longSentence: "20", includeReport: true });
    expect(r.sections![0].items).toHaveLength(1);
    expect(r.download?.filename).toBe("readability-report.md");
  });

  it("ignores options it doesn't declare and invalid choices", () => {
    const r = runTool("readability", "Hello there. How are you?", { longSentence: "9999", includeReport: "yes", shell: "rm -rf /" });
    expect(r.download).toBeDefined(); // fell back to defaults
  });
});

describe("markdown-to-html adapter", () => {
  it("renders markdown into a standalone document", () => {
    const r = runTool("markdown-to-html", "# Hello\n\n- one\n- two", { theme: "classic", toc: false });
    expect(r.previewHtml).toContain("<h1");
    expect(r.previewHtml).toContain("<li>one</li>");
    expect(r.previewHtml).toContain("Georgia");
    expect(r.download?.filename).toBe("hello.html");
  });

  it("never passes raw HTML, scripts or unsafe links through", () => {
    const r = runTool(
      "markdown-to-html",
      '# T\n\n<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[click](javascript:alert(1)) ![p](https://tracker.example/p.png)',
      { title: '</title><script>alert(1)</script>' },
    );
    const html = r.previewHtml!;
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/<img/i);
    expect(html).not.toMatch(/javascript:/i);
    expect(html).not.toContain("tracker.example");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("default-src 'none'");
  });
});

describe("runTool input validation", () => {
  it("rejects unknown tools, empty input and oversized input", () => {
    expect(() => runTool("rm", "x", {})).toThrow(ToolInputError);
    expect(() => runTool("toString", "x", {})).toThrow(ToolInputError);
    expect(() => runTool("readability", "   ", {})).toThrow(ToolInputError);
    expect(() => runTool("readability", 42, {})).toThrow(ToolInputError);
    expect(() => runTool("readability", "a".repeat(200_001), {})).toThrow(/too long/);
  });
});
