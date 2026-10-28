import type { Metadata } from "next";
import Link from "next/link";
import { ProjectCard } from "@/components/ProjectCard";
import { SearchBox } from "@/components/SearchBox";
import { CATEGORIES, getCategory, getSearchProvider, isCategoryId, type ProjectType } from "@/lib/catalog";
import { TYPE_INFO } from "@/lib/catalog/labels";

export const metadata: Metadata = { title: "Explore" };

const TYPES: ProjectType[] = ["web-app", "cli-tool", "desktop-app", "library"];

type Search = { q?: string; category?: string; type?: string; runnable?: string };

function hrefWith(current: Search, patch: Partial<Search>): string {
  const next = { ...current, ...patch };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) if (v) params.set(k, v);
  const s = params.toString();
  return s ? `/explore?${s}` : "/explore";
}

export default async function ExplorePage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").slice(0, 200);
  const category = isCategoryId(sp.category) ? sp.category : undefined;
  const type = TYPES.includes(sp.type as ProjectType) ? (sp.type as ProjectType) : undefined;
  const runnableOnly = sp.runnable === "1";
  const current: Search = { q: q || undefined, category, type, runnable: runnableOnly ? "1" : undefined };

  const result = await getSearchProvider().search(q, { category, type, runnableOnly });
  const heading = q ? `Results for “${q}”` : category ? getCategory(category).label : "All projects";

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-sm font-medium transition ${active ? "border-primary bg-primary text-white" : "border-border-strong bg-surface text-muted hover:border-primary hover:text-ink"}`;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <div className="max-w-2xl">
        <SearchBox initial={q} size="md" />
      </div>

      <div className="mt-6 space-y-3" aria-label="Filters">
        <div className="flex flex-wrap gap-2">
          <Link href={hrefWith(current, { category: undefined })} className={chip(!category)}>All topics</Link>
          {CATEGORIES.map((c) => (
            <Link key={c.id} href={hrefWith(current, { category: c.id })} className={chip(category === c.id)}>
              <span aria-hidden>{c.icon}</span> {c.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={hrefWith(current, { runnable: runnableOnly ? undefined : "1" })} className={chip(runnableOnly)} aria-pressed={runnableOnly}>
            {runnableOnly ? "✓ " : ""}Can try here for real
          </Link>
          <span className="mx-1 h-5 w-px bg-hover" aria-hidden />
          <Link href={hrefWith(current, { type: undefined })} className={chip(!type)}>Any kind</Link>
          {TYPES.map((t) => (
            <Link key={t} href={hrefWith(current, { type: t })} className={chip(type === t)} title={TYPE_INFO[t].plain}>
              {TYPE_INFO[t].icon} {TYPE_INFO[t].label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
        <p className="text-sm text-muted">
          {result.hits.length} {result.hits.length === 1 ? "project" : "projects"} · keyword search over our local catalog
        </p>
      </div>

      {q && result.hits.length > 0 && result.approximate && (
        <p className="mt-4 rounded-md border border-border bg-note-bg px-4 py-3 text-sm text-note-ink" role="status">
          We didn&apos;t find a project that does exactly that. These are the closest matches in our catalog, so check the
          descriptions carefully.
        </p>
      )}

      {result.hits.length === 0 ? (
        <div className="mt-10 rounded-card border border-dashed border-border-strong bg-surface p-10 text-center">
          <p className="text-lg font-semibold">Nothing in our catalog matches that yet.</p>
          <p className="mt-2 text-muted">
            Try different words, remove a filter, or{" "}
            <Link href="/analyze" className="font-semibold text-primary hover:underline">paste a GitHub link</Link> if you already have a
            project in mind.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {result.hits.map((h) => (
            <ProjectCard key={h.project.slug} project={h.project} />
          ))}
        </div>
      )}
    </div>
  );
}
