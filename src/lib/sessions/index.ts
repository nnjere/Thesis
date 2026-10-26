import { BuiltInDemoProvider, IsolatedContainerProvider, SimulatedProvider } from "@/lib/sandbox/providers";
import { SessionManager } from "./manager";

/**
 * Process-wide session manager. Kept on globalThis so it survives hot
 * reloads in development. In production this would move to a shared store
 * (e.g. Redis) so several server instances can see the same sessions.
 */
const globalForSessions = globalThis as unknown as { __openlySessions?: SessionManager; __openlySweep?: NodeJS.Timeout };

function createManager(): SessionManager {
  const requested = process.env.SANDBOX_PROVIDER ?? "simulated";
  if (requested !== "simulated") {
    console.warn(`[sessions] SANDBOX_PROVIDER="${requested}" is not implemented; falling back to simulation for GitHub projects.`);
  }
  return new SessionManager({
    // Order matters: the first provider that supports a project is used.
    providers: [new BuiltInDemoProvider(), new IsolatedContainerProvider(), new SimulatedProvider()],
  });
}

export function getSessionManager(): SessionManager {
  if (!globalForSessions.__openlySessions) {
    globalForSessions.__openlySessions = createManager();
    const timer = setInterval(() => globalForSessions.__openlySessions?.sweep(), 60_000);
    timer.unref?.();
    globalForSessions.__openlySweep = timer;
  }
  return globalForSessions.__openlySessions;
}

export { NoProviderError, SessionCapacityError } from "./manager";
