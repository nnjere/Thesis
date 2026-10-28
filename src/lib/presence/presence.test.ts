import { describe, expect, it } from "vitest";
import { MockPresenceProvider } from "./mock";
import { CURSOR_PREFS_KEY, DEFAULT_CURSOR_PREFS, loadCursorPrefs, saveCursorPrefs } from "./prefs";
import type { PresenceSnapshot } from "./types";

function memoryStorage() {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), data };
}

describe("cursor prefs", () => {
  it("defaults to both on and round-trips", () => {
    const s = memoryStorage();
    expect(loadCursorPrefs(s)).toEqual(DEFAULT_CURSOR_PREFS);
    saveCursorPrefs(s, { showOthers: false, shareMine: false });
    expect(loadCursorPrefs(s)).toEqual({ showOthers: false, shareMine: false });
  });

  it("survives broken or throwing storage", () => {
    const bad = { getItem: () => { throw new Error("SecurityError"); }, setItem: () => { throw new Error("QuotaExceeded"); } };
    expect(loadCursorPrefs(bad)).toEqual(DEFAULT_CURSOR_PREFS);
    expect(() => saveCursorPrefs(bad, DEFAULT_CURSOR_PREFS)).not.toThrow();
    const s = memoryStorage();
    s.setItem(CURSOR_PREFS_KEY, "{not json");
    expect(loadCursorPrefs(s)).toEqual(DEFAULT_CURSOR_PREFS);
    s.setItem(CURSOR_PREFS_KEY, JSON.stringify({ showOthers: "nope", shareMine: false }));
    expect(loadCursorPrefs(s)).toEqual({ showOthers: true, shareMine: false });
    expect(loadCursorPrefs(undefined)).toEqual(DEFAULT_CURSOR_PREFS);
  });
});

describe("MockPresenceProvider", () => {
  it("sends pointer updates only while sharing", () => {
    const p = new MockPresenceProvider({ kind: "project" });
    p.publishPointer({ x: 0.5, y: 100 });
    p.setSharing(false);
    p.publishPointer({ x: 0.6, y: 200 });
    p.publishPointer({ x: 0.7, y: 300 });
    expect(p.sent).toEqual([{ x: 0.5, y: 100 }]);
    p.setSharing(true);
    p.publishPointer({ x: 0.1, y: 1 });
    expect(p.sent).toHaveLength(2);
  });

  it("announces a private viewer as someone, without changing who else is here", () => {
    const p = new MockPresenceProvider({ kind: "project" });
    const seen: PresenceSnapshot[] = [];
    const off = p.subscribe((s) => seen.push(s));
    p.setSharing(false);
    expect(seen.at(-1)!.self).toEqual({ sharing: false, displayName: "someone" });
    expect(seen.at(-1)!.people).toHaveLength(4);
    off();
    p.setSharing(true);
    expect(seen).toHaveLength(2);
  });
});
