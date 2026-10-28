import Link from "next/link";
import { Icon } from "./Icon";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 text-ink no-underline hover:text-ink">
      <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-brand text-white">
        <Icon name="cube" size={16} />
      </span>
      <span className="text-base font-[650]">Sandbox</span>
    </Link>
  );
}

/** No accounts exist yet; the button stays visible (per the design) but explains itself. */
export function SignInButton() {
  return (
    <button
      type="button"
      aria-disabled="true"
      title="Accounts aren't available in this prototype yet"
      className="inline-flex h-10 items-center rounded-md border border-border-strong bg-surface px-4 text-sm font-medium text-ink hover:bg-hover"
    >
      Sign in
    </button>
  );
}
