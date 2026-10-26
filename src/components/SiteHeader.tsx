import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-xl bg-brand-600 text-white">◌</span>
          <span className="text-lg">Openly</span>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
            Prototype
          </span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 text-sm font-medium text-muted">
          <Link href="/explore" className="rounded-full px-3 py-2 hover:bg-black/5 hover:text-ink">Explore</Link>
          <Link href="/analyze" className="hidden rounded-full px-3 py-2 hover:bg-black/5 hover:text-ink sm:inline">Check a link</Link>
          <Link href="/how-it-works" className="rounded-full px-3 py-2 hover:bg-black/5 hover:text-ink">How it works</Link>
        </nav>
      </div>
    </header>
  );
}
