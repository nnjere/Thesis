/** A person present on a page. Remote people come from a PresenceProvider. */
export interface PresencePerson {
  id: string;
  /** Display name; null when the person browses privately ("someone"). */
  name: string | null;
  initials: string;
  color: string;
}
