import type { Metadata } from "next";
import { AnalyzeView } from "@/components/analyze/AnalyzeView";
import { getSetupAgent } from "@/lib/ai/setup-agent";

export const metadata: Metadata = { title: "Check a GitHub project" };

export default async function AnalyzePage({ searchParams }: { searchParams: Promise<{ url?: string }> }) {
  const { url } = await searchParams;
  const agent = getSetupAgent();
  return (
    <div className="mx-auto max-w-4xl px-4 pt-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Check a GitHub project</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Paste a link to any public project on GitHub. We&apos;ll read its public information and a few setup files to work out what
        kind of project it is and whether it could be tried online. <strong className="text-ink">Nothing is downloaded or run.</strong>
      </p>
      <AnalyzeView initialUrl={typeof url === "string" ? url.slice(0, 300) : ""} agentNote={agent.description} />
    </div>
  );
}
