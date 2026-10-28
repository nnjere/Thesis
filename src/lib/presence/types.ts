/** A person present on a page. Remote people come from a PresenceProvider. */
export interface PresencePerson {
  id: string;
  /** Display name; null when the person browses privately ("someone"). */
  name: string | null;
  initials: string;
  color: string;
}

/** Where a remote pointer is. Real providers send x/y; the mock sends a demo path. */
export interface RemoteCursor {
  person: PresencePerson;
  /** Position within the page: left as a % of width, top in px. */
  left: string;
  top: number;
  /** Optional chat bubble text. */
  bubble?: string;
  /** Mock only: CSS animation for the demo path. */
  demoAnimation?: string;
}

export interface PresenceSnapshot {
  /** Other people on the page (named or "someone"). */
  people: PresencePerson[];
  /** Pointers of people who share them. */
  cursors: RemoteCursor[];
  /** How this viewer appears to others. */
  self: { sharing: boolean; displayName: string };
}

export interface PointerPosition {
  /** Fraction of page width, 0–1. */
  x: number;
  /** Pixels from the top of the page. */
  y: number;
}

/**
 * Presence transport. Implementations: MockPresenceProvider (demo, sends
 * nothing). TODO: a real transport (WebSocket / Liveblocks / Yjs awareness)
 * implementing the same contract.
 *
 * Contract: while sharing is off, publishPointer must not transmit anything,
 * and this viewer is announced without a name or position.
 */
export interface PresenceProvider {
  readonly isMock: boolean;
  subscribe(listener: (snapshot: PresenceSnapshot) => void): () => void;
  setSharing(share: boolean): void;
  publishPointer(position: PointerPosition): void;
  disconnect(): void;
}
