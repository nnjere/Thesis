"use client";

import { useState } from "react";
import type { DiagnosticEntry } from "@/lib/sandbox/types";

/**
 * Raw diagnostics, hidden by default. Only fetched if someone opens the
 * disclosure, so the normal experience never shows logs.
 */
export function TechnicalDetails({ sessionId, providerLabel }: { sessionId: string; providerLabel?: string }) {
  const [entries, setEntries] = useState<DiagnosticEntry[] | null>(null);
  const [error, setError] = useState(false);

  return (
    <details
      className="mt-8 rounded-md border border-border bg-surface-sunken px-4 py-3 text-sm"
      onToggle={async (e) => {
        if (!(e.currentTarget as HTMLDetailsElement).open || entries) return;
        try {
          const res = await fetch(`/api/sessions/${sessionId}/diagnostics`, { cache: "no-store" });
          const data = await res.json();
          setEntries(data.diagnostics ?? []);
        } catch {
          setError(true);
        }
      }}
    >
      <summary className="cursor-pointer select-none font-medium text-muted">Technical details (for developers)</summary>
      <div className="mt-3 space-y-2">
        {providerLabel && <p className="text-muted">Runner: {providerLabel}</p>}
        {error && <p className="text-muted">Couldn&apos;t load the details.</p>}
        {!entries && !error && <p className="text-muted">Loading…</p>}
        {entries && (
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-ink p-3 font-mono text-xs leading-relaxed text-white/85">
            {entries.map((d) => `${d.at.slice(11, 19)} ${d.level.toUpperCase().padEnd(5)} ${d.message}`).join("\n") || "(no entries)"}
          </pre>
        )}
      </div>
    </details>
  );
}
