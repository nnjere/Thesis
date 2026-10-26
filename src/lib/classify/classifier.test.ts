import { describe, expect, it } from "vitest";
import type { RepoSignals } from "@/lib/repo/signals";
import { classify } from "./classifier";

const base = (over: Partial<RepoSignals> = {}): RepoSignals => ({
  rootFiles: [],
  rootDirs: [],
  language: null,
  topics: [],
  archived: false,
  devcontainer: false,
  makefileTargets: [],
  hasEnvExample: false,
  hasIndexHtml: false,
  mobile: { flutter: false, android: false, ios: false },
  readme: null,
  releaseAssets: [],
  ...over,
});

const pkg = (deps: string[], scripts: Record<string, string> = {}, extra: Partial<NonNullable<RepoSignals["packageJson"]>> = {}) => ({
  deps,
  scripts,
  hasBin: false,
  hasEntry: false,
  workspaces: false,
  ...extra,
});

describe("classify", () => {
  it("recognises a Vite web app as ready, never verified", () => {
    const c = classify(base({ rootFiles: ["package.json", "index.html"], packageJson: pkg(["vite", "react"], { dev: "vite" }) }));
    expect(c.type).toBe("web-app");
    expect(c.status).toBe("ready");
    expect(c.strategy).toBe("node-dev-server");
  });

  it("treats a Streamlit app as ready", () => {
    const c = classify(base({ rootFiles: ["requirements.txt"], python: { deps: ["streamlit", "pandas"], hasScripts: false } }));
    expect(c).toMatchObject({ type: "web-app", status: "ready", strategy: "python-web-server" });
  });

  it("downgrades web apps needing a database", () => {
    const c = classify(base({ compose: { services: ["web", "postgres", "redis"] }, dockerfile: { exposesPort: true } }));
    expect(c).toMatchObject({ type: "web-app", status: "experimental", strategy: "multi-service" });
  });

  it("downgrades when secrets or heavy ML are needed", () => {
    const c = classify(base({ python: { deps: ["gradio", "torch"], hasScripts: false }, hasEnvExample: true }));
    expect(c.status).toBe("experimental");
    expect(c.caveats.join(" ")).toMatch(/graphics card/);
    expect(c.caveats.join(" ")).toMatch(/API keys/);
  });

  it("recognises command-line tools", () => {
    expect(classify(base({ packageJson: pkg(["commander"], {}, { hasBin: true }) })).type).toBe("cli-tool");
    expect(classify(base({ python: { deps: ["click"], hasScripts: true } })).type).toBe("cli-tool");
    const go = classify(base({ goModule: { module: "x", deps: ["github.com/spf13/cobra"], hasMainAtRoot: false, hasCmdDir: true } }));
    expect(go).toMatchObject({ type: "cli-tool", status: "experimental", strategy: "cli-form-adapter" });
  });

  it("recognises desktop and mobile apps", () => {
    expect(classify(base({ packageJson: pkg(["electron", "react"], { start: "electron ." }) })).type).toBe("desktop-app");
    expect(classify(base({ mobile: { flutter: true, android: true, ios: true } }))).toMatchObject({
      type: "desktop-app",
      status: "not-runnable",
      strategy: "download-release",
    });
  });

  it("recognises libraries", () => {
    const c = classify(
      base({
        packageJson: pkg([], { test: "vitest" }, { hasEntry: true }),
        topics: ["library"],
        readme: { excerpt: null, mentionsLocalhost: false, mentionsDownload: false, libraryInstall: true, cliUsage: false },
      }),
    );
    expect(c).toMatchObject({ type: "library", status: "not-runnable", strategy: "explain-building-block", confidence: "high" });
  });

  it("admits when it cannot tell", () => {
    const c = classify(base({ rootFiles: ["README.md", "data.csv"] }));
    expect(c).toMatchObject({ type: "unknown", confidence: "low", strategy: "manual-review" });
  });
});
