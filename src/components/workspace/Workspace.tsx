"use client";

import Link from "next/link";
import { useState } from "react";
import { DiffBlock } from "@/components/ui/DiffBlock";
import { ActivityLog } from "@/components/ui/ActivityLog";
import { Icon } from "@/components/ui/Icon";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { StatusBar } from "@/components/ui/StatusBar";
import { SwitchRow } from "@/components/ui/SwitchRow";
import { BlueskyProfile } from "@/components/previews/BlueskyProfile";
import {
  changedSettings,
  initialState,
  setView,
  shareSuggestion,
  toggleSetting,
  visibleValues,
  type SettingValues,
  type WorkspaceScenario,
  type WorkspaceState,
} from "@/lib/workspace";
import { EditorTabs, FileList, type WorkspaceView } from "./EditorTabs";

/** Scenario id → live preview. New scenarios register their preview here. */
const PREVIEWS: Record<string, (props: { values: SettingValues }) => React.ReactNode> = {
  "bluesky-profile": BlueskyProfile,
};

const VIEWS: WorkspaceView[] = [
  { id: "canvas", label: "Canvas", file: "profile preview" },
  { id: "changes", label: "Changes", file: "suggestion.diff" },
  { id: "about", label: "About", file: "README.md" },
];

export interface WorkspaceProject {
  slug: string;
  name: string;
  repo: string;
  license?: string;
}

export function Workspace({
  project,
  scenario,
  suggestionId,
  headerExtras,
  editingCursor,
  canvasOverlay,
}: {
  project: WorkspaceProject;
  scenario: WorkspaceScenario;
  suggestionId?: string | null;
  /** Presence and cursor controls (supplied by the presence layer). */
  headerExtras?: React.ReactNode;
  /** Your own cursor label on the node being edited. */
  editingCursor?: React.ReactNode;
  /** Remote cursors over the preview. */
  canvasOverlay?: React.ReactNode;
}) {
  const [state, setState] = useState<WorkspaceState>(() => initialState(scenario, suggestionId));
  const [tab, setTab] = useState("canvas");
  const changes = changedSettings(scenario, state.mine);
  const values = visibleValues(scenario, state);
  const Preview = PREVIEWS[scenario.id];
  const views = VIEWS.map((v) => (v.id === "canvas" ? { ...v, file: scenario.previewNoun.replace(" page", "") + " preview" } : v));

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-border bg-surface px-4 py-2.5">
        <Link href={`/projects/${project.slug}`} className="flex min-h-10 items-center gap-1.5 text-sm text-muted no-underline">
          <Icon name="chevronLeft" />
          {project.name}
        </Link>
        <div className="flex min-w-0 flex-auto flex-wrap items-baseline gap-x-2.5">
          <h1 className="text-base font-semibold">{scenario.title}</h1>
          <span className="text-[13px] text-muted">
            your suggestion · {changes.length} {changes.length === 1 ? "change" : "changes"} · edited just now
          </span>
        </div>
        {headerExtras}
        <button
          type="button"
          onClick={() => setState(shareSuggestion)}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-ink"
        >
          <Icon name={state.shared ? "check" : "send"} size={14} strokeWidth={2.2} />
          {state.shared ? "Shared" : "Share suggestion"}
        </button>
      </header>

      <div className="flex flex-auto flex-wrap items-stretch">
        <nav aria-label="Project files" className="box-border flex max-w-full flex-[1_1_220px] flex-col gap-5 border-r border-border bg-surface px-2.5 py-4">
          <FileList views={views} active={tab} onPick={setTab} />
          <div className="flex flex-col gap-2 px-2">
            <span className="text-xs font-semibold text-muted">Your suggestion</span>
            <span
              className={`self-start rounded-full px-2.5 py-[3px] text-xs font-semibold ${
                state.shared ? "bg-diff-add-bg text-diff-add-ink" : "bg-note-bg text-note-ink"
              }`}
            >
              {state.shared ? "Shared with maintainers" : "Draft"}
            </span>
            {state.shared && <span className="text-xs text-muted">Demo only: nothing was sent to the real maintainers.</span>}
            <span className="text-[13px] leading-[1.45] text-ink-2">
              {changes.length} {changes.length === 1 ? "change" : "changes"} to the {scenario.previewNoun}, compared with the original app.
            </span>
            <span className="text-xs leading-[1.45] text-muted">
              Based on <span className="font-mono">{project.repo}</span>
            </span>
          </div>
        </nav>

        <main id="main" className="flex min-w-0 flex-[999_1_640px] flex-col bg-surface">
          <EditorTabs views={views} active={tab} onPick={setTab} />

          {tab === "canvas" && (
            <div id="panel-canvas" role="tabpanel" aria-labelledby="tab-canvas" className="dot-grid relative min-h-[700px] flex-auto overflow-auto">
              <div className="box-border flex w-max min-w-full items-center justify-center px-10 py-8">
                <div className="relative flex flex-col gap-4 pr-7">
                  <span aria-hidden className="absolute bottom-20 right-0 top-20 w-0.5 bg-connector" />
                  {scenario.groups.map((g) => {
                    const editing = g.id === scenario.editingGroup;
                    const settings = scenario.settings.filter((s) => s.group === g.id);
                    return (
                      <section
                        key={g.id}
                        aria-label={`${g.title}${editing ? ", being edited" : ""}`}
                        className={`relative flex w-[300px] flex-col gap-1 rounded-card bg-surface px-3.5 py-3 ${
                          editing ? "border-2 border-primary shadow-select" : "border border-border-strong"
                        }`}
                      >
                        <span aria-hidden className="absolute right-[-30px] top-1/2 h-0.5 w-7 bg-connector" />
                        <div className="mb-1 flex items-center justify-between">
                          <h2 className="text-[13px] font-semibold">{g.title}</h2>
                          {editing && <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-white">Editing</span>}
                        </div>
                        {settings.map((s, i) => (
                          <SwitchRow
                            key={s.id}
                            title={s.title}
                            hint={s.hint}
                            checked={Boolean(state.mine[s.id])}
                            onChange={(on) => setState((st) => toggleSetting(scenario, st, s.id, on))}
                          >
                            {editing && i === 0 ? editingCursor : null}
                          </SwitchRow>
                        ))}
                      </section>
                    );
                  })}
                </div>

                <span aria-hidden className="h-0.5 w-10 bg-connector" />

                <section aria-label={`Live ${scenario.previewNoun} preview`} className="relative flex flex-col gap-2.5 rounded-[14px] border border-border-strong bg-surface p-3 shadow-float">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[13px] font-semibold">{scenario.previewNoun.charAt(0).toUpperCase() + scenario.previewNoun.slice(1)}</h2>
                    <SegmentedControl
                      label="Compare"
                      value={state.view}
                      onChange={(v) => setState((st) => setView(st, v))}
                      options={[
                        { value: "original", label: "Original" },
                        { value: "yours", label: "Your version" },
                      ]}
                    />
                  </div>
                  {Preview ? <Preview values={values} /> : <p className="p-6 text-sm text-muted">No preview for this scenario.</p>}
                  {canvasOverlay}
                </section>
              </div>
            </div>
          )}

          {tab === "changes" && (
            <div id="panel-changes" role="tabpanel" aria-labelledby="tab-changes" className="flex min-h-[700px] flex-auto flex-col gap-4 overflow-auto px-6 py-5">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-[650]">What your suggestion changes on the {scenario.previewNoun}</h2>
                <p className="max-w-[620px] text-[13px] text-muted">
                  A simplified view, not the real code. Red lines are how it works now; green lines are your suggestion. The real change
                  would touch several files.
                </p>
              </div>
              {changes.length === 0 ? (
                <p className="text-sm text-muted">No changes yet. Flip a switch on the Canvas to start.</p>
              ) : (
                changes.map((s) => <DiffBlock key={s.id} {...s.diff} />)
              )}
            </div>
          )}

          {tab === "about" && (
            <article
              id="panel-about"
              role="tabpanel"
              aria-labelledby="tab-about"
              className="box-border flex min-h-[700px] max-w-[620px] flex-auto flex-col gap-3 px-8 py-6 text-[15px] leading-relaxed"
            >
              <h2 className="text-xl font-[650]">About this suggestion</h2>
              {scenario.about.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
              <dl className="grid gap-y-1.5 text-sm" style={{ gridTemplateColumns: "96px 1fr" }}>
                <dt className="text-muted">Project</dt>
                <dd className="font-mono">{project.repo}</dd>
                {project.license && (
                  <>
                    <dt className="text-muted">Licence</dt>
                    <dd>{project.license}</dd>
                  </>
                )}
                <dt className="text-muted">Inspired by</dt>
                <dd>
                  {scenario.about.inspiredBy.name} (<span className="font-mono">{scenario.about.inspiredBy.repo}</span>)
                </dd>
              </dl>
              <Link href={`/projects/${project.slug}`} className="text-sm font-medium">
                Back to the {project.name} page →
              </Link>
            </article>
          )}

          <ActivityLog entries={state.log} />
        </main>
      </div>

      <StatusBar
        items={[
          <>
            <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${state.shared ? "bg-primary" : "bg-warning-dot"}`} />
            {state.view === "original" ? `Showing the original ${scenario.previewNoun}` : `Showing your version of the ${scenario.previewNoun}`}
          </>,
          scenario.safetyNote,
          "Private sandbox — changes here never affect the original project",
        ]}
      />
    </div>
  );
}
