import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getProject } from "@/lib/catalog";
import { BuiltInDemoProvider, SimulatedProvider } from "@/lib/sandbox/providers";
import type { SandboxProvider } from "@/lib/sandbox/types";
import { NoProviderError, SessionCapacityError, SessionManager } from "./manager";

const flow = getProject("flow-fields")!;
const readable = getProject("readable")!;
const excalidraw = getProject("excalidraw")!;
const whisper = getProject("whisper")!;
const zotero = getProject("zotero")!;

async function waitFor(fn: () => boolean, ms = 4000) {
  const start = Date.now();
  while (!fn()) {
    if (Date.now() - start > ms) throw new Error("timed out");
    await new Promise((r) => setTimeout(r, 20));
  }
}

describe("SessionManager with real providers", () => {
  const manager = new SessionManager({ providers: [new BuiltInDemoProvider(), new SimulatedProvider(10)] });

  it("launches a built-in web demo for real", async () => {
    const s = manager.create(flow);
    expect(s.state).toBe("preparing");
    expect(s.simulated).toBe(false);
    await waitFor(() => manager.get(s.id)!.state !== "preparing");
    const done = manager.get(s.id)!;
    expect(done.state).toBe("ready");
    expect(done.result).toEqual({ kind: "embedded-web-app", url: "/demos/flow-fields/index.html" });
    expect(done.steps.every((st) => st.status === "done")).toBe(true);
  });

  it("launches a tool adapter after its self-test", async () => {
    const s = manager.create(readable);
    await waitFor(() => manager.get(s.id)!.state !== "preparing");
    expect(manager.get(s.id)!.result).toEqual({ kind: "tool-form", adapterId: "readability" });
    expect(manager.diagnostics(s.id)!.some((d) => d.message.includes("self-test passed"))).toBe(true);
  });

  it("labels simulations and never reports them as a running app", async () => {
    const s = manager.create(excalidraw);
    expect(s.simulated).toBe(true);
    await waitFor(() => manager.get(s.id)!.state !== "preparing");
    const done = manager.get(s.id)!;
    expect(done.result?.kind).toBe("simulated-complete");
    expect(manager.diagnostics(s.id)!.some((d) => d.message.startsWith("SIMULATION"))).toBe(true);
  });

  it("fails friendly and keeps technical detail out of the public view", async () => {
    const s = manager.create(whisper);
    await waitFor(() => manager.get(s.id)!.state !== "preparing");
    const done = manager.get(s.id)!;
    expect(done.state).toBe("failed");
    expect(done.failure?.headline).toMatch(/computing power/);
    expect(done.steps[2].status).toBe("failed");
    expect(JSON.stringify(done)).not.toMatch(/CUDA/);
    expect(manager.diagnostics(s.id)!.some((d) => d.message.includes("CUDA"))).toBe(true);
  });

  it("refuses projects no provider supports", () => {
    expect(() => manager.create(zotero)).toThrow(NoProviderError);
  });
});

describe("SessionManager lifecycle", () => {
  let now = 1_000_000;
  const terminate = vi.fn(async () => {});
  const stuck: SandboxProvider = {
    id: "stuck",
    label: "test",
    simulated: true,
    supports: () => true,
    provision: async (_p, ctx) => ctx.step(1),
    terminate,
  };
  const make = (opts: Partial<ConstructorParameters<typeof SessionManager>[0]> = {}) =>
    new SessionManager({ providers: [stuck], now: () => now, retentionMs: 1000, ...opts });

  beforeEach(() => {
    now = 1_000_000;
    terminate.mockClear();
  });
  afterEach(() => vi.useRealTimers());

  it("ends idle sessions and terminates their sandbox", async () => {
    const m = make();
    const s = m.create(excalidraw);
    now += 9 * 60_000;
    expect(m.get(s.id)!.state).toBe("preparing"); // touch keeps it alive
    now += 9 * 60_000;
    expect(m.get(s.id)!.state).toBe("preparing");
    now += 10 * 60_000 + 1;
    expect(m.get(s.id, { touch: false })!.state).toBe("ended");
    expect(m.get(s.id)!.endedReason).toBe("inactive for too long");
    expect(terminate).toHaveBeenCalledWith(s.id);
  });

  it("enforces a maximum lifetime even with heartbeats", () => {
    const m = make();
    const s = m.create(excalidraw);
    for (let i = 0; i < 6; i++) {
      now += 5 * 60_000;
      m.get(s.id);
    }
    expect(m.get(s.id)!.state).toBe("ended");
    expect(m.get(s.id)!.endedReason).toBe("reached maximum session length");
  });

  it("forgets ended sessions after the retention period", async () => {
    const m = make();
    const s = m.create(excalidraw);
    await m.end(s.id);
    expect(m.get(s.id)!.state).toBe("ended");
    now += 2000;
    expect(m.get(s.id)).toBeUndefined();
  });

  it("caps concurrent sessions", () => {
    const m = make({ maxActiveSessions: 2 });
    m.create(excalidraw);
    m.create(excalidraw);
    expect(() => m.create(excalidraw)).toThrow(SessionCapacityError);
  });

  it("catches provider crashes with a friendly message", async () => {
    const crashing: SandboxProvider = { ...stuck, provision: async () => { throw new Error("segfault at 0xdead"); } };
    const m = new SessionManager({ providers: [crashing] });
    const s = m.create(excalidraw);
    await waitFor(() => m.get(s.id)!.state === "failed");
    expect(m.get(s.id)!.failure!.headline).not.toMatch(/segfault/);
    expect(m.diagnostics(s.id)!.some((d) => d.message.includes("segfault"))).toBe(true);
  });
});
