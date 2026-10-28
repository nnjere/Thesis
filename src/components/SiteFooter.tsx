import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm text-muted sm:grid-cols-[2fr_1fr] sm:px-6">
        <div className="space-y-2">
          <p className="font-semibold text-ink">About this prototype</p>
          <p>
            Projects marked <strong>Built-in demo</strong> really run here. Projects marked <strong>Sample listing</strong> describe
            real open-source projects, but nothing from them has been downloaded or run, and their “Try it” is a clearly labelled
            simulation. We only ever read public information from GitHub. We never change, copy back to, or trigger anything in the
            original projects.
          </p>
        </div>
        <div className="space-y-2">
          <p className="font-semibold text-ink">Learn more</p>
          <ul className="space-y-1">
            <li><Link className="hover:text-ink" href="/how-it-works">How it works &amp; what&apos;s real</Link></li>
            <li><Link className="hover:text-ink" href="/how-it-works#statuses">What the labels mean</Link></li>
            <li><Link className="hover:text-ink" href="/how-it-works#safety">Safety &amp; respecting projects</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
