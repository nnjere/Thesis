"use client";

/** A whole-row clickable switch: <label> wrapping text and a checkbox with role="switch". */
export function SwitchRow({
  title,
  hint,
  checked,
  onChange,
  children,
}: {
  title: string;
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <label className="relative flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-sm px-1.5 py-1 hover:bg-row-hover">
      <span className="flex flex-col gap-0.5">
        <span className="text-sm">{title}</span>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="m-0 h-5 w-5 flex-none cursor-pointer accent-primary"
      />
      {children}
    </label>
  );
}
