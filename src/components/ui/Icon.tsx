/** Inline stroke icons (Lucide-style: currentColor, round caps). Decorative unless `label` is set. */
const PATHS = {
  cube: <><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>,
  images: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-9 9" /></>,
  audio: <path d="M4 10v4M8 6v12M12 3v18M16 7v10M20 10v4" />,
  documents: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6M8 13h8M8 17h5" /></>,
  creative: <><path d="M12 19l7-7 3 3-7 7z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18z" /><circle cx="11" cy="11" r="2" /></>,
  data: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  social: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />,
  tools: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z" />,
  code: <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />,
  chevronLeft: <path d="M15 18l-6-6 6-6" />,
  send: <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  check: <path d="M5 12l5 5 9-10" />,
  external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>,
  download: <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
  terminal: <path d="M4 17l6-5-6-5M12 19h8" />,
  monitor: <><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>,
  blocks: <><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" /><path d="M13 7h8M17 3v8M3 17h8" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01" /></>,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  reply: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />,
  repost: <path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3" />,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z" />,
  alert: <><path d="M12 3l10 18H2z" /><path d="M12 10v4M12 17.5v.01" /></>,
  pause: <path d="M9 5v14M15 5v14" />,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 16,
  strokeWidth = 2,
  label,
  className,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      {PATHS[name]}
    </svg>
  );
}

/** Filled "play" triangle used on the primary Open button. */
export function PlayIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 3l15 9-15 9z" />
    </svg>
  );
}

/** Pointer outline for the Cursors button. */
export function CursorIcon() {
  return (
    <svg width="14" height="15" viewBox="0 0 20 22" aria-hidden>
      <path d="M2 2l15 8-6.5 1.8L8 19z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
