import type { Classification } from "@/lib/classify/classifier";
import type { ToolSpec } from "@/lib/tools/types";

/**
 * Interface for a future AI-assisted setup agent. No model is connected in
 * this prototype: `getSetupAgent()` returns a disabled agent, and the UI says
 * so plainly.
 *
 * A real implementation must work only through `AgentSandboxTools`, which a
 * sandbox provider supplies. It never gets host access, credentials or any
 * way to write to GitHub. Everything it reads (README, scripts, issue text)
 * is untrusted input and may contain instructions aimed at the agent; the
 * agent's output is treated as a proposal, checked by
 * `assertCommandRespectsWorkflows` and the sandbox policy before anything runs.
 */

export interface SetupContext {
  repo: { owner: string; name: string };
  classification: Classification;
  /** Untrusted. Truncated README text. */
  readmeExcerpt: string | null;
  fileList: string[];
}

export interface SetupProposal {
  /** Commands to run inside the sandbox, in order. */
  commands: string[];
  /** Port the app is expected to listen on, if it's a web app. */
  previewPort?: number;
  /** Environment variable *names* the project expects (never values). */
  requiredSettings: string[];
  /** Plain-English summary for the user. */
  explanation: string;
  confidence: "high" | "medium" | "low";
}

export interface FailureExplanation {
  headline: string;
  explanation: string;
  suggestion?: string;
}

/** The only capabilities an agent is ever given. All scoped to one sandbox. */
export interface AgentSandboxTools {
  readFile(path: string): Promise<string | null>;
  listFiles(dir: string): Promise<string[]>;
  /** Runs inside the sandbox, subject to SandboxPolicy and workflow checks. */
  exec(command: string, opts?: { timeoutMs?: number }): Promise<{ exitCode: number; output: string }>;
}

export interface SetupAgent {
  readonly available: boolean;
  readonly description: string;
  proposeSetup(ctx: SetupContext, tools: AgentSandboxTools): Promise<SetupProposal>;
  explainFailure(diagnostics: string[]): Promise<FailureExplanation>;
  /** Suggest a safe form for a command-line tool, from its --help output. */
  proposeInterface(helpText: string): Promise<ToolSpec | null>;
}

export class AgentUnavailableError extends Error {
  constructor() {
    super("AI-assisted setup is not enabled in this prototype.");
    this.name = "AgentUnavailableError";
  }
}

class DisabledSetupAgent implements SetupAgent {
  readonly available = false;
  readonly description = "AI-assisted setup isn't switched on in this prototype. No AI model is connected.";
  async proposeSetup(): Promise<SetupProposal> {
    throw new AgentUnavailableError();
  }
  async explainFailure(): Promise<FailureExplanation> {
    throw new AgentUnavailableError();
  }
  async proposeInterface(): Promise<ToolSpec | null> {
    throw new AgentUnavailableError();
  }
}

export function getSetupAgent(): SetupAgent {
  return new DisabledSetupAgent();
}
