# Sandbox: try open source without installing anything

A working prototype that helps people with little or no coding experience **discover, understand, try and remix** open-source projects without touching GitHub, a terminal or an installer.

> Gallery → Project page → Workspace

![Gallery](docs/screenshots/gallery.png)

The visual design follows the brief in [docs/design/UI_BRIEF.md](docs/design/UI_BRIEF.md) (reference screens alongside it).

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # 120 unit tests
npm run typecheck
npm run build && npm start
```

Requires Node 20 or newer. No accounts, API keys or databases are needed. `GITHUB_TOKEN` is optional (see `.env.example`).

## What's real and what isn't

The product's core principle is to hide unnecessary technical complexity without hiding a project's limitations. The prototype follows the same rule about itself:

| Feature | Status |
| --- | --- |
| Browse, search and read project pages | **Real.** Local catalog of 22 projects |
| Natural-language search | **Real keyword search** (stop words, stemming, synonyms). Not AI, and the UI says so |
| Built-in demos: Flow Fields, Palette Pick, Quick Chart (web apps) | **Really run** in a sandboxed iframe (`allow-scripts`, opaque origin, strict CSP) |
| Built-in demos: Readable, Markdown to Document (command-line tools turned into forms) | **Really run** through server-side tool adapters |
| "Check a GitHub link" analysis | **Real, read-only.** Reads public metadata and config files, then classifies the project. Nothing is executed |
| "Open in sandbox" for GitHub sample listings | **Simulated** and labelled as such everywhere. No real sandbox is connected |
| Workspace (Bluesky app, "Profiles, but more like Mastodon") | **Real interactions on a pretend profile** drawn by Sandbox, not the real app. "Share suggestion" only marks the draft as shared; nothing is sent |
| Live cursors and "people looking at this page" | **Demo presence feed** (`MockPresenceProvider`), marked "demo" in the UI. The privacy controls are real: with "Show my cursor" off, pointer updates are never handed to the transport |
| AI-assisted setup | **Interface only.** No model is connected, and the UI says so |

Only built-in demos can carry the **Verified** status. A test enforces this rule.

## Screens

| | |
| --- | --- |
| ![Project page](docs/screenshots/project-page.png) | ![Cursor privacy popover](docs/screenshots/cursor-privacy.png) |
| ![Workspace canvas](docs/screenshots/workspace.png) | ![Workspace changes](docs/screenshots/workspace-changes.png) |
| ![Built-in demo running](docs/screenshots/built-in-demo.png) | ![Command-line tool as a form](docs/screenshots/tool-form.png) |
| ![Friendly failure](docs/screenshots/friendly-failure.png) | ![Gallery on a phone](docs/screenshots/gallery-mobile.png) |

## Protecting the projects we host

These rules are enforced in code (`src/lib/safety/workflow-protection.ts`) and covered by tests:

- The GitHub client can only send `GET`/`HEAD` requests, and only to a fixed list of public read-only endpoints. Requests to endpoints such as pulls, issues, forks, refs, hooks or workflow dispatches are refused before any network call is made.
- Sandboxes receive a **detached archive snapshot**: no `.git` directory and no remote, so there is nothing to push to. The `.github/` directory is ignored by the executor, so a project's Actions are never triggered.
- Commands from a sandbox or a future AI agent are screened. `git push`, `git remote add/set-url`, `git credential`, the `gh` CLI and write requests to `api.github.com` are all blocked.
- The sandbox policy is deny-by-default: no credentials, no host mounts, capped resources, a 10-minute idle timeout and a 30-minute lifetime. It cannot be configured to reach GitHub.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the module layout and the path to production.
