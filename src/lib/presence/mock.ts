import type { PointerPosition, PresencePerson, PresenceProvider, PresenceSnapshot, RemoteCursor } from "./types";

/** Demo-only people. Never shown outside the mock provider. */
const PEOPLE: Record<string, PresencePerson> = {
  maya: { id: "demo-maya", name: "Maya", initials: "M", color: "var(--color-presence-orange)" },
  jun: { id: "demo-jun", name: "Jun", initials: "J", color: "var(--color-presence-purple)" },
  ola: { id: "demo-ola", name: "Ola", initials: "O", color: "var(--color-presence-teal)" },
  sam: { id: "demo-sam", name: "Sam", initials: "S", color: "var(--color-presence-pink)" },
};

export type MockRoom = { kind: "project"; bubble?: string } | { kind: "workspace"; bubble?: string };

function fixture(room: MockRoom): { people: PresencePerson[]; cursors: RemoteCursor[] } {
  if (room.kind === "workspace") {
    return {
      people: [PEOPLE.maya],
      cursors: [{ person: PEOPLE.maya, left: "auto", top: 360, bubble: room.bubble, demoAnimation: "cursor-drift 6s ease-in-out infinite" }],
    };
  }
  return {
    people: [PEOPLE.maya, PEOPLE.jun, PEOPLE.ola, PEOPLE.sam],
    cursors: [
      { person: PEOPLE.maya, left: "9%", top: 500, demoAnimation: "cursor-a 13s ease-in-out infinite" },
      { person: PEOPLE.jun, left: "66%", top: 300, demoAnimation: "cursor-b 11s ease-in-out infinite" },
      { person: PEOPLE.ola, left: "20%", top: 870, bubble: room.bubble, demoAnimation: "cursor-c 15s ease-in-out infinite" },
      { person: PEOPLE.sam, left: "78%", top: 1300, demoAnimation: "cursor-d 12s ease-in-out infinite" },
    ],
  };
}

/**
 * Animated sample cursors so the design can be tried without a server.
 * It never transmits anything; `sent` records what a real transport would
 * have sent, so tests can check that private mode sends nothing.
 */
export class MockPresenceProvider implements PresenceProvider {
  readonly isMock = true;
  readonly sent: PointerPosition[] = [];
  private sharing = true;
  private listeners = new Set<(s: PresenceSnapshot) => void>();
  private readonly data: ReturnType<typeof fixture>;

  constructor(room: MockRoom) {
    this.data = fixture(room);
  }

  private snapshot(): PresenceSnapshot {
    return {
      people: this.data.people,
      cursors: this.data.cursors,
      self: { sharing: this.sharing, displayName: this.sharing ? "You" : "someone" },
    };
  }

  private emit() {
    const s = this.snapshot();
    for (const l of this.listeners) l(s);
  }

  subscribe(listener: (s: PresenceSnapshot) => void) {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  setSharing(share: boolean) {
    if (share === this.sharing) return;
    this.sharing = share;
    this.emit();
  }

  publishPointer(position: PointerPosition) {
    if (!this.sharing) return; // private: nothing leaves this browser
    if (this.sent.length >= 500) this.sent.shift();
    this.sent.push(position);
  }

  disconnect() {
    this.listeners.clear();
  }
}
