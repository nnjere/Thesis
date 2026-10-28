"use client";

import { useEffect, useRef, useState } from "react";
import { CursorIcon } from "@/components/ui/Icon";
import { usePresence } from "./PresenceRoot";

function MenuSwitch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-sm px-1.5 text-sm hover:bg-row-hover">
      {label}
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="m-0 h-5 w-5 flex-none cursor-pointer accent-primary"
      />
    </label>
  );
}

/** "Cursors: On/Off" button and its privacy popover (UI brief §5). */
export function CursorMenu({ collaborator }: { collaborator?: string }) {
  const { prefs, setPrefs } = usePresence();
  const [open, setOpen] = useState(false);
  // Right-aligned below the button, unless that would run off the left edge (narrow screens).
  const [alignLeft, setAlignLeft] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const note = collaborator
    ? prefs.shareMine
      ? `${collaborator} can see your pointer while you edit. Turn it off to work privately — they'll still see your changes.`
      : `Your pointer is private. ${collaborator} still sees your changes, but not where you are.`
    : prefs.shareMine
      ? "Others see your pointer with your name. Turn it off to browse privately — you’ll count as “someone” in the viewer number."
      : "Your pointer is private. Others see “someone” in the viewer count, but not where you are on the page.";

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="cursor-menu"
        onClick={() => {
          const rect = buttonRef.current?.getBoundingClientRect();
          if (rect) setAlignLeft(rect.right - 290 < 8);
          setOpen((o) => !o);
        }}
        className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-[13px] font-medium text-ink hover:bg-hover"
      >
        <CursorIcon />
        Cursors: {prefs.showOthers ? "On" : "Off"}
      </button>
      <div
        id="cursor-menu"
        hidden={!open}
        className={`absolute top-12 z-30 ${alignLeft ? "left-0" : "right-0"} flex w-[290px] max-w-[calc(100vw-32px)] flex-col gap-1 rounded-card border border-border bg-surface p-3 shadow-popover`}
      >
        <span className="px-1.5 pb-1 text-[13px] font-semibold">Live cursors</span>
        <MenuSwitch label="See other people’s cursors" checked={prefs.showOthers} onChange={(v) => setPrefs({ ...prefs, showOthers: v })} />
        <MenuSwitch label="Show my cursor to others" checked={prefs.shareMine} onChange={(v) => setPrefs({ ...prefs, shareMine: v })} />
        <span className="px-1.5 pt-1 text-xs leading-[1.45] text-muted">{note}</span>
      </div>
    </div>
  );
}
