"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { OptionValues, ToolResult, ToolSpec } from "@/lib/tools/types";

function defaults(spec: ToolSpec): OptionValues {
  return Object.fromEntries(spec.options.map((o) => [o.id, o.default]));
}

/**
 * Generic form for a command-line tool adapter. It renders only the inputs
 * and options the adapter declares.
 */
export function ToolRunner({ sessionId, spec, onSessionEnded }: { sessionId: string; spec: ToolSpec; onSessionEnded: () => void }) {
  const [text, setText] = useState("");
  const [options, setOptions] = useState<OptionValues>(() => defaults(spec));
  const [result, setResult] = useState<ToolResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    setError(null);
    if (!file) return;
    const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
    if (!spec.input.accept.includes(ext)) {
      setError(`That file type isn't supported. Please choose a ${spec.input.accept.join(", ")} file.`);
      return;
    }
    if (file.size > spec.input.maxBytes) {
      setError(`That file is too large. The limit is about ${Math.round(spec.input.maxBytes / 1000)} KB.`);
      return;
    }
    setText(await file.text());
    setFileName(file.name);
  }

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/tools/${spec.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, text, options }),
      });
      const data = await res.json();
      if (res.status === 409) return onSessionEnded();
      if (!res.ok) return setError(data?.error?.message ?? "Something went wrong. Please try again.");
      setResult(data.result);
      requestAnimationFrame(() => document.getElementById("tool-result")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch {
      setError("We couldn't reach our servers. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!result?.download) return;
    const blob = new Blob([result.download.content], { type: result.download.mimeType });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = result.download.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <section className="rounded-card border border-border bg-surface p-6 shadow-sm" aria-labelledby="tool-input">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label id="tool-input" htmlFor="tool-text" className="text-lg font-[650]">{spec.input.label}</label>
          <div className="flex gap-2 text-sm">
            <button type="button" onClick={() => { setText(spec.input.sample); setFileName(null); }} className="rounded-full bg-hover px-3 py-1.5 font-semibold hover:bg-ink-2/10">
              Use example
            </button>
            <label className="cursor-pointer rounded-full bg-hover px-3 py-1.5 font-semibold hover:bg-ink-2/10">
              Upload file
              <input type="file" accept={spec.input.accept.join(",")} className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
          </div>
        </div>
        {fileName && <p className="mt-2 text-sm text-muted">Loaded {fileName}</p>}
        <textarea
          id="tool-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={spec.input.placeholder}
          className="mt-3 h-64 w-full resize-y rounded-md border border-border-strong bg-bg p-4 text-[15px] leading-relaxed outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
        />

        <fieldset className="mt-5 space-y-4">
          <legend className="text-sm font-[650] text-muted">Options</legend>
          {spec.options.map((opt) => (
            <div key={opt.id}>
              {opt.kind === "select" && (
                <label className="block text-sm font-semibold">
                  {opt.label}
                  <select
                    value={String(options[opt.id])}
                    onChange={(e) => setOptions((o) => ({ ...o, [opt.id]: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-border-strong bg-surface px-3 py-2 font-normal"
                  >
                    {opt.choices.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </label>
              )}
              {opt.kind === "boolean" && (
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={Boolean(options[opt.id])}
                    onChange={(e) => setOptions((o) => ({ ...o, [opt.id]: e.target.checked }))}
                    className="h-4 w-4 accent-primary"
                  />
                  {opt.label}
                </label>
              )}
              {opt.kind === "text" && (
                <label className="block text-sm font-semibold">
                  {opt.label}
                  <input
                    value={String(options[opt.id])}
                    maxLength={opt.maxLength}
                    onChange={(e) => setOptions((o) => ({ ...o, [opt.id]: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-border-strong bg-surface px-3 py-2 font-normal"
                  />
                </label>
              )}
              {opt.help && <p className="mt-1 text-xs text-muted">{opt.help}</p>}
            </div>
          ))}
        </fieldset>

        {error && <p className="mt-4 rounded-md bg-diff-del-bg px-3 py-2 text-sm text-diff-del-ink" role="alert">{error}</p>}
        <button
          type="button"
          onClick={run}
          disabled={busy || !text.trim()}
          className="mt-5 w-full rounded-md bg-primary px-5 py-3.5 text-lg font-semibold text-white shadow hover:bg-primary-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Working…" : spec.actionLabel}
        </button>
      </section>

      <section id="tool-result" className="rounded-card border border-border bg-surface p-6 shadow-sm" aria-live="polite" aria-labelledby="tool-results-title">
        <h2 id="tool-results-title" className="text-lg font-[650]">Results</h2>
        {!result ? (
          <p className="mt-3 text-muted">Add some text and press “{spec.actionLabel}”. Your results will appear here.</p>
        ) : (
          <div className="mt-3 space-y-5">
            <p className="text-lg font-medium">{result.summary}</p>
            {result.metrics && (
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {result.metrics.map((m) => (
                  <div key={m.label} className="rounded-md bg-bg p-3" title={m.hint}>
                    <dt className="text-xs font-semibold text-muted">{m.label}</dt>
                    <dd className="mt-0.5 text-2xl font-bold">{m.value}</dd>
                    {m.hint && <dd className="text-[11px] text-muted">{m.hint}</dd>}
                  </div>
                ))}
              </dl>
            )}
            {result.sections?.map((s) => (
              <div key={s.title}>
                <h3 className="font-semibold">{s.title}</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  {s.items.map((item, i) => (
                    <li key={i} className="rounded-md bg-bg px-3 py-2">{item}</li>
                  ))}
                </ul>
              </div>
            ))}
            {result.previewHtml && (
              <iframe
                title="Document preview"
                srcDoc={result.previewHtml}
                // Empty sandbox: no scripts, no forms, opaque origin.
                sandbox=""
                className="h-[420px] w-full rounded-md border border-border-strong"
              />
            )}
            {result.download && (
              <button onClick={download} className="w-full rounded-md bg-ink px-5 py-3 font-semibold text-white hover:bg-ink-2">
                <Icon name="download" />
                Download {result.download.filename}
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
