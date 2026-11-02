export function ActivityLog({ entries, caption = "changes save automatically" }: { entries: string[]; caption?: string }) {
  return (
    <section
      aria-label="Activity"
      className="flex flex-none flex-col border-t border-border bg-bg max-[900px]:sticky max-[900px]:bottom-0 max-[900px]:z-[5] max-[900px]:shadow-[0_-4px_12px_rgba(31,35,40,.06)]"
    >
      <div className="flex items-center justify-between border-b border-divider-soft px-4 py-2">
        <span className="text-xs font-semibold text-ink-2">Activity</span>
        <span className="font-mono text-[11px] text-muted">{caption}</span>
      </div>
      <ul aria-live="polite" className="m-0 flex h-[92px] list-none flex-col gap-1.5 overflow-y-auto px-4 py-2.5 text-[13px]">
        {entries.map((entry, i) => (
          <li key={`${i}-${entry}`} className="flex items-center gap-2.5">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-line-number" />
            <span>{entry}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
