import type { ProjectType, RunStatus } from "@/lib/catalog/types";
import type { RepoSignals } from "@/lib/repo/signals";

/**
 * Compatibility classification: a pure function from repository signals to
 * a project type, an honest status estimate and an execution strategy.
 *
 * It never returns "verified": that status is reserved for projects that
 * have actually been run and tested in a sandbox.
 */

export type ExecutionStrategy =
  | "static-preview"
  | "node-dev-server"
  | "python-web-server"
  | "single-container"
  | "multi-service"
  | "cli-form-adapter"
  | "download-release"
  | "explain-building-block"
  | "manual-review";

export type Confidence = "high" | "medium" | "low";

export interface Classification {
  type: ProjectType | "unknown";
  status: Exclude<RunStatus, "verified">;
  confidence: Confidence;
  strategy: ExecutionStrategy;
  /** Plain-English explanation for non-technical users. */
  summary: string;
  reasons: string[];
  caveats: string[];
  /** Technical evidence, for the "technical details" view only. */
  evidence: string[];
  scores: Record<ProjectType, number>;
}

const NODE_WEB_FRAMEWORKS = [
  "next", "react-scripts", "vite", "@sveltejs/kit", "nuxt", "astro", "gatsby", "@remix-run/react",
  "@angular/core", "vue", "svelte", "parcel", "webpack-dev-server", "@docusaurus/core", "vitepress",
];
const PY_WEB = ["flask", "django", "fastapi", "streamlit", "gradio", "dash", "panel", "nicegui"];
const PY_EASY_UI = ["streamlit", "gradio"];
const NODE_CLI = ["commander", "yargs", "meow", "oclif", "@oclif/core", "cac", "clipanion"];
const PY_CLI = ["click", "typer", "fire", "docopt"];
const RUST_CLI = ["clap", "structopt", "argh"];
const GO_CLI = ["github.com/spf13/cobra", "github.com/urfave/cli", "github.com/urfave/cli/v2"];
const DESKTOP_DEPS = ["electron", "@tauri-apps/api", "@tauri-apps/cli", "electron-builder", "nw", "@neutralinojs/lib"];
const HEAVY_ML = ["torch", "tensorflow", "jax", "jaxlib", "onnxruntime-gpu", "tensorflow-gpu", "xformers", "bitsandbytes"];
const DATABASES = ["postgres", "postgresql", "mysql", "mariadb", "mongo", "mongodb", "redis", "valkey", "elasticsearch", "rabbitmq", "kafka", "clickhouse"];

const DESKTOP_TOPICS = ["desktop", "desktop-app", "electron", "tauri", "macos", "windows", "linux-app", "gui"];
const MOBILE_TOPICS = ["android", "ios", "flutter", "react-native", "mobile", "mobile-app"];
const LIBRARY_TOPICS = ["library", "sdk", "framework", "package", "npm-package", "python-library", "api-client", "toolkit"];
const CLI_TOPICS = ["cli", "command-line", "terminal", "command-line-tool", "cli-app", "tui"];
const WEB_TOPICS = ["web-app", "webapp", "self-hosted", "website", "pwa", "web-application"];

const has = (list: string[] | undefined, candidates: string[]) => (list ?? []).some((x) => candidates.includes(x.toLowerCase()));

export function classify(signals: RepoSignals): Classification {
  const scores: Record<ProjectType, number> = { "web-app": 0, "cli-tool": 0, "desktop-app": 0, library: 0 };
  const evidence: string[] = [];
  const add = (type: ProjectType, points: number, why: string) => {
    scores[type] += points;
    evidence.push(`${type} +${points}: ${why}`);
  };

  const pkg = signals.packageJson;
  const pyDeps = signals.python?.deps ?? [];
  const topics = signals.topics.map((t) => t.toLowerCase());
  const assets = signals.releaseAssets.map((a) => a.toLowerCase());

  // Web applications
  const nodeWeb = pkg ? pkg.deps.filter((d) => NODE_WEB_FRAMEWORKS.includes(d)) : [];
  if (nodeWeb.length) add("web-app", 3, `package.json depends on ${nodeWeb.join(", ")}`);
  const hasRunScript = Boolean(pkg && (pkg.scripts.dev || pkg.scripts.start || pkg.scripts.serve || pkg.scripts.preview));
  if (pkg && hasRunScript && nodeWeb.length) add("web-app", 1, "package.json has a dev/start script");
  const pyWeb = pyDeps.filter((d) => PY_WEB.includes(d));
  if (pyWeb.length) add("web-app", 3, `Python dependencies include ${pyWeb.join(", ")}`);
  if (signals.hasIndexHtml) add("web-app", 2, "index.html at repository root");
  if (signals.dockerfile?.exposesPort) add("web-app", 2, "Dockerfile EXPOSEs a port");
  if (signals.compose?.services.length) add("web-app", 2, `compose file with services: ${signals.compose.services.join(", ")}`);
  if (signals.readme?.mentionsLocalhost) add("web-app", 1, "README mentions a localhost URL");
  if (has(topics, WEB_TOPICS)) add("web-app", 2, "repository topics suggest a web app");

  // Command-line tools
  if (pkg?.hasBin) add("cli-tool", 3, "package.json declares a bin");
  if (pkg && has(pkg.deps, NODE_CLI)) add("cli-tool", 2, "depends on a Node CLI framework");
  if (signals.python?.hasScripts) add("cli-tool", 3, "pyproject declares console scripts");
  if (has(pyDeps, PY_CLI)) add("cli-tool", 2, "depends on a Python CLI framework");
  if (signals.cargo?.hasBin || (signals.cargo && !signals.cargo.hasLib && signals.rootDirs.includes("src")))
    add("cli-tool", 2, "Cargo project builds a binary");
  if (signals.cargo && has(signals.cargo.deps, RUST_CLI)) add("cli-tool", 2, "depends on a Rust CLI framework");
  if (signals.goModule?.hasCmdDir || signals.goModule?.hasMainAtRoot) add("cli-tool", 2, "Go module has a main package");
  if (signals.goModule && has(signals.goModule.deps, GO_CLI)) add("cli-tool", 2, "depends on a Go CLI framework");
  if (has(topics, CLI_TOPICS)) add("cli-tool", 3, "repository topics suggest a command-line tool");
  if (signals.readme?.cliUsage) add("cli-tool", 1, "README shows command-line usage");

  // Desktop and mobile applications
  const desktopDeps = pkg ? pkg.deps.filter((d) => DESKTOP_DEPS.includes(d)) : [];
  if (desktopDeps.length) add("desktop-app", 4, `depends on ${desktopDeps.join(", ")}`);
  if (signals.rootDirs.includes("src-tauri")) add("desktop-app", 4, "has a src-tauri directory");
  if (signals.mobile.flutter) add("desktop-app", 4, "Flutter project (pubspec.yaml)");
  if (signals.mobile.android) add("desktop-app", 3, "Android project files");
  if (signals.mobile.ios) add("desktop-app", 3, "Xcode project files");
  if (assets.some((a) => /\.(dmg|exe|msi|appimage|deb|rpm|apk|ipa|pkg)$/.test(a)))
    add("desktop-app", 3, "latest release ships installers");
  if (has(topics, DESKTOP_TOPICS) || has(topics, MOBILE_TOPICS)) add("desktop-app", 3, "repository topics suggest a desktop or mobile app");
  if (["swift", "kotlin", "dart", "objective-c", "c#"].includes((signals.language ?? "").toLowerCase()))
    add("desktop-app", 1, `primary language is ${signals.language}`);

  // Libraries and frameworks
  if (pkg?.hasEntry && !pkg.hasBin && !nodeWeb.length && !desktopDeps.length && !hasRunScript)
    add("library", 3, "package.json exports a module with no app scripts");
  if (signals.cargo?.hasLib && !signals.cargo.hasBin) add("library", 3, "Cargo project is a library crate");
  if (signals.python && !signals.python.hasScripts && !pyWeb.length && signals.rootFiles.includes("pyproject.toml"))
    add("library", 1, "Python package without console scripts or a web framework");
  if (signals.goModule && !signals.goModule.hasCmdDir && !signals.goModule.hasMainAtRoot) add("library", 2, "Go module with no main package");
  if (signals.readme?.libraryInstall) add("library", 2, "README shows install-and-import usage");
  if (has(topics, LIBRARY_TOPICS)) add("library", 3, "repository topics suggest a library");

  const ranked = (Object.entries(scores) as [ProjectType, number][]).sort((a, b) => b[1] - a[1]);
  const [topType, topScore] = ranked[0];
  const secondScore = ranked[1][1];

  if (topScore === 0) {
    return {
      type: "unknown",
      status: "not-runnable",
      confidence: "low",
      strategy: "manual-review",
      summary: "We couldn't work out what kind of project this is from its files.",
      reasons: ["None of the usual setup files we look for gave a clear answer."],
      caveats: ["It may be documentation, a dataset, or a project in a language we don't recognise yet."],
      evidence: evidence.length ? evidence : ["no recognised signals"],
      scores,
    };
  }

  const margin = topScore - secondScore;
  const confidence: Confidence = topScore >= 5 && margin >= 3 ? "high" : margin >= 2 ? "medium" : "low";
  const caveats: string[] = [];
  const reasons: string[] = [];

  const heavyMl = pyDeps.filter((d) => HEAVY_ML.includes(d));
  if (heavyMl.length) caveats.push("It uses large AI libraries and may need a powerful computer or a graphics card.");
  if (signals.hasEnvExample) caveats.push("It expects settings such as passwords or API keys to be provided before it starts.");
  if (signals.archived) caveats.push("The creators have archived this project, so it is no longer being updated.");

  let status: Classification["status"];
  let strategy: ExecutionStrategy;
  let summary: string;

  switch (topType) {
    case "web-app": {
      summary = "This looks like a web app: something you use in a browser. That's the best kind of project for trying online.";
      const services = signals.compose?.services ?? [];
      const needsDb = services.some((s) => DATABASES.some((db) => s.toLowerCase().includes(db)));
      if (services.length > 1 || needsDb) {
        strategy = "multi-service";
        status = "experimental";
        reasons.push("It needs several services (such as a database) running together, which is harder to set up automatically.");
      } else if (pyWeb.some((d) => PY_EASY_UI.includes(d))) {
        strategy = "python-web-server";
        status = "ready";
        reasons.push("It's built with a toolkit designed for simple, shareable web interfaces.");
      } else if (nodeWeb.length && hasRunScript) {
        strategy = "node-dev-server";
        status = "ready";
        reasons.push("It uses a common web toolkit with a standard way to start it.");
      } else if (signals.hasIndexHtml && !pkg) {
        strategy = "static-preview";
        status = "ready";
        reasons.push("It's a set of web pages that can be shown directly.");
      } else if (signals.dockerfile) {
        strategy = "single-container";
        status = "experimental";
        reasons.push("It comes with container instructions, which we may be able to use to start it.");
      } else if (pyWeb.length) {
        strategy = "python-web-server";
        status = "experimental";
        reasons.push("It's a Python web app; starting it may need extra configuration.");
      } else {
        strategy = "node-dev-server";
        status = "experimental";
        reasons.push("It looks like a web app, but we couldn't find a standard way to start it.");
      }
      break;
    }
    case "cli-tool":
      summary = "This looks like a command-line tool: a program normally used by typing commands. We'd need to build a simple form for it.";
      strategy = "cli-form-adapter";
      status = "experimental";
      reasons.push("Command-line tools don't have a screen of their own, so each one needs a custom, safe form before it can be tried here.");
      break;
    case "desktop-app":
      summary = "This looks like an app you install on a computer or phone. It can't run inside a browser sandbox.";
      strategy = "download-release";
      status = "not-runnable";
      reasons.push("Desktop and mobile apps need to be installed on your own device.");
      break;
    case "library":
      summary = "This looks like a library: a building block that developers use inside other projects, rather than an app you open.";
      strategy = "explain-building-block";
      status = "not-runnable";
      reasons.push("Libraries don't do anything on their own until someone builds an app with them.");
      break;
  }

  if (status === "ready" && (heavyMl.length || signals.hasEnvExample)) {
    status = "experimental";
    reasons.push("Because of the requirements below, setting it up automatically may not work.");
  }
  if (confidence === "low") caveats.push("We're not very sure about this. The project shows signs of more than one type.");

  return { type: topType, status, confidence, strategy, summary, reasons, caveats, evidence, scores };
}
