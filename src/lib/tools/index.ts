import { markdownToHtmlAdapter } from "./markdown-to-html";
import { readabilityAdapter } from "./readability";
import { ToolInputError, resolveOptions, type ToolAdapter, type ToolResult } from "./types";

const ADAPTERS: Record<string, ToolAdapter> = {
  [readabilityAdapter.spec.id]: readabilityAdapter,
  [markdownToHtmlAdapter.spec.id]: markdownToHtmlAdapter,
};

export function getToolAdapter(id: string): ToolAdapter | undefined {
  return Object.prototype.hasOwnProperty.call(ADAPTERS, id) ? ADAPTERS[id] : undefined;
}

/** Validate untrusted input and run the adapter. */
export function runTool(id: string, text: unknown, rawOptions: unknown): ToolResult {
  const adapter = getToolAdapter(id);
  if (!adapter) throw new ToolInputError("This tool isn't available.");
  if (typeof text !== "string" || !text.trim()) throw new ToolInputError("Add some text first, or upload a file.");
  if (new TextEncoder().encode(text).length > adapter.spec.input.maxBytes) {
    throw new ToolInputError(`That's a bit too long. The limit is about ${Math.round(adapter.spec.input.maxBytes / 1000)} KB of text.`);
  }
  return adapter.run(text, resolveOptions(adapter.spec, rawOptions));
}

export * from "./types";
