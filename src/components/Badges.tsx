import { SOURCE_INFO, STATUS_INFO, TYPE_INFO } from "@/lib/catalog/labels";
import type { DataSource, ProjectType, RunStatus } from "@/lib/catalog/types";

const TONES: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  sky: "bg-sky-50 text-sky-800 ring-sky-600/20",
  amber: "bg-amber-50 text-amber-800 ring-amber-600/25",
  slate: "bg-slate-100 text-slate-700 ring-slate-500/20",
};

const DOTS: Record<string, string> = {
  emerald: "bg-emerald-500",
  sky: "bg-sky-500",
  amber: "bg-amber-500",
  slate: "bg-slate-400",
};

export function StatusBadge({ status, size = "sm" }: { status: RunStatus; size?: "sm" | "md" }) {
  const info = STATUS_INFO[status];
  return (
    <span
      title={info.description}
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset ${TONES[info.tone]} ${
        size === "md" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs"
      }`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${DOTS[info.tone]}`} />
      {info.label}
    </span>
  );
}

export function SourceBadge({ source }: { source: DataSource }) {
  const info = SOURCE_INFO[source];
  const style =
    source === "built-in-demo"
      ? "bg-brand-50 text-brand-700 ring-brand-500/20"
      : source === "sample-listing"
        ? "bg-white text-muted ring-black/10 border-dashed"
        : "bg-fuchsia-50 text-fuchsia-800 ring-fuchsia-600/20";
  return (
    <span title={info.description} className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}>
      {info.label}
    </span>
  );
}

export function TypeBadge({ type }: { type: ProjectType | "unknown" }) {
  const info = TYPE_INFO[type];
  return (
    <span title={info.plain} className="inline-flex items-center gap-1 rounded-full bg-black/[0.04] px-2 py-0.5 text-xs font-medium text-muted">
      <span aria-hidden>{info.icon}</span>
      {info.label}
    </span>
  );
}

export function SimulatedTag() {
  return (
    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-900">
      Simulated
    </span>
  );
}
