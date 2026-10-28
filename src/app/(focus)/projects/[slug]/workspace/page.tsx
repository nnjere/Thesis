import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PresenceControls, RemoteCursorLayer, YouCursor } from "@/components/presence/PresenceControls";
import { PresenceRoot } from "@/components/presence/PresenceRoot";
import { Workspace } from "@/components/workspace/Workspace";
import { getProject } from "@/lib/catalog";
import { getScenario } from "@/lib/workspace";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ suggestion?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = getProject((await params).slug);
  const scenario = getScenario(project?.workspace);
  return scenario && project ? { title: `${scenario.title} · ${project.name}` } : {};
}

export default async function WorkspacePage({ params, searchParams }: Props) {
  const project = getProject((await params).slug);
  const scenario = getScenario(project?.workspace);
  if (!project || !project.repo || !scenario) notFound();
  const { suggestion } = await searchParams;

  return (
    <PresenceRoot room={{ kind: "workspace", bubble: scenario.demoChat?.workspace }}>
      <Workspace
        // Re-mount when the suggestion changes so its preset loads.
        key={suggestion ?? "draft"}
        project={{ slug: project.slug, name: project.name, repo: `${project.repo.owner}/${project.repo.name}`, license: project.license }}
        scenario={scenario}
        suggestionId={typeof suggestion === "string" ? suggestion : null}
        headerExtras={<PresenceControls variant="workspace" />}
        editingCursor={<YouCursor />}
        canvasOverlay={<RemoteCursorLayer variant="workspace" />}
      />
    </PresenceRoot>
  );
}
