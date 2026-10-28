/** Cursor privacy preferences. No accounts exist yet, so they live in localStorage. */
export interface CursorPrefs {
  showOthers: boolean;
  shareMine: boolean;
}

export const DEFAULT_CURSOR_PREFS: CursorPrefs = { showOthers: true, shareMine: true };
export const CURSOR_PREFS_KEY = "sandbox.cursorPrefs.v1";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export function loadCursorPrefs(storage: StorageLike | undefined): CursorPrefs {
  try {
    const raw = storage?.getItem(CURSOR_PREFS_KEY);
    if (!raw) return DEFAULT_CURSOR_PREFS;
    const data = JSON.parse(raw) as Partial<CursorPrefs>;
    return {
      showOthers: typeof data.showOthers === "boolean" ? data.showOthers : DEFAULT_CURSOR_PREFS.showOthers,
      shareMine: typeof data.shareMine === "boolean" ? data.shareMine : DEFAULT_CURSOR_PREFS.shareMine,
    };
  } catch {
    return DEFAULT_CURSOR_PREFS;
  }
}

export function saveCursorPrefs(storage: StorageLike | undefined, prefs: CursorPrefs): void {
  try {
    storage?.setItem(CURSOR_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Private mode or blocked storage: the preference lasts for this page only.
  }
}
