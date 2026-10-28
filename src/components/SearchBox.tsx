"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const EXAMPLES = [
  "A tool that removes backgrounds from images",
  "Something that visualizes data",
  "An AI tool for summarizing documents",
  "A tool for creating generative art",
];

export function SearchBox({ initial = "", showExamples = false, size = "lg" }: { initial?: string; showExamples?: boolean; size?: "lg" | "md" }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const go = (query: string) => router.push(`/explore?q=${encodeURIComponent(query.trim())}`);

  return (
    <div className="w-full">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(q);
        }}
        className={`flex items-center gap-2 rounded-full border border-border-strong bg-surface shadow-sm focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15 ${size === "lg" ? "p-2 pl-5" : "p-1.5 pl-4"}`}
      >
        <span aria-hidden className="text-muted">⌕</span>
        <label htmlFor="search" className="sr-only">Describe what you're looking for</label>
        <input
          id="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Describe what you want to do, e.g. “make a chart from my data”"
          className={`min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted ${size === "lg" ? "text-base sm:text-lg" : "text-sm sm:text-base"}`}
          maxLength={200}
        />
        <button type="submit" className={`rounded-full bg-primary font-semibold text-white hover:bg-primary-ink ${size === "lg" ? "px-5 py-2.5" : "px-4 py-2 text-sm"}`}>
          Search
        </button>
      </form>
      {showExamples && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">Try:</span>
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" onClick={() => go(ex)} className="rounded-full border border-border-strong bg-surface px-3 py-1 text-muted hover:border-primary hover:text-ink">
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
