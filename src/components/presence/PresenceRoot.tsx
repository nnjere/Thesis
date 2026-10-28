"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { MockPresenceProvider, type MockRoom } from "@/lib/presence/mock";
import { DEFAULT_CURSOR_PREFS, loadCursorPrefs, saveCursorPrefs, type CursorPrefs } from "@/lib/presence/prefs";
import type { PresenceProvider, PresenceSnapshot } from "@/lib/presence/types";

interface PresenceContextValue {
  snapshot: PresenceSnapshot | null;
  prefs: CursorPrefs;
  setPrefs: (next: CursorPrefs) => void;
  isMock: boolean;
}

const PresenceContext = createContext<PresenceContextValue | null>(null);

export function usePresence(): PresenceContextValue {
  const ctx = useContext(PresenceContext);
  if (!ctx) throw new Error("usePresence must be used inside <PresenceRoot>");
  return ctx;
}

function browserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

/**
 * Connects a page to presence. Today that's the mock provider; a real
 * transport would be chosen here. Pointer moves are only forwarded while
 * "Show my cursor to others" is on.
 */
export function PresenceRoot({ room, children }: { room: MockRoom; children: React.ReactNode }) {
  const providerRef = useRef<PresenceProvider | null>(null);
  if (!providerRef.current) providerRef.current = new MockPresenceProvider(room);
  const provider = providerRef.current;

  const [snapshot, setSnapshot] = useState<PresenceSnapshot | null>(null);
  const [prefs, setPrefsState] = useState<CursorPrefs>(DEFAULT_CURSOR_PREFS);

  // Load saved preferences after mount (avoids a server/client mismatch).
  useEffect(() => {
    setPrefsState(loadCursorPrefs(browserStorage()));
  }, []);

  useEffect(() => provider.subscribe(setSnapshot), [provider]);
  useEffect(() => () => provider.disconnect(), [provider]);
  useEffect(() => provider.setSharing(prefs.shareMine), [provider, prefs.shareMine]);

  // Broadcast this viewer's pointer only while sharing is on.
  useEffect(() => {
    if (!prefs.shareMine) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        provider.publishPointer({ x: e.clientX / window.innerWidth, y: e.pageY });
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [provider, prefs.shareMine]);

  const value = useMemo<PresenceContextValue>(
    () => ({
      snapshot,
      prefs,
      isMock: provider.isMock,
      setPrefs: (next) => {
        setPrefsState(next);
        saveCursorPrefs(browserStorage(), next);
      },
    }),
    [snapshot, prefs, provider],
  );

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}
