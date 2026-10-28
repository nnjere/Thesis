export function StatusBar({ items }: { items: React.ReactNode[] }) {
  return (
    <footer className="flex flex-wrap gap-x-5 gap-y-1.5 border-t border-border bg-surface px-4 py-1.5 text-xs text-muted">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {item}
        </span>
      ))}
    </footer>
  );
}
