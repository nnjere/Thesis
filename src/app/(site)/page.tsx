import Link from "next/link";
import { ProjectCard } from "@/components/ProjectCard";
import { RepoLinkInput } from "@/components/RepoLinkInput";
import { SearchBox } from "@/components/SearchBox";
import { StatusBadge } from "@/components/Badges";
import { CATEGORIES, featuredProjects, isTryableHere, listProjects, popularProjects, recentProjects } from "@/lib/catalog";

export default function HomePage() {
  const all = listProjects();
  const tryNow = all.filter(isTryableHere);
  const shown = new Set(tryNow.slice(0, 3).map((p) => p.slug));
  const featured = featuredProjects().filter((p) => !shown.has(p.slug));
  const recent = recentProjects(4);
  const popular = popularProjects(4);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-100 via-fuchsia-100 to-amber-50 blur-3xl" />
        </div>
        <div className="mx-auto max-w-4xl px-4 pb-12 pt-16 text-center sm:px-6 sm:pt-24">
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
            Explore open source.
            <br />
            <span className="text-primary">No setup required.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-muted">
            Discover useful tools, creative experiments, and emerging technologies. Try them directly in your browser, without
            wrestling with code.
          </p>
          <div className="mx-auto mt-8 max-w-2xl text-left">
            <SearchBox showExamples />
          </div>
          <p className="mt-4 text-xs text-muted">
            Search uses simple keyword matching over our catalog of {all.length} projects. It isn&apos;t AI.
          </p>
        </div>
      </section>

      {/* Discover → Understand → Try → Explore */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <ol className="grid gap-3 sm:grid-cols-4">
          {[
            ["Discover", "Search in plain words or browse by topic."],
            ["Understand", "Read what a project does, without jargon."],
            ["Try", "Press “Try it” and we handle the setup."],
            ["Explore", "Go deeper on GitHub when you're ready."],
          ].map(([title, body], i) => (
            <li key={title} className="rounded-md border border-border bg-surface p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Step {i + 1}</p>
              <p className="mt-1 font-semibold">{title}</p>
              <p className="text-sm text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Try right now */}
      <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6" aria-labelledby="try-now">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="try-now" className="text-2xl font-bold tracking-tight">Try right now</h2>
            <p className="mt-1 text-muted">
              These run for real, in your browser. <StatusBadge status="verified" /> means we&apos;ve tested them here.
            </p>
          </div>
          <Link href="/explore?runnable=1" className="text-sm font-semibold text-primary hover:underline">See all you can try →</Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tryNow.slice(0, 3).map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6" aria-labelledby="categories">
        <h2 id="categories" className="text-2xl font-bold tracking-tight">Browse by topic</h2>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.map((c) => {
            const count = all.filter((p) => p.category === c.id).length;
            return (
              <li key={c.id}>
                <Link
                  href={`/explore?category=${c.id}`}
                  className="flex h-full flex-col gap-1 rounded-md border border-border bg-surface p-4 transition hover:border-primary hover:shadow-md"
                >
                  <span aria-hidden className="text-2xl">{c.icon}</span>
                  <span className="font-semibold leading-tight">{c.label}</span>
                  <span className="text-sm text-muted">{c.blurb} · {count}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Featured */}
      <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6" aria-labelledby="featured">
        <h2 id="featured" className="text-2xl font-bold tracking-tight">Featured projects</h2>
        <p className="mt-1 text-muted">Well-known open-source projects, explained in plain English.</p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      </section>

      {/* Recent & popular */}
      <section className="mx-auto mt-16 grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2">
        {[
          { id: "recent", title: "Recently added", items: recent },
          { id: "popular", title: "Popular", items: popular, note: "Ranked by sample data, not real usage." },
        ].map((col) => (
          <div key={col.id} aria-labelledby={col.id}>
            <h2 id={col.id} className="text-xl font-bold tracking-tight">{col.title}</h2>
            {col.note && <p className="text-xs text-muted">{col.note}</p>}
            <ul className="mt-4 divide-y divide-border rounded-md border border-border bg-surface">
              {col.items.map((p) => (
                <li key={p.slug}>
                  <Link href={`/projects/${p.slug}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-ink-2/[0.02]">
                    <span>
                      <span className="font-semibold">{p.name}</span>
                      <span className="block text-sm text-muted">{p.tagline}</span>
                    </span>
                    <StatusBadge status={p.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Paste a link */}
      <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6" aria-labelledby="paste">
        <div className="rounded-card bg-ink p-6 text-white sm:p-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <h2 id="paste" className="text-2xl font-bold tracking-tight">Found something on GitHub?</h2>
              <p className="mt-2 text-white/75">
                Paste its link and we&apos;ll explain what kind of project it is and whether it can be tried online. We only read its
                public information. Nothing is downloaded or run.
              </p>
            </div>
            <div className="rounded-md bg-surface p-3 text-ink">
              <RepoLinkInput />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
