import Link from "next/link";
import { KIND_INFO } from "@/lib/catalog/labels";
import type { Project } from "@/lib/catalog/types";
import { StatusLine } from "./Badges";
import { Icon } from "./ui/Icon";
import { card, cardHover } from "./ui/styles";

export function tryMode(project: Project): "real" | "simulated" | "none" {
  if (project.launch.kind === "embedded-web-app" || project.launch.kind === "tool-form") return "real";
  if (project.launch.kind === "simulated") return "simulated";
  return "none";
}

export function KindTile({ project, size = 48 }: { project: Pick<Project, "kind">; size?: number }) {
  const info = KIND_INFO[project.kind];
  return (
    <span className={`flex flex-none items-center justify-center rounded-[10px] ${info.tint} ${info.ink}`} style={{ width: size, height: size }}>
      <Icon name={project.kind} size={Math.round(size * 0.46)} strokeWidth={1.8} />
    </span>
  );
}

/** The whole card is the link (design §3). */
export function ProjectCard({ project }: { project: Project; compact?: boolean }) {
  return (
    <Link href={`/projects/${project.slug}`} className={`flex items-start gap-4 p-5 text-ink no-underline hover:text-ink ${card} ${cardHover}`}>
      <KindTile project={project} />
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-base font-semibold">{project.name}</span>
        <span className="text-sm leading-[1.45] text-ink-2">{project.tagline}</span>
        <span className="mt-1 truncate font-mono text-xs text-muted">
          {project.repo ? `${project.repo.owner}/${project.repo.name}` : "built-in demo"}
        </span>
        <span className="mt-1">
          <StatusLine status={project.status} simulated={tryMode(project) === "simulated"} />
        </span>
      </span>
    </Link>
  );
}
