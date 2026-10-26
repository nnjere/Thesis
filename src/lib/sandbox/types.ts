import type { Project } from "@/lib/catalog/types";
import type { SandboxPolicy } from "./policy";

/** The four user-facing launch steps, worded for non-technical users. */
export const LAUNCH_STEPS = [
  { id: "fetch", label: "Getting the project ready…" },
  { id: "environment", label: "Preparing the environment…" },
  { id: "check", label: "Checking that everything works…" },
  { id: "finish", label: "Almost ready…" },
] as const;

export type StepStatus = "pending" | "active" | "done" | "failed";

export type LaunchResult =
  /** A real, running app to show in a sandboxed frame. */
  | { kind: "embedded-web-app"; url: string }
  /** A real tool adapter to show as a form. */
  | { kind: "tool-form"; adapterId: string }
  /** The simulation finished. Nothing was actually run. */
  | { kind: "simulated-complete"; wouldShow: string; hostedAlternative?: string };

export interface FriendlyFailure {
  headline: string;
  explanation: string;
}

export type SessionState = "preparing" | "ready" | "failed" | "ended";

export interface DiagnosticEntry {
  at: string;
  level: "info" | "warn" | "error";
  message: string;
}

/** What the browser is allowed to see about a session. */
export interface PublicSession {
  id: string;
  projectSlug: string;
  state: SessionState;
  simulated: boolean;
  providerLabel: string;
  steps: { id: string; label: string; status: StepStatus }[];
  result?: LaunchResult;
  failure?: FriendlyFailure;
  endedReason?: string;
  createdAt: string;
  expiresAt: string;
}

/** Callbacks a provider uses to report progress. */
export interface ProvisionContext {
  sessionId: string;
  policy: SandboxPolicy;
  /** Mark a step as started (index into LAUNCH_STEPS). */
  step(index: number): void;
  ready(result: LaunchResult): void;
  fail(failure: FriendlyFailure, diagnostic: string): void;
  log(level: DiagnosticEntry["level"], message: string): void;
  /** True once the session has ended; providers should stop work. */
  readonly cancelled: boolean;
}

export interface SandboxProvider {
  readonly id: string;
  /** Shown to users. Simulated providers must say so. */
  readonly label: string;
  /** True when no project code is executed at all. */
  readonly simulated: boolean;
  supports(project: Project): boolean;
  /** Start provisioning. Report progress through ctx; resolve when done. */
  provision(project: Project, ctx: ProvisionContext): Promise<void>;
  /** Release all resources for a session. Must be idempotent. */
  terminate(sessionId: string): Promise<void>;
}
