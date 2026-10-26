import { Marked } from "marked";
import type { ToolAdapter, ToolResult } from "./types";

const SAMPLE = `# Team picnic plan

Thanks for helping out! Here's everything in **one place**.

## What to bring

- Something to share (snacks, fruit or drinks)
- A blanket or folding chair
- Sun cream

## Schedule

1. Meet at the park gates at 12:00
2. Lunch at 12:30
3. Games from 14:00

> If it rains, we'll move to the community hall.

Questions? Reply to the group email.
`;

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Markdown renderer that never passes raw HTML through and drops unsafe links. */
function createRenderer() {
  const marked = new Marked({ gfm: true, breaks: false, async: false });
  marked.use({
    renderer: {
      html({ text }) {
        return escapeHtml(text);
      },
      link({ href, title, tokens }) {
        const label = this.parser.parseInline(tokens);
        if (!/^(https?:|mailto:|#)/i.test(href)) return label;
        const t = title ? ` title="${escapeHtml(title)}"` : "";
        return `<a href="${escapeHtml(href)}"${t} rel="noopener noreferrer">${label}</a>`;
      },
      image({ text }) {
        // Remote images could be used for tracking; show the description instead.
        return `<span class="img-note">[image: ${escapeHtml(text)}]</span>`;
      },
    },
  });
  return marked;
}

const THEMES: Record<string, string> = {
  clean: `body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#1f2330;background:#fff}h1,h2,h3{color:#111827;line-height:1.25}a{color:#4f46e5}blockquote{border-left:4px solid #c7d2fe;background:#eef2ff;margin:1em 0;padding:.6em 1em;color:#3730a3}code{background:#f3f4f6;padding:.1em .35em;border-radius:4px}`,
  classic: `body{font-family:Georgia,"Times New Roman",serif;color:#2b2118;background:#fffdf8}h1,h2,h3{font-weight:600;color:#3b2a1a;line-height:1.25}h1{border-bottom:2px solid #d6c7b0;padding-bottom:.3em}a{color:#8a4b14}blockquote{font-style:italic;border-left:3px solid #d6c7b0;margin:1em 0;padding:.2em 1em;color:#5b4632}code{background:#f4ede1;padding:.1em .35em;border-radius:3px}`,
  night: `body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#e5e7eb;background:#111827}h1,h2,h3{color:#fff;line-height:1.25}a{color:#a5b4fc}blockquote{border-left:4px solid #6366f1;background:#1f2937;margin:1em 0;padding:.6em 1em}code{background:#1f2937;padding:.1em .35em;border-radius:4px}`,
};

export function renderDocument(markdown: string, opts: { theme: string; title: string; toc: boolean }): string {
  const marked = createRenderer();
  const tokens = marked.lexer(markdown);
  const headings = tokens.filter((t) => t.type === "heading" && (t as { depth: number }).depth <= 3) as {
    depth: number;
    text: string;
  }[];
  const body = marked.parser(tokens);

  let tocHtml = "";
  if (opts.toc && headings.length > 1) {
    tocHtml = `<nav class="toc"><strong>Contents</strong><ul>${headings
      .map((h) => `<li style="margin-left:${(h.depth - 1) * 1}em">${escapeHtml(h.text)}</li>`)
      .join("")}</ul></nav>`;
  }

  const firstHeading = headings.find((h) => h.depth === 1)?.text;
  const title = escapeHtml(opts.title.trim() || firstHeading || "Document");
  const css = THEMES[opts.theme] ?? THEMES.clean;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">
<title>${title}</title>
<style>
body{max-width:720px;margin:0 auto;padding:40px 24px;line-height:1.65;font-size:17px}
img{max-width:100%}.img-note{color:#6b7280;font-style:italic}
.toc{border:1px solid rgba(128,128,128,.3);border-radius:8px;padding:12px 16px;margin-bottom:2em}.toc ul{margin:.4em 0 0;padding-left:1.1em}
table{border-collapse:collapse}td,th{border:1px solid rgba(128,128,128,.4);padding:4px 10px}
@media print{body{padding:0}}
${css}
</style>
</head>
<body>
${tocHtml}
${body}
</body>
</html>`;
}

export const markdownToHtmlAdapter: ToolAdapter = {
  spec: {
    id: "markdown-to-html",
    actionLabel: "Create document",
    input: {
      label: "Your formatted text (Markdown)",
      placeholder: "# My title\n\nWrite here. Use - for bullets and **double stars** for bold.",
      accept: [".md", ".markdown", ".txt"],
      maxBytes: 200_000,
      sample: SAMPLE,
    },
    options: [
      {
        id: "theme",
        kind: "select",
        label: "Style",
        choices: [
          { value: "clean", label: "Clean & modern" },
          { value: "classic", label: "Classic print" },
          { value: "night", label: "Night mode" },
        ],
        default: "clean",
      },
      { id: "title", kind: "text", label: "Document title (optional)", default: "", maxLength: 120 },
      { id: "toc", kind: "boolean", label: "Add a table of contents", default: false },
    ],
  },

  run(text, options): ToolResult {
    const html = renderDocument(text, {
      theme: String(options.theme),
      title: String(options.title ?? ""),
      toc: Boolean(options.toc),
    });
    const titleMatch = html.match(/<title>([^<]*)<\/title>/);
    const slug =
      (titleMatch?.[1] ?? "document")
        .toLowerCase()
        .replace(/&[a-z#0-9]+;/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60) || "document";
    return {
      summary: "Your document is ready. Preview it below, download it, then open it in any browser or print it to PDF.",
      previewHtml: html,
      download: { filename: `${slug}.html`, mimeType: "text/html", content: html },
    };
  },

  selfTest() {
    const r = markdownToHtmlAdapter.run(SAMPLE, { theme: "clean", title: "", toc: true });
    return Boolean(r.previewHtml?.includes("<h1") && r.previewHtml.includes("Contents"));
  },
};
