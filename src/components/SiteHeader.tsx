import Link from "next/link";
import { Logo, SignInButton } from "./ui/Logo";

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center justify-between gap-4 px-6 py-5">
      <Logo />
      <div className="flex items-center gap-1">
        <nav aria-label="Main" className="flex items-center text-sm text-muted">
          <Link href="/explore" className="rounded-md px-3 py-2 text-muted no-underline hover:bg-hover hover:text-ink">Explore</Link>
          <Link href="/analyze" className="hidden rounded-md px-3 py-2 text-muted no-underline hover:bg-hover hover:text-ink sm:inline">Check a link</Link>
          <Link href="/how-it-works" className="rounded-md px-3 py-2 text-muted no-underline hover:bg-hover hover:text-ink">How it works</Link>
        </nav>
        <span className="ml-2"><SignInButton /></span>
      </div>
    </header>
  );
}
