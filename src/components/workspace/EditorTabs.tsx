"use client";

import { useRef } from "react";

export interface WorkspaceView {
  id: string;
  label: string;
  file: string;
}

/** Sidebar file list: plain label first, technical file name small underneath. */
export function FileList({ views, active, onPick }: { views: WorkspaceView[]; active: string; onPick: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="px-2 pb-1.5 text-xs font-semibold text-muted">Project</span>
      {views.map((v) => {
        const isActive = v.id === active;
        return (
          <button
            key={v.id}
            type="button"
            aria-current={isActive ? "true" : undefined}
            aria-controls={`panel-${v.id}`}
            onClick={() => onPick(v.id)}
            className={`flex min-h-11 cursor-pointer flex-col items-start gap-0.5 rounded-sm p-2 text-left ${isActive ? "bg-primary-tint text-primary-ink" : "hover:bg-hover"}`}
          >
            <span className={`text-sm ${isActive ? "font-semibold" : "font-medium text-ink"}`}>{v.label}</span>
            <span className={`font-mono text-[11px] ${isActive ? "text-primary-ink" : "text-muted"}`}>{v.file}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Editor tabs with arrow-key navigation (WAI-ARIA tabs pattern, automatic activation). */
export function EditorTabs({ views, active, onPick }: { views: WorkspaceView[]; active: string; onPick: (id: string) => void }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const move = (delta: number) => {
    const i = views.findIndex((v) => v.id === active);
    const next = views[(i + delta + views.length) % views.length];
    onPick(next.id);
    refs.current[next.id]?.focus();
  };
  return (
    <div
      role="tablist"
      aria-label="Views"
      className="flex overflow-x-auto border-b border-border bg-bg"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") move(1);
        else if (e.key === "ArrowLeft") move(-1);
        else return;
        e.preventDefault();
      }}
    >
      {views.map((v) => {
        const isActive = v.id === active;
        return (
          <button
            key={v.id}
            ref={(el) => {
              refs.current[v.id] = el;
            }}
            id={`tab-${v.id}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${v.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onPick(v.id)}
            className={`h-11 flex-none cursor-pointer border-r border-border px-4 text-[13px] ${
              isActive ? "-mb-px bg-surface font-semibold text-ink shadow-[inset_0_2px_0_var(--color-primary)]" : "font-medium text-muted hover:text-ink"
            }`}
          >
            {v.label}
          </button>
        );
      })}
    </div>
  );
}
