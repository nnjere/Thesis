import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Project } from "@/lib/catalog/types";
import { getToolAdapter } from "@/lib/tools";
import type { ProvisionContext, SandboxProvider } from "./types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Runs the demo projects bundled with this app. The checks are real: the
 * demo's files are read from disk and validated, and tool adapters run their
 * self-test. Web demos are shown in an iframe with `sandbox="allow-scripts"`
 * (an opaque origin with no access to this app's cookies or storage) and a
 * restrictive Content-Security-Policy (see next.config.ts).
 *
 * Short pauses between steps are only there so people can read them.
 */
export class BuiltInDemoProvider implements SandboxProvider {
  readonly id = "built-in";
  readonly label = "Built-in demo (runs in your browser)";
  readonly simulated = false;

  supports(project: Project): boolean {
    return project.source === "built-in-demo" && (project.launch.kind === "embedded-web-app" || project.launch.kind === "tool-form");
  }

  async provision(project: Project, ctx: ProvisionContext): Promise<void> {
    const launch = project.launch;
    ctx.step(0);
    ctx.log("info", `built-in provider: launch kind ${launch.kind}`);
    await sleep(400);
    if (ctx.cancelled) return;

    if (launch.kind === "embedded-web-app") {
      if (!/^\/demos\/[a-z0-9-]+\/index\.html$/.test(launch.entry)) {
        return ctx.fail(
          { headline: "This demo couldn't be opened", explanation: "Its files are in an unexpected place, so we stopped for safety." },
          `entry path rejected: ${launch.entry}`,
        );
      }
      let html: string;
      try {
        html = await readFile(path.join(process.cwd(), "public", launch.entry), "utf8");
      } catch (err) {
        return ctx.fail(
          { headline: "This demo's files are missing", explanation: "We couldn't find the files needed to start it. Please try another project." },
          `readFile failed: ${(err as Error).message}`,
        );
      }
      ctx.log("info", `read ${launch.entry} (${html.length} bytes)`);

      ctx.step(1);
      ctx.log("info", "iframe sandbox: allow-scripts allow-downloads (no allow-same-origin); CSP default-src 'none'");
      await sleep(400);
      if (ctx.cancelled) return;

      ctx.step(2);
      const looksValid = /<html[\s>]/i.test(html) && /<script[\s>]/i.test(html);
      if (!looksValid) {
        return ctx.fail(
          { headline: "This demo didn't pass its health check", explanation: "Something about it doesn't look right, so we didn't open it." },
          "health check failed: entry is not an HTML document with a script",
        );
      }
      ctx.log("info", "health check passed");
      await sleep(350);

      ctx.step(3);
      await sleep(250);
      return ctx.ready({ kind: "embedded-web-app", url: launch.entry });
    }

    if (launch.kind === "tool-form") {
      const adapter = getToolAdapter(launch.adapterId);
      if (!adapter) {
        return ctx.fail(
          { headline: "This tool isn't available right now", explanation: "Its simple form hasn't been set up on this server." },
          `adapter not registered: ${launch.adapterId}`,
        );
      }
      ctx.step(1);
      ctx.log("info", `adapter ${adapter.spec.id}: ${adapter.spec.options.length} options exposed`);
      await sleep(400);
      if (ctx.cancelled) return;

      ctx.step(2);
      let ok = false;
      try {
        ok = adapter.selfTest();
      } catch (err) {
        ctx.log("error", `selfTest threw: ${(err as Error).stack ?? err}`);
      }
      if (!ok) {
        return ctx.fail(
          { headline: "This tool didn't pass its health check", explanation: "We tested it with sample text and it didn't behave as expected, so we didn't open it." },
          "adapter selfTest returned false",
        );
      }
      ctx.log("info", "adapter self-test passed");
      await sleep(350);

      ctx.step(3);
      await sleep(250);
      return ctx.ready({ kind: "tool-form", adapterId: adapter.spec.id });
    }

    ctx.fail({ headline: "This project can't be started here", explanation: "It isn't a type of project this demo runner supports." }, `unsupported launch kind`);
  }

  async terminate(): Promise<void> {
    // Nothing runs on the server for built-in demos.
  }
}

/**
 * Stands in for real sandbox infrastructure, which isn't configured in this
 * prototype. NOTHING is downloaded or executed: it plays the launch steps
 * and finishes with an explicit "this was a simulation" result, or with the
 * friendly failure scripted in the catalog.
 */
export class SimulatedProvider implements SandboxProvider {
  readonly id = "simulated";
  readonly label = "Simulation: no real sandbox is connected";
  readonly simulated = true;

  constructor(private readonly stepMs = 1100) {}

  supports(project: Project): boolean {
    return project.launch.kind === "simulated";
  }

  async provision(project: Project, ctx: ProvisionContext): Promise<void> {
    if (project.launch.kind !== "simulated") return;
    const { failure, wouldShow } = project.launch;
    ctx.log("warn", "SIMULATION: no sandbox provider configured; no repository code is fetched or executed");
    ctx.log("info", `policy: network ${ctx.policy.network.mode}, ${ctx.policy.resources.cpus} cpu, ${ctx.policy.resources.memoryMb} MB, lifetime ${ctx.policy.maxLifetimeMs / 60000} min`);
    ctx.log("info", `snapshot: ${ctx.policy.snapshot.method}, git dir excluded, no remote configured`);

    for (let i = 0; i < 4; i++) {
      ctx.step(i);
      await sleep(this.stepMs);
      if (ctx.cancelled) return;
      if (failure && failure.atStep === i) {
        return ctx.fail({ headline: failure.headline, explanation: failure.explanation }, failure.diagnostic);
      }
    }
    ctx.ready({ kind: "simulated-complete", wouldShow, hostedAlternative: project.homepage });
  }

  async terminate(): Promise<void> {
    // Nothing to release: nothing was started.
  }
}

/**
 * The integration boundary for real isolated execution (for example a
 * microVM or container service). Deliberately not implemented: it refuses
 * every project until a provider is built, configured and tested against
 * the SandboxPolicy. See docs/ARCHITECTURE.md for the expected contract.
 */
export class IsolatedContainerProvider implements SandboxProvider {
  readonly id = "isolated-container";
  readonly label = "Isolated container sandbox";
  readonly simulated = false;

  supports(): boolean {
    return false;
  }

  async provision(_project: Project, ctx: ProvisionContext): Promise<void> {
    ctx.fail(
      { headline: "Real sandboxes aren't switched on yet", explanation: "This prototype can't run projects from GitHub yet." },
      "IsolatedContainerProvider is not implemented",
    );
  }

  async terminate(): Promise<void> {}
}
