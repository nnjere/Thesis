"use client";

import { LiveCursor, PresenceAvatars } from "@/components/ui/Presence";
import { CursorMenu } from "./CursorMenu";
import { usePresence } from "./PresenceRoot";

/** Avatars, a plain-text viewer count (what screen readers get) and the Cursors menu. */
export function PresenceControls({ variant }: { variant: "project" | "workspace" }) {
  const { snapshot, isMock } = usePresence();
  const people = snapshot?.people ?? [];
  const named = people.map((p) => p.name ?? "someone");
  const you = { id: "you", initials: "You", color: "var(--color-presence-you)", name: "You" };

  const text =
    variant === "workspace"
      ? people.length === 0
        ? "Just you"
        : `${named.join(" and ")} ${people.length === 1 ? "is" : "are"} here`
      : `${people.length} ${people.length === 1 ? "person" : "people"} looking at this page`;

  return (
    <>
      <div className="flex items-center gap-2.5">
        <PresenceAvatars people={variant === "workspace" ? [you, ...people] : people} />
        <span className="text-[13px] text-muted">
          {text}
          {isMock && <span title="Sample people from a demo presence feed, not real visitors"> · demo</span>}
        </span>
      </div>
      <CursorMenu collaborator={variant === "workspace" ? (people[0]?.name ?? undefined) : undefined} />
    </>
  );
}

/** Remote cursors drawn over the page. Hidden entirely when "See other people's cursors" is off. */
export function RemoteCursorLayer({ variant }: { variant: "project" | "workspace" }) {
  const { snapshot, prefs } = usePresence();
  if (!prefs.showOthers || !snapshot) return null;
  return (
    <div aria-hidden className={variant === "project" ? "pointer-events-none absolute inset-0 overflow-hidden" : "contents"}>
      {snapshot.cursors.map((c) => (
        <LiveCursor
          key={c.person.id}
          name={c.person.name ?? "someone"}
          color={c.person.color}
          bubble={c.bubble}
          style={{
            ...(c.left === "auto" ? { right: 72 } : { left: c.left }),
            top: c.top,
            animation: c.demoAnimation,
          }}
        />
      ))}
    </div>
  );
}

/** Your own pointer label on the node you're editing: "You", or "You · private". */
export function YouCursor() {
  const { snapshot } = usePresence();
  const sharing = snapshot?.self.sharing ?? true;
  return (
    <span aria-hidden className="pointer-events-none absolute -right-1.5 top-[30px] z-[4]">
      <LiveCursor name={sharing ? "You" : "You · private"} color="var(--color-presence-you)" className="!static" />
    </span>
  );
}
