import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Icon } from "@/components/ui/Icon";
import { primaryButton } from "@/components/ui/styles";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto flex max-w-xl flex-1 flex-col items-center px-6 pt-20 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-card bg-hover text-ink-2">
          <Icon name="search" size={22} />
        </span>
        <h1 className="mt-4 text-[22px] font-[650]">We couldn&apos;t find that page</h1>
        <p className="mt-2 text-muted">It may have moved, or the link might be mistyped.</p>
        <Link href="/explore" className={`mt-6 ${primaryButton()}`}>Explore projects</Link>
      </main>
      <SiteFooter />
    </>
  );
}
