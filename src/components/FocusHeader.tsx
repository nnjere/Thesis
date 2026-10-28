import Link from "next/link";
import { Logo, SignInButton } from "./ui/Logo";

/** Header for the project page: logo, breadcrumb, then presence/cursor controls and Sign in. */
export function FocusHeader({ crumb, children }: { crumb: string; children?: React.ReactNode }) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-x-5 gap-y-3 px-6 py-3.5">
        <Logo />
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted">
          <Link href="/explore" className="text-muted no-underline">Explore</Link>
          <span aria-hidden>/</span>
          <span aria-current="page" className="font-medium text-ink">{crumb}</span>
        </nav>
        <div className="flex-1" />
        {children}
        <SignInButton />
      </div>
    </header>
  );
}
