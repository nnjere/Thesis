import { StatusBadge, TypeBadge } from "@/components/Badges";
import { KindTile } from "@/components/ProjectCard";
import { BlueskyTimeline } from "@/components/previews/BlueskyTimeline";
import type { Project } from "@/lib/catalog/types";

/**
 * Right-hand preview on the project page. Built-in web demos show their real
 * running output; scenario projects show a labelled mock; everything else
 * says plainly that there's no live preview.
 */
export function ProjectPreview({ project }: { project: Project }) {
  if (project.launch.kind === "embedded-web-app") {
    return (
      <figure className="m-0 flex flex-col gap-2">
        <div className="overflow-hidden rounded-panel border border-border bg-surface shadow-float">
          <iframe
            title={`${project.name}, running live`}
            src={project.launch.entry}
            sandbox="allow-scripts allow-downloads"
            referrerPolicy="no-referrer"
            className="h-[420px] w-full"
          />
        </div>
        <figcaption className="text-xs text-muted">Running live in a private frame. Try it right here, or open the full sandbox.</figcaption>
      </figure>
    );
  }
  if (project.workspace === "bluesky-profile") {
    return (
      <figure className="m-0 flex flex-col items-center gap-2">
        <BlueskyTimeline />
        <figcaption className="text-xs text-muted">Pretend timeline drawn by Sandbox, not the real app.</figcaption>
      </figure>
    );
  }
  return (
    <figure className="dot-grid m-0 flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-panel border border-border p-8 text-center">
      <KindTile project={project} size={72} />
      <div className="flex flex-wrap justify-center gap-1.5">
        <TypeBadge type={project.type} />
        <StatusBadge status={project.status} />
      </div>
      <figcaption className="max-w-[300px] text-sm text-ink-2">No live preview for this project yet. {project.howToTry}</figcaption>
    </figure>
  );
}
