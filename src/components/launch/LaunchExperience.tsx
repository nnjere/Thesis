"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { SimulatedTag, StatusBadge } from "@/components/Badges";
import { KindTile } from "@/components/ProjectCard";
import { Icon } from "@/components/ui/Icon";
import type { ProjectKind, RunStatus } from "@/lib/catalog/types";
import type { PublicSession } from "@/lib/sandbox/types";
import type { ToolSpec } from "@/lib/tools/types";
import { TechnicalDetails } from "./TechnicalDetails";
import { ToolRunner } from "./ToolRunner";

interface LaunchProject {
  slug: string;
  name: string;
  tagline: string;
  status: RunStatus;
  homepage?: string;
  repoUrl?: string;
  kind: ProjectKind;
}

interface Props {
  project: LaunchProject;
  toolSpec?: ToolSpec;
  alternatives: { slug: string; name: string; tagline: string }[];
}

const POLL_MS = 600;
const HEARTBEAT_MS = 30_000;

export function LaunchExperience({ project, toolSpec, alternatives }: Props) {
  const [session, setSession] = useState<PublicSession | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const sessionIdRef = useRef<string | null>(null);

  // Start a session (once per attempt).
  useEffect(() => {
    let cancelled = false;
    setSession(null);
    setStartError(null);
    (async () => {
      try {
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: project.slug }),
        });
        const data = await res.json();
        if (cancelled) {
          if (res.ok) navigator.sendBeacon?.(`/api/sessions/${data.id}/end`);
          return;
        }
        if (!res.ok) return setStartError(data?.error?.message ?? "We couldn't start this project. Please try again.");
        sessionIdRef.current = data.id;
        setSession(data);
      } catch {
        if (!cancelled) setStartError("We couldn't reach our servers. Check your connection and try again.");
      }
    })();
    return () => {
      cancelled = true;
      const id = sessionIdRef.current;
      if (id) navigator.sendBeacon?.(`/api/sessions/${id}/end`);
      sessionIdRef.current = null;
    };
  }, [project.slug, attempt]);

  // End the session if the tab closes.
  useEffect(() => {
    const onHide = () => {
      const id = sessionIdRef.current;
      if (id) navigator.sendBeacon?.(`/api/sessions/${id}/end`);
    };
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, []);

  // Poll while preparing; heartbeat while ready.
  const state = session?.state;
  const id = session?.id;
  useEffect(() => {
    if (!id || (state !== "preparing" && state !== "ready")) return;
    const timer = setTimeout(
      async () => {
        try {
          const res = await fetch(`/api/sessions/${id}`, { cache: "no-store" });
          if (res.status === 404) {
            setSession((s) => (s ? { ...s, state: "ended", endedReason: "expired" } : s));
            return;
          }
          const next = (await res.json()) as PublicSession;
          setSession(next);
        } catch {
          /* transient; try again on next tick */
          setSession((s) => (s ? { ...s } : s));
        }
      },
      state === "preparing" ? POLL_MS : HEARTBEAT_MS,
    );
    return () => clearTimeout(timer);
  }, [id, state, session]);

  const restart = useCallback(() => setAttempt((n) => n + 1), []);
  const endSession = useCallback(async () => {
    const sid = sessionIdRef.current;
    if (!sid) return;
    await fetch(`/api/sessions/${sid}`, { method: "DELETE" }).catch(() => undefined);
    setSession((s) => (s ? { ...s, state: "ended", endedReason: "ended by user" } : s));
  }, []);

  if (startError) {
    return (
      <Shell>
        <FailureCard
          headline="We couldn't start this project"
          explanation={startError}
          project={project}
          alternatives={alternatives}
          onRetry={restart}
        />
      </Shell>
    );
  }

  if (!session || session.state === "preparing") {
    return (
      <Shell>
        <LoadingCard project={project} session={session} />
      </Shell>
    );
  }

  if (session.state === "failed") {
    return (
      <Shell>
        <FailureCard
          headline={session.failure?.headline ?? "This project couldn't be started"}
          explanation={session.failure?.explanation ?? "Something went wrong while getting it ready."}
          project={project}
          alternatives={alternatives}
          onRetry={restart}
          simulated={session.simulated}
          sessionId={session.id}
        />
      </Shell>
    );
  }

  if (session.state === "ended") {
    const reason =
      session.endedReason === "inactive for too long"
        ? "It was closed after a period of inactivity, to free up resources."
        : session.endedReason === "reached maximum session length"
          ? "Sessions have a time limit, and this one reached it."
          : "This session has ended.";
    return (
      <Shell>
        <div className="mx-auto max-w-xl rounded-card border border-border bg-surface p-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-card bg-hover text-ink-2"><Icon name="pause" size={22} /></span>
          <h1 className="mt-3 text-2xl font-[650]">Session ended</h1>
          <p className="mt-2 text-muted">{reason} Anything you didn&apos;t download has been cleared.</p>
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={restart} className="rounded-md bg-primary px-5 py-3 font-semibold text-white hover:bg-primary-ink">Start again</button>
            <Link href={`/projects/${project.slug}`} className="rounded-md border border-border-strong px-5 py-3 font-semibold">Back to project</Link>
          </div>
        </div>
      </Shell>
    );
  }

  // Ready
  const result = session.result!;

  if (result.kind === "simulated-complete") {
    return (
      <Shell>
        <div className="mx-auto max-w-2xl overflow-hidden rounded-card border border-border bg-surface">
          <div className="bg-note-bg px-6 py-4 text-note-ink">
            <div className="flex items-center gap-2">
              <SimulatedTag />
              <p className="font-semibold">Simulation complete: nothing was actually run</p>
            </div>
          </div>
          <div className="p-6 sm:p-8">
            <h1 className="text-2xl font-[650]">This is where {project.name} would open</h1>
            <p className="mt-3 text-ink-2">
              Real sandboxes aren&apos;t connected in this prototype, so we haven&apos;t downloaded or started {project.name}. In a full
              version, you would now see <strong>{result.wouldShow}</strong>.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {result.hostedAlternative && (
                <a href={result.hostedAlternative} target="_blank" rel="noopener noreferrer" className="rounded-md bg-ink px-5 py-3 font-semibold text-white hover:bg-ink-2">
                  Use the official version ↗
                </a>
              )}
              {project.repoUrl && (
                <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="rounded-md border border-border-strong px-5 py-3 font-semibold">
                  See it on GitHub ↗
                </a>
              )}
              <Link href="/explore?runnable=1" className="rounded-md px-5 py-3 font-semibold text-primary hover:underline">
                Find something you can try for real
              </Link>
            </div>
            <TechnicalDetails sessionId={session.id} providerLabel={session.providerLabel} />
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <div className={fullscreen ? "fixed inset-0 z-50 flex flex-col bg-surface" : "mx-auto max-w-6xl px-4 pt-6 sm:px-6"}>
      <div className={`flex flex-wrap items-center justify-between gap-3 ${fullscreen ? "border-b border-border-strong px-4 py-2" : ""}`}>
        <div className="flex min-w-0 items-center gap-3">
          <Link href={`/projects/${project.slug}`} className="text-sm font-semibold text-muted hover:text-ink">← {fullscreen ? "" : "Back"}</Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-[650]">{project.name}</h1>
              <StatusBadge status={project.status} />
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <span className="h-2 w-2 rounded-full bg-primary" aria-hidden /> Running in a private sandbox in your browser
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {result.kind === "embedded-web-app" && (
            <button onClick={() => setFullscreen((f) => !f)} className="rounded-full border border-border-strong px-3 py-1.5 text-sm font-semibold hover:bg-ink-2/[0.03]">
              {fullscreen ? "Exit full screen" : "Full screen"}
            </button>
          )}
          <button onClick={endSession} className="rounded-full border border-border-strong px-3 py-1.5 text-sm font-semibold text-muted hover:text-ink">
            End session
          </button>
        </div>
      </div>

      {result.kind === "embedded-web-app" ? (
        <div className={fullscreen ? "flex-1" : "mt-4 overflow-hidden rounded-card border border-border-strong bg-surface shadow-sm"}>
          <iframe
            title={`${project.name}, running in a sandbox`}
            src={result.url}
            // No allow-same-origin: the app gets an opaque origin and cannot
            // read this site's cookies, storage or pages.
            sandbox="allow-scripts allow-downloads"
            referrerPolicy="no-referrer"
            className={fullscreen ? "h-full w-full" : "h-[78vh] min-h-[520px] w-full"}
          />
        </div>
      ) : toolSpec ? (
        <ToolRunner sessionId={session.id} spec={toolSpec} onSessionEnded={() => setSession((s) => (s ? { ...s, state: "ended" } : s))} />
      ) : (
        <p className="mt-6 text-muted">This tool&apos;s form couldn&apos;t be loaded.</p>
      )}

      {!fullscreen && (
        <p className="mt-4 text-center text-xs text-muted">
          Sessions close automatically after 10 minutes of inactivity or 30 minutes in total.
        </p>
      )}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">{children}</div>;
}

function LoadingCard({ project, session }: { project: LaunchProject; session: PublicSession | null }) {
  const steps = session?.steps ?? [];
  const active = steps.find((s) => s.status === "active");
  return (
    <div className="mx-auto max-w-xl">
      {session?.simulated && (
        <div className="mb-4 flex items-start gap-3 rounded-md border border-border bg-note-bg px-4 py-3 text-sm text-note-ink" role="note">
          <SimulatedTag />
          <p>
            <strong>This is a simulation.</strong> No real sandbox is connected, so nothing from {project.name} is being downloaded or
            run. You&apos;re seeing how the launch would work.
          </p>
        </div>
      )}
      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm" aria-busy="true">
        <div className="dot-grid flex aspect-[16/7] w-full items-center justify-center gap-4">
          <KindTile project={project} size={64} />
          <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary motion-reduce:animate-none" />
        </div>
        <div className="p-6 sm:p-8">
          <p className="text-sm font-semibold text-muted">Starting {project.name}</p>
          <p className="mt-1 text-2xl font-[650]" aria-live="polite">
            {active?.label ?? "Getting the project ready…"}
          </p>
          <ol className="mt-6 space-y-3">
            {(steps.length ? steps : PLACEHOLDER_STEPS).map((s) => (
              <li key={s.id} className="flex items-center gap-3">
                <StepIcon status={s.status} />
                <span className={s.status === "pending" ? "text-muted" : "font-medium"}>{s.label.replace("…", "")}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

const PLACEHOLDER_STEPS = [
  { id: "fetch", label: "Getting the project ready…", status: "active" as const },
  { id: "environment", label: "Preparing the environment…", status: "pending" as const },
  { id: "check", label: "Checking that everything works…", status: "pending" as const },
  { id: "finish", label: "Almost ready…", status: "pending" as const },
];

function StepIcon({ status }: { status: string }) {
  if (status === "done") return <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-xs font-bold text-white" aria-label="Done">✓</span>;
  if (status === "failed") return <span className="grid h-6 w-6 place-items-center rounded-full bg-diff-del-ink text-xs font-bold text-white" aria-label="Stopped">!</span>;
  if (status === "active")
    return (
      <span className="grid h-6 w-6 place-items-center" aria-label="In progress">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary motion-reduce:animate-none" />
      </span>
    );
  return <span className="h-6 w-6 rounded-full border-2 border-border-strong" aria-label="Waiting" />;
}

function FailureCard(props: {
  headline: string;
  explanation: string;
  project: LaunchProject;
  alternatives: Props["alternatives"];
  onRetry: () => void;
  simulated?: boolean;
  sessionId?: string;
}) {
  const { project, alternatives } = props;
  return (
    <div className="mx-auto max-w-2xl overflow-hidden rounded-card border border-border bg-surface">
      {props.simulated && (
        <div className="flex items-center gap-2 bg-note-bg px-6 py-3 text-sm text-note-ink">
          <SimulatedTag /> Simulated result. This explains what would likely happen; nothing was actually run.
        </div>
      )}
      <div className="p-6 sm:p-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-card bg-note-bg text-note-ink"><Icon name="alert" size={22} /></span>
        <h1 className="mt-3 text-2xl font-[650]">{props.headline}</h1>
        <p className="mt-3 text-ink-2">{props.explanation}</p>
        <p className="mt-3 text-ink-2">This isn&apos;t something you did wrong. Here&apos;s what you can do instead:</p>
        <ul className="mt-5 space-y-3">
          {project.homepage && (
            <li>
              <a href={project.homepage} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-md border border-border-strong px-4 py-3 hover:bg-ink-2/[0.02]">
                <span>
                  <span className="font-semibold">Use the official version</span>
                  <span className="block text-sm text-muted">Hosted by the people who made {project.name}</span>
                </span>
                <span aria-hidden>↗</span>
              </a>
            </li>
          )}
          {alternatives.map((a) => (
            <li key={a.slug}>
              <Link href={`/projects/${a.slug}`} className="flex items-center justify-between rounded-md border border-border-strong px-4 py-3 hover:bg-ink-2/[0.02]">
                <span>
                  <span className="font-semibold">Try {a.name}</span>
                  <span className="block text-sm text-muted">{a.tagline}</span>
                </span>
                <span aria-hidden>→</span>
              </Link>
            </li>
          ))}
          <li>
            <Link href="/explore?runnable=1" className="flex items-center justify-between rounded-md border border-border-strong px-4 py-3 hover:bg-ink-2/[0.02]">
              <span>
                <span className="font-semibold">Browse projects that work here</span>
                <span className="block text-sm text-muted">Every one of these has been tested</span>
              </span>
              <span aria-hidden>→</span>
            </Link>
          </li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={props.onRetry} className="rounded-md border border-border-strong px-5 py-2.5 font-semibold hover:bg-ink-2/[0.03]">Try again</button>
          {project.repoUrl && (
            <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="rounded-md px-5 py-2.5 font-semibold text-muted hover:text-ink">
              See it on GitHub ↗
            </a>
          )}
        </div>
        {props.sessionId && <TechnicalDetails sessionId={props.sessionId} />}
      </div>
    </div>
  );
}
