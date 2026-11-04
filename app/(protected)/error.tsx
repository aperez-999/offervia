"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import ErrorView from "@/components/ErrorView";
import { useToast } from "@/hooks/use-toast";

export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { toast } = useToast();

  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
    toast({
      title: "This page didn't load",
      description: "Try again in a moment.",
      variant: "destructive",
    });
  }, [error, toast]);

  const details =
    (error?.message ?? "Unknown error") +
    (error?.digest ? `\nDigest: ${error.digest}` : "");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <ErrorView
        title="This page didn't load"
        description="Try again. If it keeps happening, contact support and include the details below."
        onRetry={reset}
        supportHref="/contact"
        errorMessage={details}
      />
    </div>
  );
}
