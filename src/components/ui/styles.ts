/** Shared class recipes for the design system's controls (docs/design/UI_BRIEF.md §3). */

type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed";
const sizes: Record<Size, string> = { md: "h-10 px-4 text-sm", lg: "h-12 rounded-[10px] px-[22px] text-[15px]" };

export function primaryButton(size: Size = "md") {
  return `${base} ${sizes[size]} bg-primary font-semibold text-white hover:bg-primary-ink hover:text-white`;
}

export function secondaryButton(size: Size = "md") {
  return `${base} ${sizes[size]} border border-border-strong bg-surface text-ink hover:bg-hover hover:text-ink`;
}

export function darkButton(size: Size = "md") {
  return `${base} ${sizes[size]} bg-ink font-semibold text-white hover:bg-ink-2 hover:text-white`;
}

export const card = "rounded-card border border-border bg-surface";
export const cardHover = "transition-[border-color,box-shadow] hover:border-border-hover hover:shadow-card";
