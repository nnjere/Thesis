import {
  DEFAULT_SNAPSHOT_POLICY,
  WorkflowProtectionError,
  assertSafeSnapshotPolicy,
  type SnapshotPolicy,
} from "@/lib/safety/workflow-protection";

/**
 * The isolation contract every sandbox provider must honour. A provider
 * receives this policy and must refuse to start if it cannot enforce it.
 */
export interface SandboxPolicy {
  network: {
    mode: "deny-by-default";
    /** Outbound hosts allowed during setup (package registries only). */
    allowedHosts: string[];
  };
  resources: { cpus: number; memoryMb: number; diskMb: number; maxProcesses: number };
  /** Hard cap on a session's total lifetime. */
  maxLifetimeMs: number;
  /** Session ends after this long without a heartbeat from the viewer. */
  idleTimeoutMs: number;
  /** Sandboxes never receive host, user or GitHub credentials. */
  credentials: "none";
  snapshot: SnapshotPolicy;
  mountHostFilesystem: false;
  allowPrivilegeEscalation: false;
  /** Only the preview port is exposed, through the provider's own proxy. */
  exposedPorts: "preview-only";
}

export const DEFAULT_SANDBOX_POLICY: SandboxPolicy = {
  network: {
    mode: "deny-by-default",
    allowedHosts: [
      "registry.npmjs.org",
      "pypi.org",
      "files.pythonhosted.org",
      "proxy.golang.org",
      "index.crates.io",
      "static.crates.io",
    ],
  },
  resources: { cpus: 2, memoryMb: 2048, diskMb: 4096, maxProcesses: 256 },
  maxLifetimeMs: 30 * 60 * 1000,
  idleTimeoutMs: 10 * 60 * 1000,
  credentials: "none",
  snapshot: DEFAULT_SNAPSHOT_POLICY,
  mountHostFilesystem: false,
  allowPrivilegeEscalation: false,
  exposedPorts: "preview-only",
};

const FORBIDDEN_HOSTS = ["github.com", "api.github.com", "uploads.github.com", "codeload.github.com"];

export function assertSafeSandboxPolicy(policy: SandboxPolicy): void {
  assertSafeSnapshotPolicy(policy.snapshot);
  if (policy.network.mode !== "deny-by-default") throw new WorkflowProtectionError("Sandbox network must be deny-by-default.");
  const blocked = policy.network.allowedHosts.filter((h) => FORBIDDEN_HOSTS.includes(h.toLowerCase()));
  if (blocked.length) {
    // The snapshot is fetched by the orchestrator, not the sandbox, so the
    // sandbox itself never needs to talk to GitHub.
    throw new WorkflowProtectionError(`Sandboxes may not reach GitHub (${blocked.join(", ")}).`);
  }
  if (policy.network.allowedHosts.some((h) => h.includes("*"))) throw new WorkflowProtectionError("Wildcard hosts are not allowed.");
  if (policy.credentials !== "none") throw new WorkflowProtectionError("Sandboxes must not receive credentials.");
  if (policy.mountHostFilesystem || policy.allowPrivilegeEscalation) throw new WorkflowProtectionError("Host access is not allowed.");
  if (policy.maxLifetimeMs > 2 * 60 * 60 * 1000) throw new WorkflowProtectionError("Session lifetime is capped at two hours.");
  if (policy.idleTimeoutMs > policy.maxLifetimeMs) throw new WorkflowProtectionError("Idle timeout must not exceed lifetime.");
  const { cpus, memoryMb, diskMb } = policy.resources;
  if (cpus > 4 || memoryMb > 8192 || diskMb > 20480) throw new WorkflowProtectionError("Resource limits exceed the allowed maximum.");
}
