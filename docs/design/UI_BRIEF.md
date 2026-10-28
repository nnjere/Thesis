# Sandbox — UI update brief

**For:** a Claude Code agent working in the Sandbox GitHub repo
**Goal:** update the app's visuals and key interactions to match the approved design below. Keep the existing data, logic and backend.
**Reference markup:** `reference/` (three screens, explained at the end)

---

## 0. How to work through this brief

1. **Read the repo before changing anything.** Work out the framework, styling approach (Tailwind, CSS Modules, styled-components, plain CSS…), routing, existing components, any realtime/presence layer, and how tests, lint and the build run. Summarise what you find in a short plan, then start.
2. **Fit the design into the existing stack.** Don't add a new UI framework or styling system. Map the tokens in §2 onto whatever the repo uses: a Tailwind theme extension, CSS custom properties, or a theme object.
3. **Work one screen at a time, in this order:** tokens → shared components → Gallery → Project page → Workspace → live-cursor privacy. Make one focused commit per step.
4. **Keep behaviour that already exists.** If the repo has a feature this brief doesn't mention, restyle it to match the design rather than deleting it.
5. **Don't invent data.** Where the design needs a value the repo doesn't have (counts, dates, remix authors), render a clear placeholder such as `[EXAMPLE]` or an empty state, and list it in your PR description.
6. **Check your work:** run lint, type-check, tests and the build. If a dev server and a browser are available, view each screen at 1440 px and 390 px wide.
7. **Finish with a PR description** that covers what changed per screen, the placeholders left, and anything you couldn't map.

---

## 1. Product concept

Sandbox lets people who aren't developers try open-source and independent projects in the browser without installing anything. They can test features, remix projects, and suggest changes back to the maintainers.

**Design direction:** halfway between Notion and GitHub.
- **From Notion:** a calm, warm, paper-like background, plain language, soft tag colours, and simple property tables.
- **From GitHub:** monospace for repo names, code and file names, a clear primary green action, diff views, and an editor-like workspace.
- **Code is optional, never required.** Every technical concept gets a plain-English label first, with the technical name shown small next to it (e.g. "Recipe" with `recipe.py` underneath).

**User flow:** Gallery → Project landing page → Workspace (exploration canvas).

---

## 2. Design tokens

### Colour

| Token | Hex | Use |
|---|---|---|
| `bg` | `#FBFBFA` | Page background (warm paper) |
| `surface` | `#FFFFFF` | Cards, panels, header |
| `surface-sunken` | `#F5F4F0` | Canvas background, quiet panels |
| `hover` | `#F0EFEB` | Row and button hover, segmented-control track |
| `border` | `#E4E2DD` | Default borders and dividers |
| `border-strong` | `#D0CDC6` | Inputs, secondary buttons, nodes |
| `divider-soft` | `#EFEDE8` | Inner dividers |
| `ink` | `#1F2328` | Primary text, dark buttons |
| `ink-2` | `#424A53` | Secondary body text |
| `muted` | `#59636E` | Captions and meta (passes 4.5:1 on `bg`) |
| `line-number` | `#6E7781` | Code gutters |
| `connector` | `#A8A49B` | Lines between canvas nodes |
| `brand` | `#E47777` | Logo tile only (coral) |
| `primary` | `#1A7F37` | Primary actions, focus/selection rings, success |
| `primary-ink` | `#1E5E37` | Text on green tints |
| `primary-tint` | `#E6F1EA` | Selected rows, active file |
| `warning-dot` | `#BF8700` | "Ready / draft" status dot |
| `note-bg` / `note-ink` | `#FFF4CF` / `#5A4710` | Drafts, content warnings, sticky notes |
| `diff-del-bg` / `diff-del-ink` | `#FDECEA` / `#A4161A` | Removed lines |
| `diff-add-bg` / `diff-add-ink` | `#E6F4EA` / `#1E5E37` | Added lines |

**Category tags** (Notion-style tint plus dark ink; all pass 4.5:1):

| Category | Tint | Ink |
|---|---|---|
| Images | `#E6F1EA` | `#1E5E37` |
| Audio | `#F1EAFA` | `#5B2E86` |
| Documents | `#E7EEFA` | `#1D4E9E` |
| Creative | `#FBE8EE` | `#912546` |
| Data | `#FBEEE1` | `#87460F` |
| Social | `#E3EEFD` | `#0B4FA3` |
| "Like Mastodon" idea tag | `#EDE9FE` | `#5B21B6` |

**Presence colours.** Cursor and avatar colours, each with white text on top:
`#C2410C` (orange), `#6D28D9` (purple), `#0E7490` (teal), `#BE185D` (pink), `#1F2328` (you).

### Typography
- **Sans:** Geist (Google Fonts), weights 400 / 500 / 600 / 650 / 700. Fall back to `system-ui, sans-serif`.
- **Mono:** Geist Mono, weights 400 / 500. Use it for repo names, file names, code, handles, counters and the **page H1s** (the brand choice: Gallery and Project-page headlines are set in Geist Mono at weight 500).
- **Scale:**
  - H1: `clamp(32px, 5vw, 48px)` on the Gallery, `clamp(40px, 6vw, 60px)` on the Project page; letter-spacing −0.025 to −0.03em.
  - H2: 20–22 px, weight 650.
  - Body: 15–17 px, line-height 1.5–1.65.
  - UI labels: 13–14 px.
  - Captions: 12 px.
  - Nothing smaller than 11 px.

### Shape and space
- **Radii:** 6 (small controls), 8 (buttons and inputs), 10–12 (cards and nodes), 14–16 (large panels), 999 (pills). Phone mockup: 32–36 px with an 8 px `ink` bezel.
- **Spacing:** a 4 px base. Common gaps are 4, 8, 12, 16, 20, 24, 32, 48 and 56.
- **Content width:** pages max out at 1120 px with 24 px side padding. The workspace is full-bleed.
- **Shadows:** cards on hover `0 6px 20px rgba(31,35,40,.07)`; floating panels `0 8px 24px rgba(31,35,40,.08)`; popovers `0 12px 32px rgba(31,35,40,.14)`. Selected node: `2px solid primary` plus `0 0 0 4px rgba(26,127,55,.12)`.
- **Background texture:** the canvas uses a dot grid, `radial-gradient(#D9D6CF 1px, transparent 1px)` at 20 px × 20 px on `surface-sunken`.
- **Don't use** gradient washes, coloured left-border cards, emoji as icons, or fake status bars.

### Icons
Inline stroke icons, 1.8–2 px stroke, round caps, `currentColor` (Lucide-style). If the repo already has an icon set, use it.

---

## 3. Shared components

Build these once (or restyle existing equivalents) before working on the screens.

| Component | Spec |
|---|---|
| **Button / primary** | `primary` background, white 14–15 px/600 text, 40–48 px tall, radius 8–10, optional leading icon. |
| **Button / secondary** | White background, `border-strong` border, `ink` 500 text, same sizes as primary. |
| **Filter pill** | 36 px tall, radius 999. Active: `ink` background with white text. Inactive: transparent background with `muted` text. Uses `aria-pressed`. |
| **Project card** | The whole card is the link. White background, `border` border, radius 12, padding 20. A 48 px tinted icon tile on the left, then name (16/600), a one-line plain description (14, `ink-2`) and the repo name (mono 12, `muted`). Hover: `#C9C6BF` border plus the hover shadow. |
| **Tag** | 12 px/500, padding 3–4 × 8–10, radius 4, category tint and ink. |
| **Switch row** | A `<label>` wrapping the text (14 px title plus 12 px `muted` hint) and an `<input type="checkbox" role="switch">` with `accent-color: primary`. At least 48 px tall; the whole row is clickable. |
| **Segmented control** | Track: `hover` colour, radius 8, padding 3. Active segment: white with a small shadow, 600 weight. Uses `aria-pressed`. |
| **Editor tabs** | `role="tablist"` / `role="tab"` with `aria-selected`. 44 px tall. The active tab is white with a 2 px inset top border in `primary`. |
| **File list (sidebar)** | A button per item: the plain label (14 px) with the technical file name below (mono 11). Active item: `primary-tint` background and `primary-ink` text, with `aria-current`. |
| **Canvas node** | White, `border-strong` border, radius 12, padding 12–14, 13 px/600 title. The selected/editing node gets the selection ring plus a green "Editing" pill. Nodes link through `connector` lines 2 px thick. |
| **Presence avatars** | 28 px circles overlapping by −8 px, with a 2 px white ring and initials. Next to them, a plain-text count ("4 people looking at this page"). |
| **Live cursor** | A pointer SVG (path `M2 2l15 8-6.5 1.8L8 19z`) filled with the person's colour and outlined in 1.5 px white. A name pill offset 16 px right and 18 px down. An optional chat bubble below it, radius `4 12 12 12`. Cursors are `aria-hidden="true"` and `pointer-events: none`. |
| **Cursor settings popover** | See §5. |
| **Activity log** | A list with a header ("Activity" plus a mono caption). Entries are plain sentences in the past tense ("You turned Verified links on"), newest first, 5 kept. The container has `aria-live="polite"`. |
| **Status bar** | A thin footer at 12 px `muted`: status dot plus text, and the reassurance line "Private sandbox — changes here never affect the original project". |
| **Diff block** | Card with a 13/600 title bar, then two mono rows: `−` in `diff-del` colours and `+` in `diff-add` colours. The signs carry `aria-label="removed"` / `"added"`. |
| **Phone mockup** | 330 × 640, an 8 px `ink` bezel, radius 32, white screen, `overflow: hidden`. |

---

## 4. Screens

### 4.1 Gallery (home / explore)
- **Header:** the logo tile (28 px, radius 7, `brand` coral with a white cube icon), the wordmark "Sandbox" (16/650), and a secondary "Sign in" button on the right.
- **Hero (centred):** H1 "Find Your Next Experiment" (Geist Mono 500). Subline: "Pick a project and try it with your own files, right in your browser." Below it, one 52 px search field (white, radius 12) with a visually hidden label "What do you want to do?".
- **Trending:** an H2 "Trending" with filter pills on the right (All, Images, Audio, Documents, Creative, plus Social if the repo has social projects). Below, a grid `repeat(auto-fill, minmax(300px, 1fr))` with 16 px gaps. Each project card links to its project page.
- **Keep it minimal.** No extra marketing sections.

### 4.2 Project landing page
Shown here for the Bluesky app (`bluesky-social/social-app`, MIT, TypeScript). Use whatever project the route provides.
- **Header:** logo, a breadcrumb (`Explore / <Project>`), then on the right the presence avatars plus count, the **Cursors** button (§5), and Sign in.
- **Hero:** two columns (`repeat(auto-fit, minmax(320px, 1fr))`, gap 48).
  - **Left:** category tag; mono H1 with the project name; a 19 px plain-language description; the mono meta line `owner/repo · licence · language`; buttons **Open in sandbox** (primary, play icon) and **View source** (secondary, links to the repo); a "Good for" row of outline chips.
  - **Right:** a live preview. For an app, use a phone mockup of its most recognisable screen. For a creative tool, use a running output.
- **What people are suggesting (or making):** three cards, each with a tag, title, one-line description and "Suggested by @handle". Clicking a card opens the workspace with that suggestion loaded.
- **What is it?** Two short paragraphs on the left. On the right, a Notion-style property list (`<dl>`): Made by, Licence, Written in, Source, Sandbox ("Pretend timeline — nothing is posted for real").
- **Live cursors:** drawn on top of the page. See §5.

### 4.3 Workspace (exploration canvas)
This is an editor layout made approachable. The worked example is "Profiles, but more like Mastodon": someone testing Mastodon-style profile features on the Bluesky app's profile page.

- **Header:** a back link to the project; the H1 title of the suggestion with the meta line "your suggestion · N changes · edited just now"; presence avatars ("Maya is here"); the **Cursors** button; and a primary **Share suggestion** button, which changes the status from *Draft* to *Shared with maintainers*.
- **Left sidebar (220 px, white):**
  - "Project" file list: **Canvas** (`profile preview`), **Changes** (`suggestion.diff`), **About** (`README.md`).
  - "Your suggestion" block: a status pill (Draft uses `note` colours, Shared uses `diff-add` colours), the change count, and "Based on `owner/repo`".
- **Main area:** editor tabs that mirror the file list.
  - **Canvas tab:** the dot-grid canvas, with setting nodes on the left feeding a live preview node on the right through connectors.
    - Node **Profile details:** switches for *Verified links*, *Featured hashtags*, *Show their server*.
    - Node **Privacy and layout** (shown selected, with the "Editing" pill): switches for *Approve new followers*, *Hide follower counts*, *Mastodon-style tabs*.
    - **Preview node:** the title "Profile page" plus an **Original / Your version** segmented control, then a phone mockup of the profile. It has a banner, a 72 px avatar overlapping it, a blue (`#1185FE`) Follow pill, name, handle, a "Follows you" chip, counts, bio, the tab row and one post.
    - **Each switch updates the preview live:**
      - *Verified links:* a two-row table appears under the bio, and the website row turns green with a tick.
      - *Featured hashtags:* hashtag pills appear.
      - *Show their server:* the handle changes from `@name.bsky.social` to `@name@server`.
      - *Approve new followers:* Follow becomes a padlock plus "Request to follow", and a padlock appears by the name.
      - *Hide follower counts:* the counts are replaced with "follower counts hidden".
      - *Mastodon-style tabs:* the tabs become Posts / Posts & replies / Media.
    - **"Original"** renders the unchanged profile. Any switch change jumps back to "Your version".
  - **Changes tab:** a short explanation, then one diff block per setting that differs from the original. With no changes, show the empty state "No changes yet. Flip a switch on the Canvas to start." Label it as a simplified view, not the real code.
  - **About tab:** a plain explanation of the suggestion, plus the project, licence and inspiration (Mastodon).
  - **Activity panel (below the tabs):** logs every change in plain English.
- **Status bar:** "Showing your version / the original" and "Pretend profile — nothing is changed for real".
- **Phone width:** the sidebar stacks above the main area, the canvas scrolls horizontally inside its own box, and the header wraps.

**Reuse the pattern.** The same workspace template should work for other projects. Swap the nodes (settings) and the preview, and keep the shell: header, file list, tabs, canvas, Changes/Code tab, Activity, status bar. For a creative project (e.g. p5.js), the second tab is **Code** and shows the real program with one plain note per line ("← How many"), updating as sliders move.

---

## 5. New feature: live-cursor privacy controls

Visitors can turn off other people's cursors, and stop sharing their own.

**Control.** A secondary button in the header: a cursor icon plus "Cursors: On / Off". It has `aria-expanded` and `aria-controls="cursor-menu"`, and toggles a popover anchored below and right-aligned (290 px wide, radius 12, popover shadow).

**Popover contents:**
1. The title "Live cursors" (13/600).
2. Switch: **See other people's cursors.** Default on. When off, hide every remote cursor and chat bubble on the page. Presence avatars and the viewer count stay visible.
3. Switch: **Show my cursor to others.** Default on. When off, stop broadcasting this user's pointer position. They still count as a viewer, but appear as "someone" with no name or position. In the workspace, their own cursor label reads "You · private", and collaborators still see their edits.
4. A helper line (12 px `muted`) explaining the current state:
   - **Sharing on:** "Others see your pointer with your name. Turn it off to browse privately — you'll count as 'someone' in the viewer number."
   - **Sharing off:** "Your pointer is private. Others see 'someone' in the viewer count, but not where you are on the page."

**Behaviour:**
- The button label reflects the first switch ("Cursors: Off" when others' cursors are hidden).
- **Remember both preferences.** Save them to the user's account settings if the repo has them; otherwise save to `localStorage`, wrapping reads and writes in try/catch.
- **Wiring:** if the repo has a realtime or presence layer (Liveblocks, Yjs/y-websocket, Supabase Realtime, PartyKit, a custom WebSocket…), hook into it. "Show my cursor" off means never sending pointer updates, not just hiding them locally. If there is no presence layer, add a small `PresenceProvider` interface with a mock implementation that animates sample cursors, and leave a clear TODO for the real transport.
- **Esc** closes the popover, as does clicking outside it. Focus returns to the button.
- **Reduced motion:** with `prefers-reduced-motion: reduce`, the demo cursor animation stops. Real cursors may still move, but without easing trails.
- **Screen readers:** cursors stay `aria-hidden`. Presence is conveyed by the text count.

---

## 6. Accessibility (required)
- Use real elements: `<button>`, `<a href>`, `<input>` with a `<label>`. Never put a click handler on a `div` or `span`.
- Icon-only buttons need an `aria-label`. Decorative SVGs get `aria-hidden="true"`. Meaningful previews get `role="img"` plus an `aria-label` describing the current state (e.g. "A 7 by 7 grid of pulsing circles in Sunset colours").
- **Text contrast:** at least 4.5:1, including 11–12 px captions. Use the tokens above; they're chosen to pass.
- **Touch targets:** at least 44 px for primary controls; switch rows at least 48 px.
- **Focus:** visible focus styles on everything (a 2 px `primary` outline with a 2 px offset is fine).
- **Keyboard:** tabs, segmented controls, switches and the popover are all keyboard-operable.
- `aria-live="polite"` on the Activity list.
- Don't rely on colour alone. Diff rows carry −/+ signs, statuses carry text, verified links carry a tick.

## 7. Copy rules
- Use plain language first, with the technical term second and small: "Recipe · `recipe.py`", "Activity — what the computer is doing".
- Address the user as "you". Use short sentences and sentence case for buttons ("Open in sandbox", "Share suggestion").
- Reassure people about safety: "Nothing you do here can break the original project", "Pretend timeline — nothing is posted for real".
- Credit makers: show repo, licence and language on every project surface.

## 8. Data rules
- Use real project names, repos and licences only where the repo's data provides them. Verify licences from the source repo rather than hard-coding them.
- **Never invent** star counts, usage numbers or dates. Show a placeholder or leave the field out.
- Sample people (Maya, Jun, Ola, Sam) are demo-only. Keep them behind the mock presence provider or in fixtures, never in production copy.

## 9. Acceptance checklist
- [ ] Tokens are defined once in the repo's styling system, and the screens use tokens rather than raw hex values.
- [ ] The Gallery, Project page and Workspace match §4 at 1440 px and work at 390 px with no horizontal page scroll.
- [ ] The cards → project page → workspace navigation works.
- [ ] Every workspace switch updates the preview; Original/Your version works; the Changes tab lists only the changed settings; Activity logs each change; Share moves Draft to Shared.
- [ ] The cursor privacy popover works as described in §5, preferences persist, and "Show my cursor" off stops sending updates.
- [ ] Reduced-motion is respected, and all of §6 passes.
- [ ] Lint, types, tests and the build pass.
- [ ] The PR description lists the placeholders and any gaps.

---

## Appendix: reference files

`reference/` holds the approved design as three self-contained screens, exported from the design tool:

| File | Screen |
|---|---|
| `reference/01-gallery.dc.html` | Gallery |
| `reference/02-project-page.dc.html` | Project landing page with live cursors and the cursor popover |
| `reference/03-workspace.dc.html` | Workspace: Bluesky profile, Mastodon-style suggestion |

**How to read them:**
- The markup and inline styles are the source of truth for layout, spacing, colours and copy.
- They use a design-tool template syntax: `{{ value }}` holes, `<sc-for>` loops, `<sc-if>` conditionals, `<x-dc>` / `<helmet>` wrappers, and a `class Component extends DCLogic` block whose `renderVals()` holds the demo state and handlers. **Treat that syntax as pseudo-code.** Re-implement the same behaviour with the repo's own components and state management. Don't copy the runtime (`support.js`) or the template tags into the app.
- The `renderVals()` blocks are worth reading for exact behaviour: which settings exist, their defaults, the original-vs-yours logic, the activity-log wording and the diff text.
