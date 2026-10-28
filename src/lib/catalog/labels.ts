import type { DataSource, ProjectKind, ProjectType, RunStatus } from "./types";

export const STATUS_INFO: Record<RunStatus, { label: string; short: string; description: string; tone: string; dot: string }> = {
  verified: {
    label: "Verified",
    short: "Tested here",
    description: "Tested successfully in this sandbox. Works right now.",
    tone: "bg-primary-tint text-primary-ink", dot: "bg-primary",
  },
  ready: {
    label: "Ready to try",
    short: "Looks promising",
    description: "Compatibility looks promising, but it hasn't been fully tested here yet.",
    tone: "bg-cat-documents-bg text-cat-documents-ink", dot: "bg-cat-documents-ink",
  },
  experimental: {
    label: "Experimental",
    short: "May not work",
    description: "Automatic setup is being attempted and may not succeed.",
    tone: "bg-note-bg text-note-ink", dot: "bg-warning-dot",
  },
  "not-runnable": {
    label: "Not directly runnable",
    short: "Can't run here",
    description: "Needs a different environment (like your own computer) or extra technical setup.",
    tone: "bg-hover text-ink-2", dot: "bg-muted",
  },
};

export const TYPE_INFO: Record<ProjectType | "unknown", { label: string; plain: string; icon: "globe" | "terminal" | "monitor" | "blocks" | "help" }> = {
  "web-app": { label: "Web app", plain: "Something you use in a web browser", icon: "globe" },
  "cli-tool": { label: "Command-line tool", plain: "A program normally used by typing commands", icon: "terminal" },
  "desktop-app": { label: "Desktop or mobile app", plain: "An app you install on a computer or phone", icon: "monitor" },
  library: { label: "Library / building block", plain: "A toolkit developers use to build other things", icon: "blocks" },
  unknown: { label: "Unclear", plain: "We couldn't tell what kind of project this is", icon: "help" },
};

/** Gallery filter label, project-page tag label and token class names per kind. */
export const KIND_INFO: Record<ProjectKind, { filter: string; tag: string; tint: string; ink: string }> = {
  images: { filter: "Images", tag: "Images", tint: "bg-cat-images-bg", ink: "text-cat-images-ink" },
  audio: { filter: "Audio", tag: "Audio", tint: "bg-cat-audio-bg", ink: "text-cat-audio-ink" },
  documents: { filter: "Documents", tag: "Documents", tint: "bg-cat-documents-bg", ink: "text-cat-documents-ink" },
  creative: { filter: "Creative", tag: "Creative", tint: "bg-cat-creative-bg", ink: "text-cat-creative-ink" },
  data: { filter: "Data", tag: "Data", tint: "bg-cat-data-bg", ink: "text-cat-data-ink" },
  social: { filter: "Social", tag: "Social apps", tint: "bg-cat-social-bg", ink: "text-cat-social-ink" },
  tools: { filter: "Tools", tag: "Tools", tint: "bg-cat-tools-bg", ink: "text-cat-tools-ink" },
};

export const KIND_ORDER: ProjectKind[] = ["images", "audio", "documents", "creative", "data", "social", "tools"];

export const SOURCE_INFO: Record<DataSource, { label: string; description: string }> = {
  "built-in-demo": {
    label: "Built-in demo",
    description: "A small project bundled with this prototype. It really runs, and it's covered by automated tests.",
  },
  "sample-listing": {
    label: "Sample listing",
    description:
      "Describes a real project on GitHub, written by hand for this prototype. Nothing from it has been downloaded or run here, and opening it shows a simulation.",
  },
  analyzed: {
    label: "Live analysis",
    description: "Generated just now from the project's public GitHub information. Nothing was downloaded or run.",
  },
};
