import type { DataSource, ProjectType, RunStatus } from "./types";

export const STATUS_INFO: Record<RunStatus, { label: string; short: string; description: string; tone: string }> = {
  verified: {
    label: "Verified",
    short: "Tested here",
    description: "Tested successfully in this sandbox. Works right now.",
    tone: "emerald",
  },
  ready: {
    label: "Ready to try",
    short: "Looks promising",
    description: "Compatibility looks promising, but it hasn't been fully tested here yet.",
    tone: "sky",
  },
  experimental: {
    label: "Experimental",
    short: "May not work",
    description: "Automatic setup is being attempted and may not succeed.",
    tone: "amber",
  },
  "not-runnable": {
    label: "Not directly runnable",
    short: "Can't run here",
    description: "Needs a different environment (like your own computer) or extra technical setup.",
    tone: "slate",
  },
};

export const TYPE_INFO: Record<ProjectType | "unknown", { label: string; plain: string; icon: string }> = {
  "web-app": { label: "Web app", plain: "Something you use in a web browser", icon: "🌐" },
  "cli-tool": { label: "Command-line tool", plain: "A program normally used by typing commands", icon: "⌨️" },
  "desktop-app": { label: "Desktop or mobile app", plain: "An app you install on a computer or phone", icon: "💻" },
  library: { label: "Library / building block", plain: "A toolkit developers use to build other things", icon: "🧩" },
  unknown: { label: "Unclear", plain: "We couldn't tell what kind of project this is", icon: "❔" },
};

export const SOURCE_INFO: Record<DataSource, { label: string; description: string }> = {
  "built-in-demo": {
    label: "Built-in demo",
    description: "A small project bundled with this prototype. It really runs, and it's covered by automated tests.",
  },
  "sample-listing": {
    label: "Sample listing",
    description:
      "Describes a real project on GitHub, written by hand for this prototype. Nothing from it has been downloaded or run here, and “Try it” is a simulation.",
  },
  analyzed: {
    label: "Live analysis",
    description: "Generated just now from the project's public GitHub information. Nothing was downloaded or run.",
  },
};
