import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm ring-1 ring-white/5 dark:ring-black/10">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
          <span aria-hidden className="h-3.5 w-1 rounded-full bg-primary/70" />
          404
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Page not found</h1>
        <p className="mt-2 text-sm text-foreground/70">
          The page you’re looking for doesn’t exist or was moved.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex rounded-md bg-primary-button px-4 py-2 text-sm font-medium text-white hover:bg-primary-button/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
          >
            Go back home
          </Link>
        </div>
      </div>
    </main>
  );
}