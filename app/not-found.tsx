import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
          <span aria-hidden className="h-3.5 w-1 rounded-full bg-primary/70" />
          404
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Page not found</h1>
        <p className="mt-2 text-sm text-foreground/70">
          This page doesn’t exist, or it moved. Check the URL or go back to the home page.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex rounded-md bg-primary-button px-4 py-2 text-sm font-medium text-primary-button-foreground hover:bg-primary-button/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
          >
            Go to home page
          </Link>
        </div>
      </div>
    </main>
  );
}