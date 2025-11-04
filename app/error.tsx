"use client";

import { useEffect } from "react";
import ErrorView from "@/components/ErrorView";
import { useToast } from "@/hooks/use-toast";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { toast } = useToast();

  useEffect(() => {
    console.error(error);
    toast({
      title: "Something went wrong",
      description: "Please try again.",
      variant: "destructive",
    });
  }, [error, toast]);

  const details =
    (error?.message ?? "Unknown error") +
    (error?.digest ? `\nDigest: ${error.digest}` : "");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <ErrorView
        title="We hit a snag"
        description="This page failed to load. Try again. If it keeps happening, please contact us."
        onRetry={reset}
        supportHref="/contact"
        errorMessage={details}
      />
    </div>
  );
}