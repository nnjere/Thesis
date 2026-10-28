import { KIND_INFO } from "@/lib/catalog/labels";
import type { ProjectKind } from "@/lib/catalog/types";

export function KindTag({ kind }: { kind: ProjectKind }) {
  const info = KIND_INFO[kind];
  return <span className={`inline-block rounded px-2.5 py-1 text-xs font-medium ${info.tint} ${info.ink}`}>{info.tag}</span>;
}

export function IdeaTag({ children }: { children: React.ReactNode }) {
  return <span className="inline-block self-start rounded bg-idea-bg px-2 py-[3px] text-xs font-medium text-idea-ink">{children}</span>;
}

export function OutlineChip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-[13px]">{children}</span>;
}
