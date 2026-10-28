import { SOURCE_INFO, STATUS_INFO, TYPE_INFO } from "@/lib/catalog/labels";
import type { DataSource, ProjectType, RunStatus } from "@/lib/catalog/types";
import { Icon } from "./ui/Icon";

export function StatusBadge({ status, size = "sm" }: { status: RunStatus; size?: "sm" | "md" }) {
  const info = STATUS_INFO[status];
  return (
    <span
      title={info.description}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded font-medium ${info.tone} ${size === "md" ? "px-2.5 py-1 text-[13px]" : "px-2 py-0.5 text-xs"}`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${info.dot}`} />
      {info.label}
    </span>
  );
}

/** Small status line for cards: dot plus text, no box. */
export function StatusLine({ status, simulated }: { status: RunStatus; simulated?: boolean }) {
  const info = STATUS_INFO[status];
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted" title={info.description}>
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${info.dot}`} />
      {info.label}
      {simulated && <span> · simulated</span>}
    </span>
  );
}

export function SourceBadge({ source }: { source: DataSource }) {
  const info = SOURCE_INFO[source];
  const style =
    source === "built-in-demo"
      ? "bg-primary-tint text-primary-ink"
      : source === "sample-listing"
        ? "border border-dashed border-border-strong bg-surface text-muted"
        : "bg-idea-bg text-idea-ink";
  return (
    <span title={info.description} className={`inline-flex items-center whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium ${style}`}>
      {info.label}
    </span>
  );
}

export function TypeBadge({ type }: { type: ProjectType | "unknown" }) {
  const info = TYPE_INFO[type];
  return (
    <span title={info.plain} className="inline-flex items-center gap-1 whitespace-nowrap rounded bg-hover px-2 py-0.5 text-xs font-medium text-ink-2">
      <Icon name={info.icon} size={13} />
      {info.label}
    </span>
  );
}

export function SimulatedTag() {
  return <span className="inline-flex items-center rounded bg-note-bg px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-note-ink">Simulated</span>;
}
