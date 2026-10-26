import { describe, expect, it, vi } from "vitest";
import { GitHubReadOnlyClient } from "@/lib/repo/github-client";
import { DEFAULT_SANDBOX_POLICY, assertSafeSandboxPolicy } from "@/lib/sandbox/policy";
import {
  DEFAULT_SNAPSHOT_POLICY,
  WorkflowProtectionError,
  assertCommandRespectsWorkflows,
  assertReadOnlyGitHubRequest,
  assertSafeSnapshotPolicy,
} from "./workflow-protection";

describe("GitHub requests are read-only", () => {
  it.each(["POST", "PUT", "PATCH", "DELETE", "post"])("blocks %s", (method) => {
    expect(() => assertReadOnlyGitHubRequest(method, "/repos/a/b")).toThrow(WorkflowProtectionError);
  });

  it.each([
    "/repos/a/b",
    "/repos/a/b/readme",
    "/repos/a/b/contents",
    "/repos/a/b/contents/package.json",
    "/repos/a/b/contents/.devcontainer",
    "/repos/a/b/releases/latest",
  ])("allows GET %s", (path) => {
    expect(() => assertReadOnlyGitHubRequest("GET", path)).not.toThrow();
  });

  it.each([
    "/repos/a/b/pulls",
    "/repos/a/b/issues",
    "/repos/a/b/forks",
    "/repos/a/b/git/refs",
    "/repos/a/b/actions/workflows/ci.yml/dispatches",
    "/repos/a/b/dispatches",
    "/repos/a/b/hooks",
    "/user/starred/a/b",
    "/repos/a/b/contents/../../x",
  ])("blocks endpoints off the allowlist, even for GET: %s", (path) => {
    expect(() => assertReadOnlyGitHubRequest("GET", path)).toThrow(WorkflowProtectionError);
  });

  it("the client only ever sends GET", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ full_name: "a/b" }), { status: 200 }));
    const client = new GitHubReadOnlyClient(fetchImpl, undefined);
    await client.getRepo("a", "b");
    for (const call of fetchImpl.mock.calls as unknown as [string, RequestInit][]) {
      expect(call[1].method).toBe("GET");
      expect(call[0].startsWith("https://api.github.com/")).toBe(true);
    }
  });

  it("the client refuses names that would escape the allowlist", async () => {
    const fetchImpl = vi.fn();
    const client = new GitHubReadOnlyClient(fetchImpl, undefined);
    await expect(client.getTextFile("a", "b", "../../user/repos")).rejects.toThrow(WorkflowProtectionError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("sandbox commands cannot affect the original project", () => {
  it.each([
    "git push origin main",
    "git -C repo push --force",
    "npm i && git push",
    "git remote add upstream https://github.com/a/b",
    "git remote set-url origin x",
    "gh pr create --fill",
    "gh workflow run ci.yml",
    "curl -X POST https://api.github.com/repos/a/b/dispatches",
    "git credential fill",
  ])("blocks: %s", (cmd) => {
    expect(() => assertCommandRespectsWorkflows(cmd)).toThrow(WorkflowProtectionError);
  });

  it.each(["npm install", "npm run dev -- --port 3000", "pip install -r requirements.txt", "git status", "python app.py --push-notifications"])(
    "allows: %s",
    (cmd) => {
      expect(() => assertCommandRespectsWorkflows(cmd)).not.toThrow();
    },
  );
});

describe("snapshot and sandbox policies", () => {
  it("defaults are safe", () => {
    expect(() => assertSafeSnapshotPolicy(DEFAULT_SNAPSHOT_POLICY)).not.toThrow();
    expect(() => assertSafeSandboxPolicy(DEFAULT_SANDBOX_POLICY)).not.toThrow();
  });

  it("rejects snapshots with git history, a remote, or executable workflows", () => {
    expect(() => assertSafeSnapshotPolicy({ ...DEFAULT_SNAPSHOT_POLICY, includeGitDirectory: true as false })).toThrow();
    expect(() => assertSafeSnapshotPolicy({ ...DEFAULT_SNAPSHOT_POLICY, configureGitRemote: true as false })).toThrow();
    expect(() => assertSafeSnapshotPolicy({ ...DEFAULT_SNAPSHOT_POLICY, method: "git-clone" as "archive-download" })).toThrow();
    expect(() => assertSafeSnapshotPolicy({ ...DEFAULT_SNAPSHOT_POLICY, ignoredPaths: [] })).toThrow();
  });

  it("rejects sandboxes that can reach GitHub, hold credentials or exceed limits", () => {
    const base = DEFAULT_SANDBOX_POLICY;
    expect(() => assertSafeSandboxPolicy({ ...base, network: { ...base.network, allowedHosts: ["api.github.com"] } })).toThrow();
    expect(() => assertSafeSandboxPolicy({ ...base, network: { ...base.network, allowedHosts: ["*.example.com"] } })).toThrow();
    expect(() => assertSafeSandboxPolicy({ ...base, credentials: "github-token" as "none" })).toThrow();
    expect(() => assertSafeSandboxPolicy({ ...base, mountHostFilesystem: true as false })).toThrow();
    expect(() => assertSafeSandboxPolicy({ ...base, maxLifetimeMs: 24 * 3600_000 })).toThrow();
    expect(() => assertSafeSandboxPolicy({ ...base, resources: { ...base.resources, memoryMb: 65536 } })).toThrow();
  });
});
