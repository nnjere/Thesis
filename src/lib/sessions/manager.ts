import { randomUUID } from "node:crypto";
import type { Project } from "@/lib/catalog/types";
import { DEFAULT_SANDBOX_POLICY, assertSafeSandboxPolicy, type SandboxPolicy } from "@/lib/sandbox/policy";
import {
  LAUNCH_STEPS,
  type DiagnosticEntry,
  type FriendlyFailure,
  type LaunchResult,
  type ProvisionContext,
  type PublicSession,
  type SandboxProvider,
  type SessionState,
} from "@/lib/sandbox/types";

/**
 * Session management: one session per "Try it" click. Sessions have a hard
 * lifetime and an idle timeout; expired sessions are terminated through
 * their provider and later forgotten. Diagnostics are stored here and never
 * included in the public view.
 */

interface Session {
  id: string;
  project: Project;
  provider: SandboxProvider;
  state: SessionState;
  stepIndex: number;
  result?: LaunchResult;
  failure?: FriendlyFailure;
  diagnostics: DiagnosticEntry[];
  createdAt: number;
  lastSeenAt: number;
  endedAt?: number;
  endedReason?: string;
}

export class SessionCapacityError extends Error {
  constructor() {
    super("Too many sessions are running right now. Please try again in a few minutes.");
    this.name = "SessionCapacityError";
  }
}

export class NoProviderError extends Error {
  constructor(public readonly slug: string) {
    super("This project can't be launched here.");
    this.name = "NoProviderError";
  }
}

export interface SessionManagerOptions {
  providers: SandboxProvider[];
  policy?: SandboxPolicy;
  maxActiveSessions?: number;
  /** How long ended sessions stay readable (so the UI can show why). */
  retentionMs?: number;
  now?: () => number;
}

const MAX_DIAGNOSTICS = 200;

export class SessionManager {
  private readonly sessions = new Map<string, Session>();
  private readonly policy: SandboxPolicy;
  private readonly now: () => number;
  private readonly maxActive: number;
  private readonly retentionMs: number;

  constructor(private readonly options: SessionManagerOptions) {
    this.policy = options.policy ?? DEFAULT_SANDBOX_POLICY;
    assertSafeSandboxPolicy(this.policy);
    this.now = options.now ?? Date.now;
    this.maxActive = options.maxActiveSessions ?? 50;
    this.retentionMs = options.retentionMs ?? 30 * 60 * 1000;
  }

  providerFor(project: Project): SandboxProvider | undefined {
    return this.options.providers.find((p) => p.supports(project));
  }

  create(project: Project): PublicSession {
    this.sweep();
    const provider = this.providerFor(project);
    if (!provider) throw new NoProviderError(project.slug);
    const active = [...this.sessions.values()].filter((s) => s.state === "preparing" || s.state === "ready").length;
    if (active >= this.maxActive) throw new SessionCapacityError();

    const now = this.now();
    const session: Session = {
      id: randomUUID(),
      project,
      provider,
      state: "preparing",
      stepIndex: 0,
      diagnostics: [],
      createdAt: now,
      lastSeenAt: now,
    };
    this.sessions.set(session.id, session);
    this.log(session, "info", `session created for ${project.slug} using provider ${provider.id}`);

    const ctx = this.contextFor(session);
    provider.provision(project, ctx).catch((err: unknown) => {
      ctx.fail(
        { headline: "Something went wrong while starting this project", explanation: "It's not something you did. Please try again, or try a different project." },
        `provider threw: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}`,
      );
    });
    return this.toPublic(session);
  }

  private contextFor(session: Session): ProvisionContext {
    const isLive = () => session.state === "preparing";
    return {
      sessionId: session.id,
      policy: this.policy,
      get cancelled() {
        return session.state === "ended";
      },
      step: (index) => {
        if (!isLive()) return;
        session.stepIndex = Math.max(0, Math.min(index, LAUNCH_STEPS.length - 1));
      },
      ready: (result) => {
        if (!isLive()) return;
        session.state = "ready";
        session.stepIndex = LAUNCH_STEPS.length - 1;
        session.result = result;
        this.log(session, "info", `ready: ${result.kind}`);
      },
      fail: (failure, diagnostic) => {
        if (!isLive()) return;
        session.state = "failed";
        session.failure = failure;
        this.log(session, "error", diagnostic);
      },
      log: (level, message) => this.log(session, level, message),
    };
  }

  private log(session: Session, level: DiagnosticEntry["level"], message: string) {
    session.diagnostics.push({ at: new Date(this.now()).toISOString(), level, message: message.slice(0, 4000) });
    if (session.diagnostics.length > MAX_DIAGNOSTICS) session.diagnostics.shift();
  }

  /** Read a session; also counts as activity (keeps it alive). */
  get(id: string, { touch = true } = {}): PublicSession | undefined {
    this.sweep();
    const session = this.sessions.get(id);
    if (!session) return undefined;
    if (touch && session.state !== "ended") session.lastSeenAt = this.now();
    return this.toPublic(session);
  }

  diagnostics(id: string): DiagnosticEntry[] | undefined {
    return this.sessions.get(id)?.diagnostics.slice();
  }

  async end(id: string, reason = "ended by user"): Promise<boolean> {
    const session = this.sessions.get(id);
    if (!session) return false;
    if (session.state === "ended") return true;
    session.state = "ended";
    session.endedAt = this.now();
    session.endedReason = reason;
    this.log(session, "info", `session ended: ${reason}`);
    try {
      await session.provider.terminate(session.id);
    } catch (err) {
      this.log(session, "error", `terminate failed: ${(err as Error).message}`);
    }
    return true;
  }

  /** Expire sessions past their lifetime or idle timeout; forget old ones. */
  sweep(): void {
    const now = this.now();
    for (const session of this.sessions.values()) {
      if (session.state === "ended") {
        if (session.endedAt !== undefined && now - session.endedAt > this.retentionMs) this.sessions.delete(session.id);
        continue;
      }
      if (now - session.createdAt >= this.policy.maxLifetimeMs) void this.end(session.id, "reached maximum session length");
      else if (now - session.lastSeenAt >= this.policy.idleTimeoutMs) void this.end(session.id, "inactive for too long");
    }
  }

  activeCount(): number {
    return [...this.sessions.values()].filter((s) => s.state !== "ended").length;
  }

  private toPublic(session: Session): PublicSession {
    const steps = LAUNCH_STEPS.map((step, i) => {
      let status: PublicSession["steps"][number]["status"] = "pending";
      if (session.state === "ready") status = "done";
      else if (i < session.stepIndex) status = "done";
      else if (i === session.stepIndex) status = session.state === "failed" ? "failed" : session.state === "ended" ? "pending" : "active";
      return { id: step.id, label: step.label, status };
    });
    return {
      id: session.id,
      projectSlug: session.project.slug,
      state: session.state,
      simulated: session.provider.simulated,
      providerLabel: session.provider.label,
      steps,
      result: session.result,
      failure: session.failure,
      endedReason: session.endedReason,
      createdAt: new Date(session.createdAt).toISOString(),
      expiresAt: new Date(session.createdAt + this.policy.maxLifetimeMs).toISOString(),
    };
  }
}
