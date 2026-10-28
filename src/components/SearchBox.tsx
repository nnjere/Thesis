"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "./ui/Icon";

const EXAMPLES = ["Remove backgrounds from images", "Visualize data", "Summarize documents", "Make generative art"];

export function SearchBox({ initial = "", showExamples = false }: { initial?: string; showExamples?: boolean; size?: "lg" | "md" }) {
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
      >
        <label htmlFor="q" className="sr-only">What do you want to do?</label>
        <div className="flex h-[52px] items-center gap-2.5 rounded-card border border-border-strong bg-surface px-[18px] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <Icon name="search" size={18} className="flex-none text-muted" />
          <input
            id="q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="What do you want to do?"
            maxLength={200}
            className="min-w-0 flex-auto border-0 bg-transparent text-base text-ink outline-none placeholder:text-muted"
          />
        </div>
      </form>
      {showExamples && (
        <p className="mt-3 flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-[13px] text-muted">
          <span>For example:</span>
          {EXAMPLES.map((ex, i) => (
            <span key={ex}>
              <button type="button" onClick={() => go(ex)} className="cursor-pointer rounded-sm px-1 text-ink-2 underline decoration-border-strong underline-offset-4 hover:text-primary">
                {ex}
              </button>
              {i < EXAMPLES.length - 1 && <span aria-hidden>·</span>}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
