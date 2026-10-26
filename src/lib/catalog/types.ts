/**
 * Shared domain types for the project catalog.
 *
 * Two ideas are kept deliberately separate:
 *  - `source`: where a listing came from (a demo bundled with this app, a
 *    hand-written sample listing of a real GitHub project, or a live analysis).
 *  - `status`: what we know about running it. "verified" is only allowed for
 *    projects this app has actually run and tested (enforced in tests).
 */

export type ProjectType = "web-app" | "cli-tool" | "desktop-app" | "library";

export type RunStatus = "verified" | "ready" | "experimental" | "not-runnable";

export type DataSource = "built-in-demo" | "sample-listing" | "analyzed";

export type CategoryId =
  | "ai-ml"
  | "design-creativity"
  | "productivity"
  | "research"
  | "data-viz"
  | "writing"
  | "dev-tools";

export interface Category {
  id: CategoryId;
  label: string;
  blurb: string;
  icon: string;
}

export type PreviewPattern = "flow" | "dots" | "rings" | "bars" | "blobs" | "grid" | "stripes";

export interface PreviewSpec {
  /** Base hue (0-360) for the generated artwork. */
  hue: number;
  pattern: PreviewPattern;
  glyph: string;
}

/** A simulated launch plan. Used only where nothing is really executed. */
export interface SimulatedFailure {
  /** Index of the step at which the simulation stops. */
  atStep: number;
  /** Plain-English explanation shown to the user. */
  headline: string;
  explanation: string;
  /** Technical detail kept in diagnostics, never shown by default. */
  diagnostic: string;
}

export type LaunchSpec =
  /** A web app bundled with this prototype, served from /public/demos. */
  | { kind: "embedded-web-app"; entry: string }
  /** A command-line style tool exposed as a form via a registered adapter. */
  | { kind: "tool-form"; adapterId: string }
  /** No real sandbox exists yet: the launch flow is clearly simulated. */
  | { kind: "simulated"; failure?: SimulatedFailure; wouldShow: string }
  /** Cannot be tried here at all (desktop apps, libraries). */
  | { kind: "none" };

export interface Project {
  slug: string;
  name: string;
  /** One line, plain English. */
  tagline: string;
  /** "What does this do?" in two or three sentences. */
  description: string;
  /** "What can you do with it?" concrete examples. */
  uses: string[];
  category: CategoryId;
  tags: string[];
  /** Extra search terms (synonyms people might type). */
  keywords: string[];
  type: ProjectType;
  status: RunStatus;
  source: DataSource;
  creator: { name: string; url?: string };
  repo?: { owner: string; name: string; url: string };
  license?: string;
  /** Official hosted version, if the project offers one. */
  homepage?: string;
  /** Where to download a desktop/mobile build. */
  downloadUrl?: string;
  /** "How can you try it?" in plain English. */
  howToTry: string;
  limitations: string[];
  launch: LaunchSpec;
  /** Slugs of projects you can try instead. */
  alternatives?: string[];
  preview: PreviewSpec;
  /** ISO date the listing was added to this catalog. */
  addedAt: string;
  /** Demo ranking used for "popular" ordering. Not a real usage metric. */
  popularity: number;
  featured?: boolean;
}
