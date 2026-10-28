export function DiffBlock({ title, before, after }: { title: string; before: string; after: string }) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-border">
      <div className="border-b border-border bg-bg px-3 py-2 text-[13px] font-semibold">{title}</div>
      <div className="font-mono text-[13px]">
        <div className="flex gap-3 bg-diff-del-bg px-3 py-1.5 text-diff-del-ink">
          <span aria-label="removed">−</span>
          <span>{before}</span>
        </div>
        <div className="flex gap-3 bg-diff-add-bg px-3 py-1.5 text-diff-add-ink">
          <span aria-label="added">+</span>
          <span>{after}</span>
        </div>
      </div>
    </div>
  );
}
