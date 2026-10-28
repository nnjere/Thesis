"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { darkButton } from "./ui/styles";

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
        className="h-10 min-w-0 flex-1 rounded-md border border-border-strong bg-surface px-3 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <button type="submit" className={darkButton()}>Check this project</button>
    </form>
  );
}
