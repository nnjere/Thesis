import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SimulatedTag, SourceBadge, StatusBadge, TypeBadge } from "@/components/Badges";
import { ProjectArt } from "@/components/ProjectArt";
import { ProjectCard, tryMode } from "@/components/ProjectCard";
import { getCategory, getProject, listProjects, resolveAlternatives } from "@/lib/catalog";
import { SOURCE_INFO, STATUS_INFO, TYPE_INFO } from "@/lib/catalog/labels";
import type { Project } from "@/lib/catalog/types";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return listProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const project = getProject((await params).slug);
  return project ? { title: project.name, description: project.tagline } : {};
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-border bg-surface p-6">
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      <div className="mt-3 text-ink-2">{children}</div>
    </section>
  );
}

function TryPanel({ project }: { project: Project }) {
  const mode = tryMode(project);
  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
      <p className="text-sm font-semibold text-muted">How can you try it?</p>
      <p className="mt-2 text-ink-2">{project.howToTry}</p>

      <div className="mt-5 space-y-2">
        {mode === "real" && (
          <Link href={`/projects/${project.slug}/try`} className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-5 py-3.5 text-lg font-semibold text-white shadow hover:bg-primary-ink">
            ▶ Try it
          </Link>
        )}
        {mode === "simulated" && (
          <>
            <Link href={`/projects/${project.slug}/try`} className="flex w-full items-center justify-center gap-2 rounded-md bg-ink px-5 py-3.5 text-lg font-semibold text-white hover:bg-ink-2">
              Try it <SimulatedTag />
            </Link>
            <p className="text-xs text-muted">
              Real sandboxes aren&apos;t connected in this prototype. You&apos;ll see how launching would work, but nothing from this project
              will actually run.
            </p>
          </>
        )}
        {project.homepage && (
          <a href={project.homepage} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center rounded-md border border-border-strong px-5 py-3 font-semibold hover:bg-ink-2/[0.03]">
            {project.type === "library" ? "Visit the official site" : "Use the official version"} ↗
          </a>
        )}
        {project.downloadUrl && (
          <a href={project.downloadUrl} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center rounded-md border border-border-strong px-5 py-3 font-semibold hover:bg-ink-2/[0.03]">
            Download for your computer ↗
          </a>
        )}
        {project.repo && (
          <a href={project.repo.url} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold text-muted hover:text-ink">
            See the original on GitHub ↗
          </a>
        )}
      </div>
    </div>
  );
}

export default async function ProjectPage({ params }: Params) {
  const project = getProject((await params).slug);
  if (!project) notFound();
  const category = getCategory(project.category);
  const alternatives = resolveAlternatives(project);
  const status = STATUS_INFO[project.status];

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/explore" className="hover:text-ink">Explore</Link> <span aria-hidden>/</span>{" "}
        <Link href={`/explore?category=${category.id}`} className="hover:text-ink">{category.label}</Link>
      </nav>

      <header className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={project.status} size="md" />
            <TypeBadge type={project.type} />
            <SourceBadge source={project.source} />
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{project.name}</h1>
          <p className="mt-3 text-xl text-muted">{project.tagline}</p>
        </div>
        <div className="overflow-hidden rounded-card border border-border shadow-sm">
          <ProjectArt seed={project.slug} preview={project.preview} className="aspect-[16/9] w-full" />
        </div>
      </header>

      {project.source === "sample-listing" && (
        <p className="mt-6 rounded-md border border-dashed border-border-strong bg-surface px-4 py-3 text-sm text-muted">
          <strong className="text-ink">Sample listing.</strong> {SOURCE_INFO["sample-listing"].description}
        </p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Section title="What does this do?">
            <p>{project.description}</p>
          </Section>
          <Section title="What can you do with it?">
            <ul className="space-y-2">
              {project.uses.map((u) => (
                <li key={u} className="flex gap-2">
                  <span aria-hidden className="text-primary">✓</span>
                  {u}
                </li>
              ))}
            </ul>
          </Section>
          <Section title="What kind of project is it?">
            <p>
              <strong>{TYPE_INFO[project.type].label}:</strong> {TYPE_INFO[project.type].plain.toLowerCase()}.
            </p>
            {project.type === "library" && (
              <p className="mt-2">
                A library is a <strong>building block</strong>, not a standalone app. On its own there&apos;s nothing to open, but it lets
                developers build things more easily.
              </p>
            )}
            {project.type === "desktop-app" && (
              <p className="mt-2">Apps like this need to be installed on your own device, so they can&apos;t run inside a web page.</p>
            )}
            {project.type === "cli-tool" && (
              <p className="mt-2">
                Command-line tools are normally used by typing commands. To try one here, it needs a simple form that exposes only the
                options it can safely support.
              </p>
            )}
          </Section>
          <Section title="Things to know">
            <ul className="list-disc space-y-1 pl-5">
              {project.limitations.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </Section>
        </div>

        <aside className="space-y-6">
          <TryPanel project={project} />
          <Section title="Project status">
            <StatusBadge status={project.status} size="md" />
            <p className="mt-2 text-sm">{status.description}</p>
            <Link href="/how-it-works#statuses" className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">
              What the labels mean
            </Link>
          </Section>
          <Section title="Who made it?">
            {project.creator.url ? (
              <a href={project.creator.url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
                {project.creator.name} ↗
              </a>
            ) : (
              <p className="font-semibold">{project.creator.name}</p>
            )}
            {project.license && <p className="mt-1 text-sm text-muted">Shared under the {project.license} open-source licence.</p>}
            {project.source === "built-in-demo" && (
              <p className="mt-1 text-sm text-muted">Bundled with this prototype to demonstrate the full experience. Not from GitHub.</p>
            )}
          </Section>
        </aside>
      </div>

      {alternatives.length > 0 && (
        <section className="mt-12" aria-labelledby="alternatives">
          <h2 id="alternatives" className="text-xl font-bold tracking-tight">You can try instead</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {alternatives.map((p) => (
              <ProjectCard key={p.slug} project={p} compact />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
