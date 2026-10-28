import Link from "next/link";
import { getCategory } from "@/lib/catalog/categories";
import type { Project } from "@/lib/catalog/types";
import { SimulatedTag, SourceBadge, StatusBadge, TypeBadge } from "./Badges";
import { ProjectArt } from "./ProjectArt";

export function tryMode(project: Project): "real" | "simulated" | "none" {
  if (project.launch.kind === "embedded-web-app" || project.launch.kind === "tool-form") return "real";
  if (project.launch.kind === "simulated") return "simulated";
  return "none";
}

export function ProjectCard({ project, compact = false }: { project: Project; compact?: boolean }) {
  const mode = tryMode(project);
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card border border-border bg-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative">
        <ProjectArt seed={project.slug} preview={project.preview} className="aspect-[16/9] w-full" />
        {mode === "real" && (
          <span className="absolute right-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-white shadow">
            ▶ Try it now
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={project.status} />
          <TypeBadge type={project.type} />
        </div>
        <div>
          <h3 className="text-lg font-semibold leading-snug">
            <Link href={`/projects/${project.slug}`} className="after:absolute after:inset-0 focus:outline-none">
              {project.name}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-muted">{project.tagline}</p>
        </div>
        {!compact && (
          <p className="text-sm text-ink-2">
            <span className="font-medium text-ink">You could: </span>
            {project.uses[0].charAt(0).toLowerCase() + project.uses[0].slice(1)}.
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-1.5">
            <SourceBadge source={project.source} />
            {!compact && <span className="hidden text-xs text-muted sm:inline">{getCategory(project.category).icon}</span>}
          </div>
          <span className="relative z-10 flex items-center gap-1.5">
            {mode === "simulated" && <SimulatedTag />}
            {mode === "none" ? (
              <Link href={`/projects/${project.slug}`} className="rounded-full bg-hover px-3.5 py-1.5 text-sm font-semibold hover:bg-ink-2/10">
                Learn more
              </Link>
            ) : (
              <Link
                href={`/projects/${project.slug}/try`}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold text-white ${mode === "real" ? "bg-primary hover:bg-primary-ink" : "bg-ink/80 hover:bg-ink"}`}
              >
                Try it
              </Link>
            )}
          </span>
        </div>
      </div>
    </article>
  );
}
