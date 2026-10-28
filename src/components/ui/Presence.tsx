import type { PresencePerson } from "@/lib/presence/types";

/** Overlapping initials avatars. Decorative: the count text carries the meaning. */
export function PresenceAvatars({ people }: { people: Pick<PresencePerson, "id" | "initials" | "color">[] }) {
  return (
    <div aria-hidden className="flex pl-2">
      {people.map((p) => (
        <span
          key={p.id}
          className="-ml-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface text-xs font-semibold text-white"
          style={{ background: p.color }}
        >
          {p.initials}
        </span>
      ))}
    </div>
  );
}

/** A remote (or your own) pointer with a name pill and an optional chat bubble. Always aria-hidden. */
export function LiveCursor({
  name,
  color,
  bubble,
  className = "",
  style,
}: {
  name: string;
  color: string;
  bubble?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div aria-hidden className={`live-cursor ${className}`} style={style}>
      <svg width="20" height="22" viewBox="0 0 20 22">
        <path d="M2 2l15 8-6.5 1.8L8 19z" fill={color} stroke="#FFFFFF" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      <span className="absolute left-4 top-[18px] flex flex-col items-start gap-1">
        <span className="whitespace-nowrap rounded-full px-2 py-[3px] text-xs font-medium text-white" style={{ background: color }}>
          {name}
        </span>
        {bubble && (
          <span className="max-w-[220px] rounded-[4px_12px_12px_12px] px-2.5 py-1.5 text-[13px] text-white" style={{ background: color }}>
            {bubble}
          </span>
        )}
      </span>
    </div>
  );
}
