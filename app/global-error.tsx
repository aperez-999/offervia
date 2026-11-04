"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import ErrorView from "@/components/ErrorView";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  const details =
    (error?.message ?? "Unknown error") +
    (error?.digest ? `\nDigest: ${error.digest}` : "");

  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <ErrorView
            title="Offervia hit an error"
            description="Try again. If it keeps happening, contact support and include the details below."
            onRetry={reset}
            supportHref="/contact"
            errorMessage={details}
          />
        </div>
      </body>
    </html>
  );
}
