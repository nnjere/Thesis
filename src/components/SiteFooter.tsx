import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-2 px-6 py-5 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          Sandbox runs open-source projects in private sandboxes. Credit always goes to the makers. Nothing you do here can break the
          original project.
        </p>
        <nav aria-label="Footer" className="flex gap-4">
          <Link href="/how-it-works" className="text-muted">What&apos;s real</Link>
          <Link href="/how-it-works#safety" className="text-muted">Safety</Link>
        </nav>
      </div>
    </footer>
  );
}
