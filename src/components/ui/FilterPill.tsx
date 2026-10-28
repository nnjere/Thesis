"use client";

export function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`h-9 cursor-pointer rounded-full px-3.5 text-[13px] font-medium transition-colors ${
        active ? "bg-ink text-white" : "bg-transparent text-muted hover:bg-hover hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
