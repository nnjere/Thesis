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

function Pill({ href, active, children, title }: { href: string; active: boolean; children: React.ReactNode; title?: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      title={title}
      className={`inline-flex h-9 items-center rounded-full px-3.5 text-[13px] font-medium no-underline ${
        active ? "bg-ink text-white hover:text-white" : "text-muted hover:bg-hover hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
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

  return (
    <div className="mx-auto max-w-[1120px] px-6 pt-6">
      <div className="max-w-[560px]">
        <SearchBox initial={q} />
      </div>

      <div className="mt-6 flex flex-col gap-2" aria-label="Filters">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Topic">
          <Pill href={hrefWith(current, { category: undefined })} active={!category}>All topics</Pill>
          {CATEGORIES.map((c) => (
            <Pill key={c.id} href={hrefWith(current, { category: c.id })} active={category === c.id}>{c.label}</Pill>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Kind of project">
          <Pill href={hrefWith(current, { runnable: runnableOnly ? undefined : "1" })} active={runnableOnly}>
            {runnableOnly ? "✓ " : ""}Can try here for real
          </Pill>
          <span className="mx-1 h-5 w-px bg-border" aria-hidden />
          <Pill href={hrefWith(current, { type: undefined })} active={!type}>Any kind</Pill>
          {TYPES.map((t) => (
            <Pill key={t} href={hrefWith(current, { type: t })} active={type === t} title={TYPE_INFO[t].plain}>{TYPE_INFO[t].label}</Pill>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[22px] font-[650] tracking-[-0.01em]">{heading}</h1>
        <p className="text-[13px] text-muted">
          {result.hits.length} {result.hits.length === 1 ? "project" : "projects"} · keyword search over our local catalog
        </p>
      </div>

      {q && result.hits.length > 0 && result.approximate && (
        <p className="mt-4 rounded-md bg-note-bg px-4 py-3 text-sm text-note-ink" role="status">
          We didn&apos;t find a project that does exactly that. These are the closest matches in our catalog, so check the
          descriptions carefully.
        </p>
      )}

      {result.hits.length === 0 ? (
        <div className="mt-8 rounded-card border border-dashed border-border-strong bg-surface p-10 text-center">
          <p className="text-base font-semibold">Nothing in our catalog matches that yet.</p>
          <p className="mt-2 text-sm text-muted">
            Try different words, remove a filter, or <Link href="/analyze" className="font-medium">paste a GitHub link</Link> if you
            already have a project in mind.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))" }}>
          {result.hits.map((h) => (
            <ProjectCard key={h.project.slug} project={h.project} />
          ))}
        </div>
      )}
    </div>
  );
}
