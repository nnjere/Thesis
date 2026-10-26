import type { ToolAdapter, ToolResult } from "./types";

const SAMPLE = `Open-source software is software whose source code anyone can read, change and share. Many of the tools you use every day depend on it.

However, trying an open-source project often requires installing development tools, reading lengthy technical documentation, configuring environment variables and running unfamiliar commands in a terminal window, which prevents a great many curious people from ever experiencing what these projects can actually do for them.

This prototype tries to remove those barriers. You pick a project and press a button.`;

export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const trimmed = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  const groups = trimmed.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"“'‘(])/)
    .map((s) => s.trim())
    .filter((s) => /[A-Za-z]/.test(s));
}

export function words(text: string): string[] {
  return text.match(/[A-Za-z]+(?:['’][A-Za-z]+)*/g) ?? [];
}

export interface ReadabilityStats {
  words: number;
  sentences: number;
  syllables: number;
  readingEase: number;
  grade: number;
  avgSentenceLength: number;
  readingMinutes: number;
}

export function readabilityStats(text: string): ReadabilityStats {
  const ws = words(text);
  const sentences = Math.max(1, splitSentences(text).length);
  const syllables = ws.reduce((n, w) => n + countSyllables(w), 0);
  const wc = Math.max(1, ws.length);
  const readingEase = 206.835 - 1.015 * (wc / sentences) - 84.6 * (syllables / wc);
  const grade = 0.39 * (wc / sentences) + 11.8 * (syllables / wc) - 15.59;
  return {
    words: ws.length,
    sentences,
    syllables,
    readingEase: Math.round(readingEase * 10) / 10,
    grade: Math.max(0, Math.round(grade * 10) / 10),
    avgSentenceLength: Math.round((wc / sentences) * 10) / 10,
    readingMinutes: Math.max(1, Math.round(ws.length / 230)),
  };
}

function verdict(ease: number): string {
  if (ease >= 80) return "Very easy to read. Most people will understand it quickly.";
  if (ease >= 60) return "Plain English. Easy for most adults to read.";
  if (ease >= 50) return "Fairly difficult. Some readers may need to slow down.";
  if (ease >= 30) return "Difficult. Best suited to readers with a college education.";
  return "Very difficult. Consider shorter sentences and simpler words.";
}

export const readabilityAdapter: ToolAdapter = {
  spec: {
    id: "readability",
    actionLabel: "Check my writing",
    input: {
      label: "Your text",
      placeholder: "Paste a letter, article or set of instructions…",
      accept: [".txt", ".md"],
      maxBytes: 200_000,
      sample: SAMPLE,
    },
    options: [
      {
        id: "longSentence",
        kind: "select",
        label: "Flag sentences longer than",
        choices: [
          { value: "20", label: "20 words (strict)" },
          { value: "25", label: "25 words (recommended)" },
          { value: "35", label: "35 words (relaxed)" },
        ],
        default: "25",
      },
      { id: "includeReport", kind: "boolean", label: "Prepare a downloadable report", default: true },
    ],
  },

  run(text, options): ToolResult {
    const stats = readabilityStats(text);
    const limit = Number(options.longSentence) || 25;
    const longOnes = splitSentences(text)
      .map((s) => ({ s, n: words(s).length }))
      .filter((x) => x.n > limit)
      .slice(0, 20);

    const metrics = [
      { label: "Reading ease", value: String(stats.readingEase), hint: "0–100, higher is easier (Flesch)" },
      { label: "School grade", value: String(stats.grade), hint: "US grade level (Flesch–Kincaid)" },
      { label: "Words", value: stats.words.toLocaleString("en") },
      { label: "Sentences", value: String(stats.sentences) },
      { label: "Words per sentence", value: String(stats.avgSentenceLength), hint: "Aim for 15–20" },
      { label: "Reading time", value: `${stats.readingMinutes} min` },
    ];
    const sections = [
      {
        title: longOnes.length ? `Sentences longer than ${limit} words` : "Sentence length",
        items: longOnes.length
          ? longOnes.map((x) => `(${x.n} words) ${x.s}`)
          : [`No sentences are longer than ${limit} words. Nice work.`],
      },
    ];

    const result: ToolResult = { summary: verdict(stats.readingEase), metrics, sections };
    if (options.includeReport) {
      const report = [
        "# Readability report",
        "",
        `**Verdict:** ${result.summary}`,
        "",
        ...metrics.map((m) => `- ${m.label}: ${m.value}${m.hint ? ` (${m.hint})` : ""}`),
        "",
        `## ${sections[0].title}`,
        "",
        ...sections[0].items.map((i) => `- ${i}`),
        "",
      ].join("\n");
      result.download = { filename: "readability-report.md", mimeType: "text/markdown", content: report };
    }
    return result;
  },

  selfTest() {
    const r = readabilityAdapter.run(SAMPLE, { longSentence: "25", includeReport: true });
    return Boolean(r.metrics?.length && r.download?.content.includes("Readability report"));
  },
};
