import type { WorkspaceScenario } from "./types";

/**
 * "Profiles, but more like Mastodon" on the Bluesky app's profile page.
 * The preview is a pretend profile drawn by Sandbox; nothing touches the
 * real app or network. People and handles below are demo fixtures.
 */
export const blueskyProfile: WorkspaceScenario = {
  id: "bluesky-profile",
  projectSlug: "bluesky-app",
  title: "Profiles, but more like Mastodon",
  ideaTag: "Like Mastodon",
  previewNoun: "profile page",
  safetyNote: "Pretend profile — nothing is changed for real",
  groups: [
    { id: "details", title: "Profile details" },
    { id: "privacy", title: "Privacy and layout" },
  ],
  editingGroup: "privacy",
  settings: [
    { id: "fields", group: "details", title: "Verified links", hint: "A small table of links, ticked if proven", diff: { title: "Profile links", before: "profile.fields: none", after: "profile.fields: up to 4, links verified ✓" } },
    { id: "tags", group: "details", title: "Featured hashtags", hint: "Topics you post about most", diff: { title: "Featured hashtags", before: "featuredHashtags: off", after: "featuredHashtags: on" } },
    { id: "server", group: "details", title: "Show their server", hint: "@name@server, like Mastodon", diff: { title: "Handle", before: "handle: '@maya.bsky.social'", after: "handle: '@maya@garden.example'" } },
    { id: "locked", group: "privacy", title: "Approve new followers", hint: "Follow becomes “Request to follow”", diff: { title: "Who can follow", before: "followPolicy: 'anyone'", after: "followPolicy: 'approve'" } },
    { id: "hideCounts", group: "privacy", title: "Hide follower counts", hint: "Less of a popularity contest", diff: { title: "Follower counts", before: "showFollowerCounts: true", after: "showFollowerCounts: false" } },
    { id: "mtabs", group: "privacy", title: "Mastodon-style tabs", hint: "Posts · Posts & replies · Media", diff: { title: "Profile tabs", before: "tabs: Posts, Replies, Media, Likes, Feeds", after: "tabs: Posts, Posts & replies, Media" } },
  ],
  original: { fields: false, tags: false, server: false, locked: false, hideCounts: false, mtabs: false },
  exampleDraft: { fields: true, locked: true },
  suggestions: [
    { id: "verified-links", title: "Verified links on profiles", description: "A small table of links on your profile, with a green tick when you’ve proven you own the site.", by: "@maya", values: { fields: true } },
    { id: "approve-followers", title: "Approve new followers", description: "Let people choose who follows them, so Follow becomes “Request to follow”.", by: "@jun", values: { locked: true } },
    { id: "hide-counts", title: "Hide follower counts", description: "Make profiles less of a popularity contest by keeping the numbers private.", by: "@ola", values: { hideCounts: true } },
  ],
  about: {
    paragraphs: [
      "You’re testing profile ideas from Mastodon — another open-source social network — on a private copy of the Bluesky app’s profile page. The profile and its posts are pretend, drawn by Sandbox rather than the real app.",
      "Sharing a suggestion with the maintainers isn’t connected yet. In this prototype, “Share suggestion” only marks your draft as shared; nothing is sent anywhere.",
    ],
    inspiredBy: { name: "Mastodon", repo: "mastodon/mastodon" },
  },
};
