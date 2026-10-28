import type { SettingValues, WorkspaceScenario, WorkspaceState } from "./types";

export const LOG_LIMIT = 5;

/** Initial state, optionally from a suggestion preset or the example draft. */
export function initialState(scenario: WorkspaceScenario, suggestionId?: string | null): WorkspaceState {
  const preset = suggestionId ? scenario.suggestions.find((s) => s.id === suggestionId) : undefined;
  const mine = { ...scenario.original, ...(preset ? preset.values : scenario.exampleDraft) };
  const loaded = preset ? `You opened the suggestion “${preset.title}”` : `You opened an example draft with ${changedSettings(scenario, mine).length} changes`;
  return { mine, view: "yours", log: [loaded, `You opened a ${scenario.previewNoun} to test changes`], lastKey: null, shared: false };
}

/** Settings whose value differs from the original, in scenario order. */
export function changedSettings(scenario: WorkspaceScenario, mine: SettingValues) {
  return scenario.settings.filter((s) => Boolean(mine[s.id]) !== Boolean(scenario.original[s.id]));
}

/** What the preview should render for the current view. */
export function visibleValues(scenario: WorkspaceScenario, state: WorkspaceState): SettingValues {
  return state.view === "original" ? scenario.original : state.mine;
}

/**
 * Flip a setting. Any change jumps back to "Your version" and un-shares the
 * suggestion. Flipping the same switch back and forth replaces the newest
 * log line instead of flooding the log.
 */
export function toggleSetting(scenario: WorkspaceScenario, state: WorkspaceState, id: string, on: boolean): WorkspaceState {
  const setting = scenario.settings.find((s) => s.id === id);
  if (!setting) return state;
  const key = `${id}:${on}`;
  const message = `You turned ${setting.title} ${on ? "on" : "off"}`;
  const sameSwitch = state.lastKey !== null && state.lastKey.split(":")[0] === id;
  const log = (sameSwitch ? [message, ...state.log.slice(1)] : [message, ...state.log]).slice(0, LOG_LIMIT);
  return { ...state, mine: { ...state.mine, [id]: on }, view: "yours", log, lastKey: key, shared: false };
}

export function setView(state: WorkspaceState, view: WorkspaceState["view"]): WorkspaceState {
  return { ...state, view };
}

export function shareSuggestion(state: WorkspaceState): WorkspaceState {
  if (state.shared) return state;
  return { ...state, shared: true, lastKey: "share", log: ["You marked this suggestion as shared (demo — nothing was sent)", ...state.log].slice(0, LOG_LIMIT) };
}
