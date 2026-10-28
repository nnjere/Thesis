import { describe, expect, it } from "vitest";
import { getProject, listProjects } from "@/lib/catalog";
import { blueskyProfile as s } from "./bluesky-profile";
import { LOG_LIMIT, changedSettings, getScenario, initialState, setView, shareSuggestion, toggleSetting, visibleValues } from ".";

describe("workspace scenarios", () => {
  it("every catalog workspace id resolves to a scenario for that project", () => {
    for (const p of listProjects().filter((p) => p.workspace)) {
      expect(getScenario(p.workspace)?.projectSlug, p.slug).toBe(p.slug);
    }
    expect(getScenario("toString")).toBeUndefined();
  });

  it("scenario settings, groups and presets are consistent", () => {
    const ids = new Set(s.settings.map((x) => x.id));
    for (const x of s.settings) expect(s.groups.map((g) => g.id)).toContain(x.group);
    for (const id of Object.keys(s.original)) expect(ids.has(id)).toBe(true);
    for (const p of s.suggestions) for (const id of Object.keys(p.values)) expect(ids.has(id), p.id).toBe(true);
    expect(getProject(s.projectSlug)?.license).toBe("MIT");
  });
});

describe("workspace logic", () => {
  it("starts from the example draft, or from a suggestion preset", () => {
    const draft = initialState(s);
    expect(changedSettings(s, draft.mine).map((x) => x.id)).toEqual(["fields", "locked"]);
    expect(draft.log[0]).toMatch(/example draft with 2 changes/);
    const preset = initialState(s, "hide-counts");
    expect(changedSettings(s, preset.mine).map((x) => x.id)).toEqual(["hideCounts"]);
    expect(preset.log[0]).toMatch(/Hide follower counts/);
    expect(initialState(s, "nope").mine).toEqual(draft.mine);
  });

  it("lists only settings that differ from the original", () => {
    let st = initialState(s);
    st = toggleSetting(s, st, "fields", false);
    st = toggleSetting(s, st, "locked", false);
    expect(changedSettings(s, st.mine)).toHaveLength(0);
  });

  it("logs each change, collapses repeated flips of one switch, and keeps 5", () => {
    let st = initialState(s);
    st = toggleSetting(s, st, "tags", true);
    st = toggleSetting(s, st, "tags", false);
    expect(st.log[0]).toBe("You turned Featured hashtags off");
    expect(st.log.filter((l) => l.includes("Featured hashtags"))).toHaveLength(1);
    for (const id of ["server", "mtabs", "hideCounts", "tags"]) st = toggleSetting(s, st, id, true);
    expect(st.log).toHaveLength(LOG_LIMIT);
    expect(st.log[0]).toBe("You turned Featured hashtags on");
  });

  it("Original shows the unchanged settings; any change jumps back to Your version", () => {
    let st = setView(initialState(s), "original");
    expect(visibleValues(s, st)).toEqual(s.original);
    st = toggleSetting(s, st, "server", true);
    expect(st.view).toBe("yours");
    expect(visibleValues(s, st).server).toBe(true);
  });

  it("sharing moves Draft to Shared, says nothing was sent, and a later change un-shares", () => {
    let st = shareSuggestion(initialState(s));
    expect(st.shared).toBe(true);
    expect(st.log[0]).toMatch(/nothing was sent/);
    expect(shareSuggestion(st)).toBe(st);
    st = toggleSetting(s, st, "tags", true);
    expect(st.shared).toBe(false);
  });
});
