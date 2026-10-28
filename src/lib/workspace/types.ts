/**
 * A workspace scenario: a set of plain-English settings someone can flip to
 * test an idea on a project, compared against the original. The shell
 * (header, file list, tabs, canvas, Changes, Activity, status bar) is
 * generic; each scenario supplies its settings and a preview component.
 */

export type SettingValues = Record<string, boolean>;

export interface WorkspaceSetting {
  id: string;
  /** Node (group) this switch sits in on the canvas. */
  group: string;
  title: string;
  hint: string;
  /** Simplified before/after shown on the Changes tab. Not real code. */
  diff: { title: string; before: string; after: string };
}

export interface SuggestionPreset {
  id: string;
  title: string;
  description: string;
  /** Demo handle. Shown with an [EXAMPLE] marker. */
  by: string;
  values: SettingValues;
}

export interface WorkspaceScenario {
  id: string;
  projectSlug: string;
  /** H1 of the workspace. */
  title: string;
  /** Short tag on suggestion cards, e.g. "Like Mastodon". */
  ideaTag: string;
  /** What the preview shows, for the status bar ("profile page"). */
  previewNoun: string;
  /** "Pretend profile — nothing is changed for real". */
  safetyNote: string;
  groups: { id: string; title: string }[];
  /** Group shown with the "Editing" selection ring. */
  editingGroup: string;
  settings: WorkspaceSetting[];
  original: SettingValues;
  /** The example draft loaded by "Open in sandbox". */
  exampleDraft: SettingValues;
  suggestions: SuggestionPreset[];
  about: { paragraphs: string[]; inspiredBy: { name: string; repo: string } };
  /** Demo-only chat bubbles for the mock presence feed. */
  demoChat?: { workspace?: string; projectPage?: string };
}

export interface WorkspaceState {
  mine: SettingValues;
  view: "original" | "yours";
  log: string[];
  lastKey: string | null;
  shared: boolean;
}
