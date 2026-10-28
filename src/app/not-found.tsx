import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 pt-20 text-center">
      <p className="text-5xl" aria-hidden>🧭</p>
      <h1 className="mt-4 text-2xl font-bold">We couldn&apos;t find that page</h1>
      <p className="mt-2 text-muted">It may have moved, or the link might be mistyped.</p>
      <Link href="/explore" className="mt-6 inline-block rounded-md bg-primary px-5 py-3 font-semibold text-white">Explore projects</Link>
    </div>
  );
}
