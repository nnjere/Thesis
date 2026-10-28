import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SimulatedTag, SourceBadge, StatusBadge } from "@/components/Badges";
import { FocusHeader } from "@/components/FocusHeader";
import { ProjectCard, tryMode } from "@/components/ProjectCard";
import { ProjectPreview } from "@/components/project/ProjectPreview";
import { SiteFooter } from "@/components/SiteFooter";
import { Icon, PlayIcon } from "@/components/ui/Icon";
import { card, cardHover, primaryButton, secondaryButton } from "@/components/ui/styles";
import { IdeaTag, KindTag, OutlineChip } from "@/components/ui/Tag";
import { getProject, listProjects, resolveAlternatives } from "@/lib/catalog";
import { SOURCE_INFO, STATUS_INFO, TYPE_INFO } from "@/lib/catalog/labels";
import type { Project } from "@/lib/catalog/types";
import { getScenario } from "@/lib/workspace";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return listProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const project = getProject((await params).slug);
  return project ? { title: project.name, description: project.tagline } : {};
}

/** owner/repo · licence · language, leaving out anything we don't know. */
function metaLine(project: Project): string {
  const parts = [project.repo ? `${project.repo.owner}/${project.repo.name}` : "built-in demo", project.license, project.language];
  return parts.filter(Boolean).join(" · ");
}

/** The "Sandbox" row of the property list: what happens when you open it here. */
function sandboxLine(project: Project): string {
  if (project.workspace) return getScenario(project.workspace)?.safetyNote ?? "Pretend data — nothing is changed for real";
  switch (project.launch.kind) {
    case "embedded-web-app":
      return "Runs for real in a private frame in your browser";
    case "tool-form":
      return "Runs for real through a simple form";
    case "simulated":
      return "Simulated — nothing from this project runs here yet";
    case "none":
      return "Can't run in a browser";
  }
}

function OpenButtons({ project }: { project: Project }) {
  const mode = tryMode(project);
  const openHref = project.workspace ? `/projects/${project.slug}/workspace` : `/projects/${project.slug}/try`;
  return (
    <div className="mt-1 flex flex-wrap gap-2.5">
      {mode !== "none" && (
        <Link href={openHref} className={primaryButton("lg")}>
          <PlayIcon />
          Open in sandbox
          {mode === "simulated" && !project.workspace && <SimulatedTag />}
        </Link>
      )}
      {mode === "none" && project.downloadUrl && (
        <a href={project.downloadUrl} target="_blank" rel="noopener noreferrer" className={primaryButton("lg")}>
          <Icon name="download" />
          Download for your computer
        </a>
      )}
      {project.repo && (
        <a href={project.repo.url} target="_blank" rel="noopener noreferrer" className={secondaryButton("lg")}>
          <Icon name="code" />
          View source
        </a>
      )}
      {project.homepage && (
        <a href={project.homepage} target="_blank" rel="noopener noreferrer" className={secondaryButton("lg")}>
          <Icon name="external" />
          {project.type === "library" ? "Official site" : "Official version"}
        </a>
      )}
    </div>
  );
}

export default async function ProjectPage({ params }: Params) {
  const project = getProject((await params).slug);
  if (!project) notFound();
  const alternatives = resolveAlternatives(project);
  const scenario = getScenario(project.workspace);
  const mode = tryMode(project);

  return (
    <>
      <FocusHeader crumb={project.name} />
      <main id="main" className="mx-auto w-full max-w-[1120px] flex-1 px-6 pb-20">
        <section className="grid items-center gap-12 py-14" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))" }}>
          <div className="flex flex-col items-start gap-5">
            <KindTag kind={project.kind} />
            <h1 className="font-mono text-[clamp(40px,6vw,60px)] font-medium leading-[1.02] tracking-[-0.03em]">{project.name}</h1>
            <p className="max-w-[480px] text-[19px] leading-normal text-ink-2">{project.description}</p>
            <span className="font-mono text-[13px] text-muted">{metaLine(project)}</span>
            <OpenButtons project={project} />
            {mode === "simulated" && !project.workspace && (
              <p className="max-w-[480px] text-xs text-muted">
                Real sandboxes aren&apos;t connected yet, so opening this shows a labelled simulation. Nothing from the project runs.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[13px] text-muted">Good for</span>
              {project.tags.slice(0, 3).map((t) => (
                <OutlineChip key={t}>{t}</OutlineChip>
              ))}
            </div>
          </div>
          <ProjectPreview project={project} />
        </section>

        {project.source === "sample-listing" && (
          <p className="mb-12 rounded-md border border-dashed border-border-strong bg-surface px-4 py-3 text-sm text-muted">
            <strong className="text-ink">Sample listing.</strong> {SOURCE_INFO["sample-listing"].description}
          </p>
        )}

        {scenario && (
          <section aria-labelledby="ideas" className="flex flex-col gap-5 pb-14">
            <div className="flex flex-col gap-1">
              <h2 id="ideas" className="text-[22px] font-[650] tracking-[-0.01em]">What people are suggesting</h2>
              <p className="text-sm text-muted">Ideas others have tried in their sandbox. Open one to test it yourself.</p>
            </div>
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))" }}>
              {scenario.suggestions.map((s) => (
                <Link
                  key={s.id}
                  href={`/projects/${project.slug}/workspace?suggestion=${s.id}`}
                  className={`flex flex-col gap-2.5 p-[18px] text-ink no-underline hover:text-ink ${card} ${cardHover}`}
                >
                  <IdeaTag>{scenario.ideaTag}</IdeaTag>
                  <span className="text-base font-semibold">{s.title}</span>
                  <span className="text-sm leading-[1.45] text-ink-2">{s.description}</span>
                  <span className="text-[13px] text-muted">Suggested by {s.by} · [EXAMPLE]</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="grid gap-12 border-t border-border py-12" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))" }}>
          <div className="flex flex-col gap-3.5">
            <h2 className="text-[22px] font-[650] tracking-[-0.01em]">What is it?</h2>
            <p className="text-base leading-[1.65]">
              {project.name} is a {TYPE_INFO[project.type].label.toLowerCase()}: {TYPE_INFO[project.type].plain.toLowerCase()}. It&apos;s
              made by {project.creator.name.replace(/ \(built-in demo\)$/, "")}
              {project.license ? <>, and shared under the {project.license} open-source licence, so anyone can read and remix it.</> : "."}
            </p>
            <p className="text-base leading-[1.65]">{project.howToTry}</p>
            <h3 className="mt-3 text-base font-semibold">What you can do with it</h3>
            <ul className="flex flex-col gap-1.5 text-[15px] text-ink-2">
              {project.uses.map((u) => (
                <li key={u} className="flex gap-2">
                  <Icon name="check" size={16} className="mt-1 flex-none text-primary" />
                  {u}
                </li>
              ))}
            </ul>
            <h3 className="mt-3 text-base font-semibold">Things to know</h3>
            <ul className="list-disc space-y-1 pl-5 text-[15px] text-ink-2">
              {project.limitations.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
          <dl className={`grid content-start self-start gap-y-3 p-5 text-sm ${card}`} style={{ gridTemplateColumns: "120px 1fr" }}>
            <dt className="text-muted">Made by</dt>
            <dd>
              {project.creator.url ? (
                <a href={project.creator.url} target="_blank" rel="noopener noreferrer">{project.creator.name}</a>
              ) : (
                project.creator.name
              )}
            </dd>
            <dt className="text-muted">Licence</dt>
            <dd>{project.license ?? (project.source === "built-in-demo" ? "Part of this prototype" : "Not recorded — check the source")}</dd>
            {project.language && (
              <>
                <dt className="text-muted">Written in</dt>
                <dd>{project.language}</dd>
              </>
            )}
            <dt className="text-muted">Source</dt>
            <dd>
              {project.repo ? (
                <a href={project.repo.url} target="_blank" rel="noopener noreferrer" className="font-mono text-[13px]">
                  {project.repo.owner}/{project.repo.name}
                </a>
              ) : (
                <span className="font-mono text-[13px]">built-in demo</span>
              )}
            </dd>
            <dt className="text-muted">Status</dt>
            <dd className="flex flex-col items-start gap-1">
              <StatusBadge status={project.status} />
              <span className="text-xs text-muted">{STATUS_INFO[project.status].description}</span>
            </dd>
            <dt className="text-muted">Listing</dt>
            <dd><SourceBadge source={project.source} /></dd>
            <dt className="text-muted">Sandbox</dt>
            <dd>{sandboxLine(project)}</dd>
          </dl>
        </section>

        {alternatives.length > 0 && (
          <section aria-labelledby="alternatives" className="border-t border-border pt-12">
            <h2 id="alternatives" className="text-[22px] font-[650] tracking-[-0.01em]">You can try instead</h2>
            <div className="mt-5 grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))" }}>
              {alternatives.map((p) => (
                <ProjectCard key={p.slug} project={p} />
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
