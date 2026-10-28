import Link from "next/link";
import { TrendingGrid } from "@/components/gallery/TrendingGrid";
import { SearchBox } from "@/components/SearchBox";
import { popularProjects } from "@/lib/catalog";

export default function GalleryPage() {
  const projects = popularProjects(12);
  return (
    <div className="mx-auto max-w-[1120px] px-6 pb-20">
      <section className="flex flex-col items-center gap-4 pb-12 pt-14 text-center">
        <h1 className="font-mono text-[clamp(32px,5vw,48px)] font-medium leading-[1.1] tracking-[-0.025em]">Find Your Next Experiment</h1>
        <p className="max-w-[520px] text-[17px] leading-normal text-muted">
          Pick a project and try it with your own files, right in your browser.
        </p>
        <div className="mt-3 w-full max-w-[560px]">
          <SearchBox showExamples />
        </div>
        <p className="text-[13px] text-muted">
          Found something on GitHub?{" "}
          <Link href="/analyze" className="font-medium text-ink-2">Check a link</Link>
        </p>
      </section>
      <TrendingGrid projects={projects} />
      <p className="mt-8 text-center text-sm">
        <Link href="/explore" className="font-medium">See all projects →</Link>
      </p>
    </div>
  );
}
