"use client";

import { useState } from "react";
import { ProjectCard } from "@/components/ProjectCard";
import { FilterPill } from "@/components/ui/FilterPill";
import { KIND_INFO, KIND_ORDER } from "@/lib/catalog/labels";
import type { Project, ProjectKind } from "@/lib/catalog/types";

export function TrendingGrid({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<ProjectKind | "all">("all");
  const kinds = KIND_ORDER.filter((k) => projects.some((p) => p.kind === k));
  const shown = filter === "all" ? projects : projects.filter((p) => p.kind === filter);

  return (
    <section aria-labelledby="trending" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 id="trending" className="text-xl font-[650] tracking-[-0.01em]">Trending</h2>
          <p className="text-xs text-muted">Ordered by sample data, not real usage.</p>
        </div>
        <div role="group" aria-label="Filter by type" className="flex flex-wrap gap-1">
          <FilterPill active={filter === "all"} onClick={() => setFilter("all")}>All</FilterPill>
          {kinds.map((k) => (
            <FilterPill key={k} active={filter === k} onClick={() => setFilter(k)}>
              {KIND_INFO[k].filter}
            </FilterPill>
          ))}
        </div>
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))" }}>
        {shown.map((p) => (
          <ProjectCard key={p.slug} project={p} />
        ))}
      </div>
    </section>
  );
}
