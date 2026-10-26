"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SourceBadge, StatusBadge, TypeBadge } from "@/components/Badges";
import type { RepoAnalysis } from "@/lib/repo/analyzer";

type State =
  | { phase: "idle" }
  | { phase: "loading"; url: string }
  | { phase: "error"; message: string; catalogSlug?: string | null }
  | { phase: "done"; analysis: RepoAnalysis; catalogSlug: string | null };

const STRATEGY_TEXT: Record<string, string> = {
  "static-preview": "It could be shown directly as web pages in a private preview.",
  "node-dev-server": "It could be started in a private sandbox and shown in a preview window.",
  "python-web-server": "It could be started in a private sandbox and shown in a preview window.",
  "single-container": "It could be started from its container instructions in a private sandbox.",
  "multi-service": "It needs several services running together, which automatic setup doesn't support yet.",
  "cli-form-adapter": "It would need a simple, purpose-built form before it could be tried here.",
  "download-release": "The best way to try it is to download it for your own computer or phone.",
  "explain-building-block": "There's nothing to open. Look for apps that are built with it instead.",
  "manual-review": "Someone would need to look at it by hand to work out how to try it.",
};

export function AnalyzeView({ initialUrl, agentNote }: { initialUrl: string; agentNote: string }) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl);
  const [state, setState] = useState<State>({ phase: "idle" });

  useEffect(() => {
    if (!initialUrl) return;
    let cancelled = false;
    setState({ phase: "loading", url: initialUrl });
    (async () => {
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: initialUrl }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) setState({ phase: "error", message: data?.error?.message ?? "Something went wrong.", catalogSlug: data?.catalogSlug });
        else setState({ phase: "done", analysis: data.analysis, catalogSlug: data.catalogSlug });
      } catch {
        if (!cancelled) setState({ phase: "error", message: "We couldn't reach our servers. Check your connection and try again." });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialUrl]);

  return (
    <div className="mt-6 space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (url.trim()) router.push(`/analyze?url=${encodeURIComponent(url.trim())}`);
        }}
        className="flex flex-col gap-2 rounded-3xl border border-black/5 bg-white p-3 shadow-sm sm:flex-row"
      >
        <label htmlFor="analyze-url" className="sr-only">GitHub project link</label>
        <input
          id="analyze-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/project"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          maxLength={300}
          className="min-w-0 flex-1 rounded-2xl border border-black/10 px-4 py-3 font-mono text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
        />
        <button className="rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-black">Check this project</button>
      </form>

      {state.phase === "idle" && (
        <div className="flex flex-wrap gap-2 text-sm text-muted">
          <span>Examples:</span>
          {["github.com/excalidraw/excalidraw", "github.com/jqlang/jq", "github.com/streamlit/streamlit"].map((ex) => (
            <Link key={ex} href={`/analyze?url=${encodeURIComponent(ex)}`} className="rounded-full border border-black/10 bg-white px-3 py-1 font-mono hover:text-ink">
              {ex}
            </Link>
          ))}
        </div>
      )}

      {state.phase === "loading" && (
        <div className="flex items-center gap-4 rounded-3xl border border-black/5 bg-white p-6" aria-busy="true" aria-live="polite">
          <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600 motion-reduce:animate-none" />
          <div>
            <p className="font-semibold">Reading the project&apos;s public information…</p>
            <p className="text-sm text-muted">Looking at its description and setup files. This usually takes a few seconds.</p>
          </div>
        </div>
      )}

      {state.phase === "error" && (
        <div className="rounded-3xl border border-rose-100 bg-white p-6" role="alert">
          <p className="text-lg font-semibold">{state.message}</p>
          {state.catalogSlug && (
            <p className="mt-2 text-muted">
              Good news: this project is in our catalog.{" "}
              <Link href={`/projects/${state.catalogSlug}`} className="font-semibold text-brand-700 hover:underline">See its page</Link>.
            </p>
          )}
        </div>
      )}

      {state.phase === "done" && <AnalysisResult analysis={state.analysis} catalogSlug={state.catalogSlug} agentNote={agentNote} />}
    </div>
  );
}

function AnalysisResult({ analysis, catalogSlug, agentNote }: { analysis: RepoAnalysis; catalogSlug: string | null; agentNote: string }) {
  const { metadata, classification: c, signals } = analysis;
  return (
    <article className="space-y-6">
      {catalogSlug && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-5 py-4">
          <p className="font-medium text-brand-700">This project is in our catalog, with a plain-English guide.</p>
          <Link href={`/projects/${catalogSlug}`} className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            Open its page
          </Link>
        </div>
      )}

      <div className="rounded-3xl border border-black/5 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={c.status} size="md" />
          <TypeBadge type={c.type} />
          <SourceBadge source="analyzed" />
          {signals.archived && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">Archived</span>}
        </div>
        <h2 className="mt-3 text-3xl font-bold tracking-tight">{metadata.fullName.split("/")[1]}</h2>
        <p className="text-sm text-muted">
          by{" "}
          <a href={metadata.owner.url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
            {metadata.owner.login}
          </a>
          {metadata.license && <> · {metadata.license} licence</>}
          {metadata.language && <> · mostly {metadata.language}</>}
        </p>
        {metadata.description && (
          <p className="mt-4 text-lg">
            <span className="sr-only">Description from GitHub: </span>“{metadata.description}”
            <span className="ml-2 align-middle text-xs text-muted">(the creators&apos; description)</span>
          </p>
        )}
        <p className="mt-4 text-ink/85">{c.summary}</p>
        <p className="mt-2 text-xs text-muted">
          Our confidence in this guess: <strong>{c.confidence}</strong>. Status labels for new projects are always estimates. Only
          projects we&apos;ve actually tested are marked Verified.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-black/5 bg-white p-6">
          <h3 className="font-bold">How could you try it?</h3>
          <p className="mt-2 text-ink/85">{STRATEGY_TEXT[c.strategy]}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink/85">
            {c.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <div className="mt-5 space-y-2">
            <button disabled className="w-full cursor-not-allowed rounded-2xl bg-black/10 px-5 py-3 font-semibold text-muted" aria-describedby="no-launch">
              Try it (not available yet)
            </button>
            <p id="no-launch" className="text-xs text-muted">
              Launching new GitHub projects needs real, isolated sandboxes, which aren&apos;t connected in this prototype. Nothing from this
              project has been run.
            </p>
            {metadata.homepage && (
              <a href={metadata.homepage} target="_blank" rel="noopener noreferrer" className="block w-full rounded-2xl border border-black/10 px-5 py-3 text-center font-semibold hover:bg-black/[0.03]">
                Visit the project&apos;s website ↗
              </a>
            )}
            {analysis.releaseUrl && (
              <a href={analysis.releaseUrl} target="_blank" rel="noopener noreferrer" className="block w-full rounded-2xl border border-black/10 px-5 py-3 text-center font-semibold hover:bg-black/[0.03]">
                See the latest downloads ↗
              </a>
            )}
            <a href={analysis.repo.url} target="_blank" rel="noopener noreferrer" className="block w-full rounded-2xl px-5 py-2 text-center text-sm font-semibold text-muted hover:text-ink">
              Open on GitHub ↗
            </a>
          </div>
        </div>

        <div className="space-y-6">
          {c.caveats.length > 0 && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
              <h3 className="font-bold">Things to know</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {c.caveats.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}
          {signals.readme?.excerpt && (
            <div className="rounded-3xl border border-black/5 bg-white p-6">
              <h3 className="font-bold">From the project&apos;s README</h3>
              <p className="mt-1 text-xs text-muted">Written by the project, shown as plain text.</p>
              <p className="mt-3 text-sm text-ink/85">{signals.readme.excerpt}</p>
            </div>
          )}
          <div className="rounded-3xl border border-dashed border-black/10 bg-white p-6">
            <h3 className="font-bold">AI-assisted setup</h3>
            <p className="mt-2 text-sm text-muted">{agentNote}</p>
          </div>
        </div>
      </div>

      <details className="rounded-2xl border border-black/5 bg-black/[0.02] px-4 py-3 text-sm">
        <summary className="cursor-pointer select-none font-medium text-muted">Technical details (for developers)</summary>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div>
            <p className="font-semibold">Files read (never executed)</p>
            <ul className="mt-1 font-mono text-xs text-muted">
              {analysis.filesRead.length ? analysis.filesRead.map((f) => <li key={f}>{f}</li>) : <li>(none)</li>}
            </ul>
            <p className="mt-3 font-semibold">Suggested strategy</p>
            <p className="font-mono text-xs text-muted">{c.strategy}</p>
            <p className="mt-3 font-semibold">Scores</p>
            <p className="font-mono text-xs text-muted">{Object.entries(c.scores).map(([k, v]) => `${k}=${v}`).join("  ")}</p>
          </div>
          <div>
            <p className="font-semibold">Evidence</p>
            <ul className="mt-1 space-y-0.5 font-mono text-xs text-muted">
              {c.evidence.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        </div>
      </details>
    </article>
  );
}
