/** Parsing and validation of user-supplied GitHub repository URLs. */

export interface RepoRef {
  owner: string;
  name: string;
  /** Canonical https://github.com/owner/name URL. */
  url: string;
}

export type ParseResult = { ok: true; repo: RepoRef } | { ok: false; reason: string };

// GitHub's own rules: owners are alphanumeric with single hyphens, max 39
// characters; repository names allow letters, digits, ".", "-" and "_".
const OWNER_RE = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;
const NAME_RE = /^[A-Za-z0-9_.-]{1,100}$/;

const RESERVED_OWNERS = new Set([
  "about", "settings", "marketplace", "explore", "topics", "trending", "orgs", "users",
  "login", "join", "features", "pricing", "sponsors", "notifications", "new", "search",
]);

export function parseGitHubUrl(input: string): ParseResult {
  const raw = input.trim();
  if (!raw) return { ok: false, reason: "Paste a link to a project on GitHub." };
  if (raw.length > 300) return { ok: false, reason: "That link is too long to be a GitHub project link." };

  // Accept "owner/name" shorthand.
  let candidate = raw;
  if (/^[^/\s:]+\/[^/\s:]+$/.test(raw)) candidate = `https://github.com/${raw}`;
  else if (/^(www\.)?github\.com\//i.test(raw)) candidate = `https://${raw}`;
  else if (/^git@github\.com:/i.test(raw)) candidate = `https://github.com/${raw.replace(/^git@github\.com:/i, "")}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return { ok: false, reason: "That doesn't look like a web link. Try something like github.com/owner/project." };
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, reason: "Only regular web links (https://) are supported." };
  }
  const host = url.hostname.toLowerCase();
  if (host !== "github.com" && host !== "www.github.com") {
    return { ok: false, reason: "Only projects hosted on github.com are supported right now." };
  }
  if (url.username || url.password || url.port) {
    return { ok: false, reason: "That link contains extra login or port details. Please use the plain project link." };
  }

  const [owner, rawName] = url.pathname.split("/").filter(Boolean);
  if (!owner || !rawName) {
    return { ok: false, reason: "That link points to a GitHub page, not a specific project. It should look like github.com/owner/project." };
  }
  const name = rawName.replace(/\.git$/i, "");
  if (RESERVED_OWNERS.has(owner.toLowerCase())) {
    return { ok: false, reason: "That link points to a GitHub page, not a specific project." };
  }
  if (!OWNER_RE.test(owner) || !NAME_RE.test(name) || name === "." || name === "..") {
    return { ok: false, reason: "That project name doesn't look valid. Check the link and try again." };
  }

  return { ok: true, repo: { owner, name, url: `https://github.com/${owner}/${name}` } };
}
