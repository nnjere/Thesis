# Architecture

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4. Domain logic lives in `src/lib`, framework-free and unit-tested. UI is in `src/app` and `src/components`.

```
src/
  app/                      Pages + API routes (thin; delegate to lib)
    api/projects            GET search / detail
    api/analyze             POST {url} → read-only repository analysis
    api/sessions            POST create, GET poll/heartbeat, DELETE end, POST end (beacon)
    api/sessions/[id]/diagnostics   raw logs, only fetched on "Technical details"
    api/tools/[id]/run      run a tool adapter inside a ready session
  components/               UI (cards, badges, launch experience, tool runner)
  lib/
    catalog/      1. Project catalog + search (SearchProvider interface)
    repo/         2. URL validation, read-only GitHub client, signal extraction, analyzer
    classify/     3. Compatibility classification (pure function: signals → type/status/strategy)
    sandbox/      4. SandboxPolicy, SandboxProvider interface, providers
    sessions/     5. Session lifecycle: lifetime, idle timeout, cleanup, diagnostics
    tools/        CLI→form adapters (declared inputs/options only)
    ai/           6. SetupAgent interface (disabled implementation)
    workspace/    Workspace scenarios (settings, presets, diff text) + pure state logic
    presence/     PresenceProvider contract, mock provider, cursor privacy prefs
    safety/       Workflow protection guards shared by all of the above
public/demos/   Self-contained built-in web demos
```

## Module boundaries

**Catalog and search.** `getSearchProvider()` returns `LocalCatalogSearch`. A `GitHubSearchProvider` (public search API, read-only) or an embeddings-based provider can implement the same `SearchProvider` interface. Every result reports which `engine` produced it, so the UI never overstates what search is doing.

**Repository analysis.** `parseGitHubUrl` → `GitHubReadOnlyClient` → `signals.ts` parsers → `classify()`. Every file is treated as untrusted: size-capped, parsed as data (`JSON.parse` or line scans, never `eval`), and URLs are filtered to http(s). README text is reduced to a plain-text excerpt and never rendered as HTML. Signals read: `package.json`, `requirements.txt`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `Dockerfile`, compose files, `.devcontainer`, `Makefile`, `pubspec.yaml`, README, topics and release assets.

**Classification.** Scores four project types, then picks a status and strategy (`static-preview`, `node-dev-server`, `python-web-server`, `single-container`, `multi-service`, `cli-form-adapter`, `download-release`, `explain-building-block`, `manual-review`). It never returns `verified`. Heavy ML dependencies, required secrets (`.env.example`) and multi-service compose files lower the estimate. Low confidence is reported to the user.

**Sandbox providers.** The `SandboxProvider` contract is `supports(project)`, `provision(project, ctx)` (reports progress via `ctx.step/ready/fail/log`) and an idempotent `terminate(sessionId)`. Providers are tried in order:

1. `BuiltInDemoProvider`. Runs real checks: reads and validates the demo file, or runs the adapter's `selfTest()`.
2. `IsolatedContainerProvider`. The integration point for real execution. It currently supports nothing.
3. `SimulatedProvider`. Plays the steps with no execution, and says so in its label, its result and its diagnostics.

**Sessions.** `SessionManager` validates the `SandboxPolicy` when it is constructed. It caps concurrent sessions, ends sessions after the idle timeout (each poll counts as a heartbeat) or the hard lifetime, calls `terminate`, and forgets ended sessions after a retention window. The public view never includes diagnostics. Sessions are held in memory on `globalThis`; in production this would move to Redis or a database.

**AI setup agent.** `SetupAgent` exposes `proposeSetup`, `explainFailure` and `proposeInterface`. An agent may only act through `AgentSandboxTools` (`readFile`, `listFiles`, `exec` inside one sandbox). Its proposals are checked by `assertCommandRespectsWorkflows` and by the sandbox policy before anything runs. README and issue text is untrusted and may contain prompt injection.

## UI structure

- Tokens live once in `src/app/globals.css` (`@theme`); components use token classes (`bg-surface`, `text-muted`, `bg-cat-images-bg`...), not raw hex.
- Routes: `app/(site)` pages share the site header and footer; `app/(focus)` holds the project page and workspace, which draw their own headers.
- The workspace shell (`components/workspace/Workspace.tsx`) is generic. A new scenario adds a file under `lib/workspace/` (settings, groups, presets, diff text) and registers a preview component in `PREVIEWS`. The project's catalog entry points at it with `workspace: "<scenario id>"`.
- Presence: `PresenceRoot` owns a `PresenceProvider` and the cursor preferences. To go live, implement the provider over a real transport (WebSocket, Liveblocks, Yjs awareness) and select it in `PresenceRoot`. The contract requires that nothing is sent while sharing is off.

## Path to real execution

1. Implement `IsolatedContainerProvider` on a microVM or container service (for example Firecracker, gVisor or a hosted sandbox API) that can enforce `SandboxPolicy`: a network egress allowlist, CPU, memory and disk limits, no privilege escalation and no host mounts.
2. The orchestrator, not the sandbox, downloads the archive (`/repos/{o}/{r}/tarball`, already on the allowlist), strips `.git`, and uploads it to the sandbox.
3. Map `ExecutionStrategy` to start recipes (for example `node-dev-server` → `npm ci && npm run dev -- --host 0.0.0.0`). Run every command through `assertCommandRespectsWorkflows`.
4. Serve the preview through the provider's proxy on a separate origin, embedded in an `<iframe sandbox>`.
5. Promote a project to **Verified** only after a recorded, repeatable successful run.
6. Before launch: add authentication on diagnostics, a shared session store and per-user quotas, and get an external security review of the provider.
