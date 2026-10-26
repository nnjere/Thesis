"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RepoLinkInput({ initial = "", autoFocus = false }: { initial?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const [url, setUrl] = useState(initial);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (url.trim()) router.push(`/analyze?url=${encodeURIComponent(url.trim())}`);
      }}
      className="flex flex-col gap-2 sm:flex-row"
    >
      <label htmlFor="repo-url" className="sr-only">GitHub project link</label>
      <input
        id="repo-url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://github.com/owner/project"
        autoFocus={autoFocus}
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        maxLength={300}
        className="min-w-0 flex-1 rounded-2xl border border-black/10 bg-white px-4 py-3 font-mono text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
      />
      <button type="submit" className="rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-black">
        Check this project
      </button>
    </form>
  );
}
