/**
 * A tool adapter turns a command-line style tool into a form. The adapter
 * declares exactly which inputs and options are supported; the UI renders
 * only those, so users can't reach behaviour the adapter can't handle
 * safely and correctly.
 */

export type OptionSpec =
  | { id: string; kind: "select"; label: string; help?: string; choices: { value: string; label: string }[]; default: string }
  | { id: string; kind: "boolean"; label: string; help?: string; default: boolean }
  | { id: string; kind: "text"; label: string; help?: string; default: string; maxLength: number };

export interface ToolInputSpec {
  label: string;
  placeholder: string;
  /** File extensions accepted for upload, e.g. [".txt", ".md"]. */
  accept: string[];
  maxBytes: number;
  sample: string;
}

export interface ToolSpec {
  id: string;
  actionLabel: string;
  input: ToolInputSpec;
  options: OptionSpec[];
}

export interface ToolResult {
  summary: string;
  metrics?: { label: string; value: string; hint?: string }[];
  sections?: { title: string; items: string[] }[];
  /** A complete HTML document to show in a script-less sandboxed frame. */
  previewHtml?: string;
  download?: { filename: string; mimeType: string; content: string };
}

export type OptionValues = Record<string, string | boolean>;

export interface ToolAdapter {
  spec: ToolSpec;
  run(text: string, options: OptionValues): ToolResult;
  /** Runs the adapter on its own sample input; used as a health check. */
  selfTest(): boolean;
}

export class ToolInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolInputError";
  }
}

/** Validate untrusted option values against the adapter's declared spec. */
export function resolveOptions(spec: ToolSpec, raw: unknown): OptionValues {
  const input = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const values: OptionValues = {};
  for (const opt of spec.options) {
    const v = input[opt.id];
    switch (opt.kind) {
      case "select":
        values[opt.id] = typeof v === "string" && opt.choices.some((c) => c.value === v) ? v : opt.default;
        break;
      case "boolean":
        values[opt.id] = typeof v === "boolean" ? v : opt.default;
        break;
      case "text":
        values[opt.id] = typeof v === "string" ? v.slice(0, opt.maxLength) : opt.default;
        break;
    }
  }
  return values;
}
