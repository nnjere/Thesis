import { blueskyProfile } from "./bluesky-profile";
import type { WorkspaceScenario } from "./types";

const SCENARIOS: Record<string, WorkspaceScenario> = { [blueskyProfile.id]: blueskyProfile };

export function getScenario(id: string | undefined): WorkspaceScenario | undefined {
  return id && Object.prototype.hasOwnProperty.call(SCENARIOS, id) ? SCENARIOS[id] : undefined;
}

export * from "./logic";
export * from "./types";
