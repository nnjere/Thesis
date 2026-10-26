/**
 * Workflow protection: the guarantees this product makes to the projects it
 * lists. These are enforced in code (not just documented), and covered by
 * tests in workflow-protection.test.ts.
 *
 *  1. GitHub is only ever read. The only HTTP methods allowed are GET/HEAD,
 *     and only against an allowlist of public, read-only endpoints.
 *  2. No writes of any kind to the original repository: no pushes, branches,
 *     commits, pull requests, issues, comments, stars, forks, releases,
 *     workflow dispatches or settings changes.
 *  3. Sandboxes work on a detached snapshot (an archive download with no
 *     `.git` directory and no remote), so there is nothing to push to.
 *  4. The original project's GitHub Actions are never triggered, and the
 *     `.github/` directory of a snapshot is ignored by the executor.
 *  5. No user or host credentials are ever placed inside a sandbox.
 */

export class WorkflowProtectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkflowProtectionError";
  }
}

export const ALLOWED_GITHUB_METHODS = ["GET", "HEAD"] as const;

const SEGMENT = "[A-Za-z0-9_.-]+";

/** Public, read-only GitHub REST endpoints the analyser may call. */
export const ALLOWED_GITHUB_PATHS: RegExp[] = [
  new RegExp(`^/repos/${SEGMENT}/${SEGMENT}$`),
  new RegExp(`^/repos/${SEGMENT}/${SEGMENT}/readme$`),
  new RegExp(`^/repos/${SEGMENT}/${SEGMENT}/contents(/[A-Za-z0-9_.\\-/]*)?$`),
  new RegExp(`^/repos/${SEGMENT}/${SEGMENT}/releases/latest$`),
  new RegExp(`^/repos/${SEGMENT}/${SEGMENT}/topics$`),
  new RegExp(`^/repos/${SEGMENT}/${SEGMENT}/tarball(/${SEGMENT})?$`),
];

export function assertReadOnlyGitHubRequest(method: string, path: string): void {
  const upper = method.toUpperCase();
  if (!(ALLOWED_GITHUB_METHODS as readonly string[]).includes(upper)) {
    throw new WorkflowProtectionError(`Blocked ${upper} request: this app never writes to GitHub.`);
  }
  if (path.includes("..")) {
    throw new WorkflowProtectionError("Blocked request: path traversal is not allowed.");
  }
  const pathOnly = path.split("?")[0];
  if (!ALLOWED_GITHUB_PATHS.some((re) => re.test(pathOnly))) {
    throw new WorkflowProtectionError(`Blocked request to ${pathOnly}: not on the read-only allowlist.`);
  }
}

/** Git operations that must never be possible from inside a sandbox. */
export const FORBIDDEN_GIT_OPERATIONS = [
  "push",
  "remote add",
  "remote set-url",
  "credential",
  "request-pull",
  "send-email",
] as const;

/** How the repository is copied into a sandbox. */
export interface SnapshotPolicy {
  /** Download a source archive instead of cloning, so no remote exists. */
  method: "archive-download";
  includeGitDirectory: false;
  configureGitRemote: false;
  /** Paths in the snapshot the executor must never act on. */
  ignoredPaths: string[];
}

export const DEFAULT_SNAPSHOT_POLICY: SnapshotPolicy = {
  method: "archive-download",
  includeGitDirectory: false,
  configureGitRemote: false,
  ignoredPaths: [".github/"],
};

export function assertSafeSnapshotPolicy(policy: SnapshotPolicy): void {
  if (policy.method !== "archive-download") {
    throw new WorkflowProtectionError("Snapshots must be archive downloads, not clones.");
  }
  if (policy.includeGitDirectory || policy.configureGitRemote) {
    throw new WorkflowProtectionError("Snapshots must not contain git history or a remote.");
  }
  if (!policy.ignoredPaths.includes(".github/")) {
    throw new WorkflowProtectionError("The .github/ directory must be ignored by the executor.");
  }
}

/**
 * Checks a command the sandbox (or a future AI setup agent) wants to run.
 * Defence in depth: the snapshot has no remote and no credentials anyway.
 */
export function assertCommandRespectsWorkflows(command: string): void {
  const normalised = command.toLowerCase().replace(/\s+/g, " ").trim();
  // Check each git invocation (split on shell separators), wherever its
  // options sit: "git -C dir push" is still a push.
  for (const segment of normalised.split(/[;&|\n]+|\$\(|`/)) {
    if (!/(^|\s)git(\s|$)/.test(segment)) continue;
    for (const op of FORBIDDEN_GIT_OPERATIONS) {
      if (new RegExp(`(^|\\s)${op.replace(" ", "\\s+")}(\\s|$)`).test(segment)) {
        throw new WorkflowProtectionError(`Blocked command: "git ${op}" could affect the original project.`);
      }
    }
  }
  if (/(^|[;&|\s])gh\s+/.test(normalised)) {
    throw new WorkflowProtectionError("Blocked command: the GitHub CLI is not available in sandboxes.");
  }
  if (/api\.github\.com/.test(normalised) && /(-x|--request)\s*(post|put|patch|delete)/.test(normalised)) {
    throw new WorkflowProtectionError("Blocked command: write requests to GitHub are not allowed.");
  }
}
