import type { Metadata } from "next";
import Link from "next/link";
import { SourceBadge, StatusBadge, TypeBadge } from "@/components/Badges";
import { SOURCE_INFO, STATUS_INFO, TYPE_INFO } from "@/lib/catalog/labels";
import type { DataSource, ProjectType, RunStatus } from "@/lib/catalog/types";
import { DEFAULT_SANDBOX_POLICY } from "@/lib/sandbox/policy";

export const metadata: Metadata = { title: "How it works" };

const STATUSES: RunStatus[] = ["verified", "ready", "experimental", "not-runnable"];
const TYPES: ProjectType[] = ["web-app", "cli-tool", "desktop-app", "library"];
const SOURCES: DataSource[] = ["built-in-demo", "sample-listing", "analyzed"];

function Card({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-3xl border border-black/5 bg-white p-6 sm:p-8">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-3 text-ink/85">{children}</div>
    </section>
  );
}

export default function HowItWorksPage() {
  const p = DEFAULT_SANDBOX_POLICY;
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 pt-10 sm:px-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">How it works &amp; what&apos;s real</h1>
        <p className="mt-3 text-lg text-muted">
          We hide unnecessary technical complexity, but never a project&apos;s limitations. Here&apos;s exactly what this prototype does
          and doesn&apos;t do.
        </p>
      </header>

      <Card title="What's real in this prototype">
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Built-in demos really run.</strong> Web demos run inside a locked-down frame in your browser; tool demos run on our server through a form. Each one is health-checked when you press “Try it”, and covered by automated tests.</li>
          <li><strong>Checking a GitHub link is real.</strong> We read the project&apos;s public information and a handful of setup files, and estimate what kind of project it is. Nothing is downloaded or run.</li>
          <li><strong>Launching GitHub projects is simulated.</strong> No real sandbox infrastructure is connected yet. When you “Try” a sample listing, you&apos;ll see a clearly labelled simulation, and it will tell you nothing was run.</li>
          <li><strong>Search is keyword matching</strong>, with a short list of synonyms. It isn&apos;t AI.</li>
          <li><strong>AI-assisted setup isn&apos;t switched on.</strong> The design has a place for it, with strict limits, but no AI model is connected.</li>
        </ul>
      </Card>

      <Card id="statuses" title="What the status labels mean">
        <ul className="space-y-3">
          {STATUSES.map((s) => (
            <li key={s} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
              <span className="sm:w-48"><StatusBadge status={s} size="md" /></span>
              <span>{STATUS_INFO[s].description}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted">Only projects that have actually been run and tested here can be marked Verified. Everything else is an honest estimate.</p>
      </Card>

      <Card title="Where listings come from">
        <ul className="space-y-3">
          {SOURCES.map((s) => (
            <li key={s} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
              <span className="sm:w-48"><SourceBadge source={s} /></span>
              <span>{SOURCE_INFO[s].description}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Four kinds of projects">
        <ul className="space-y-3">
          {TYPES.map((t) => (
            <li key={t} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
              <span className="sm:w-48"><TypeBadge type={t} /></span>
              <span>
                {TYPE_INFO[t].plain}.{" "}
                {t === "web-app" && "The ideal case: it can run in an isolated sandbox and be shown in a preview."}
                {t === "cli-tool" && "Where it's safe and correct to do so, it gets a simple form that exposes only the options it supports."}
                {t === "desktop-app" && "It can't run in a browser, so we link to official downloads."}
                {t === "library" && "A building block, not an app. We explain what it enables and suggest something you can try instead."}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card id="safety" title="Respecting the projects we list">
        <p>Open-source projects are run by real people with their own workflows. This product is built never to interfere with them:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>We only ever <strong>read</strong> public information from GitHub. The code that talks to GitHub can only make read requests, to a short list of public addresses.</li>
          <li>We never push code, create branches, commits, pull requests, issues or comments, star or fork projects, or change any settings.</li>
          <li>We never trigger a project&apos;s automated workflows (GitHub Actions).</li>
          <li>Sandboxes get a <strong>disconnected copy</strong> of a project, with no link back to the original, so there&apos;s nothing they could send changes to.</li>
          <li>Sandboxes never receive your passwords, our credentials, or anyone else&apos;s data.</li>
        </ul>
      </Card>

      <Card title="Sandbox limits (planned contract)">
        <p>Any real sandbox provider must enforce these limits before it&apos;s allowed to run a project:</p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Network blocked by default. Setup may only reach package registries ({p.network.allowedHosts.join(", ")}).</li>
          <li>At most {p.resources.cpus} CPUs, {p.resources.memoryMb / 1024} GB memory, {p.resources.diskMb / 1024} GB disk.</li>
          <li>Ends after {p.idleTimeoutMs / 60000} minutes of inactivity, and after {p.maxLifetimeMs / 60000} minutes at most.</li>
          <li>No credentials, no access to the host machine, no extra privileges. Only the preview is exposed.</li>
        </ul>
        <p className="text-sm text-muted">
          These limits are checked in code, but no real sandbox has been connected or security-tested yet. Until one has, we don&apos;t run
          code from GitHub at all.
        </p>
      </Card>

      <p className="pb-4 text-center">
        <Link href="/explore?runnable=1" className="font-semibold text-brand-700 hover:underline">Find something you can try now →</Link>
      </p>
    </div>
  );
}
