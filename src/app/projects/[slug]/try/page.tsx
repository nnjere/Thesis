import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LaunchExperience } from "@/components/launch/LaunchExperience";
import { ProjectCard } from "@/components/ProjectCard";
import { getProject, resolveAlternatives } from "@/lib/catalog";
import { getToolAdapter } from "@/lib/tools";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const project = getProject((await params).slug);
  return project ? { title: `Try ${project.name}` } : {};
}

export default async function TryPage({ params }: Params) {
  const project = getProject((await params).slug);
  if (!project) notFound();
  const alternatives = resolveAlternatives(project);

  if (project.launch.kind === "none") {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-12 sm:px-6">
        <div className="rounded-3xl border border-black/5 bg-white p-8">
          <h1 className="text-2xl font-bold tracking-tight">{project.name} can&apos;t be tried in the browser</h1>
          <p className="mt-3 text-ink/85">{project.howToTry}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {project.downloadUrl && (
              <a href={project.downloadUrl} target="_blank" rel="noopener noreferrer" className="rounded-2xl bg-ink px-5 py-3 font-semibold text-white">
                Download for your computer ↗
              </a>
            )}
            {project.homepage && (
              <a href={project.homepage} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-black/10 px-5 py-3 font-semibold">
                Visit the official site ↗
              </a>
            )}
            <Link href={`/projects/${project.slug}`} className="rounded-2xl px-5 py-3 font-semibold text-muted hover:text-ink">
              Back to {project.name}
            </Link>
          </div>
        </div>
        {alternatives.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold">You can try instead</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              {alternatives.map((p) => (
                <ProjectCard key={p.slug} project={p} compact />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const toolSpec = project.launch.kind === "tool-form" ? getToolAdapter(project.launch.adapterId)?.spec : undefined;

  return (
    <LaunchExperience
      project={{
        slug: project.slug,
        name: project.name,
        tagline: project.tagline,
        status: project.status,
        homepage: project.homepage,
        repoUrl: project.repo?.url,
        preview: project.preview,
      }}
      toolSpec={toolSpec}
      alternatives={alternatives.map((a) => ({ slug: a.slug, name: a.name, tagline: a.tagline }))}
    />
  );
}
