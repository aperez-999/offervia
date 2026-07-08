"use client";

import { TriangleAlert, RotateCcw, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as React from "react";

type Props = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  supportHref?: string;          
  errorMessage?: string;         
};

export default function ErrorView({
  title = "Something went wrong",
  description = "An unexpected error occurred. You can try again. If the issue persists, contact support.",
  onRetry,
  supportHref = "/contact",
  errorMessage,
}: Props) {
  const [copied, setCopied] = React.useState(false);

  async function copyDetails() {
    try {
      await navigator.clipboard.writeText(errorMessage || "No details available.");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <Card className="rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-foreground/5 p-2">
            <TriangleAlert className="h-5 w-5 text-primary " />
          </div>
          <div>
            <CardTitle className="text-foreground">{title}</CardTitle>
            <CardDescription className="text-foreground/70">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {errorMessage ? (
          <details className="group">
            <summary className="cursor-pointer text-sm text-foreground/70 hover:text-foreground">
              Technical details
            </summary>
            <pre className="mt-2 max-h-48 overflow-auto rounded-md border border-border bg-background/60 p-3 text-xs text-foreground/80">
{errorMessage}
            </pre>
          </details>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {onRetry && (
            <Button
              onClick={onRetry}
              className="bg-primary-button text-white hover:bg-primary-button/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Try again
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={copyDetails}
            className="border-border text-foreground hover:bg-foreground/[0.06]"
          >
            <ClipboardList className="mr-2 h-4 w-4" />
            {copied ? "Copied" : "Copy details"}
          </Button>
          <a
            href={supportHref}
            className="text-sm text-primary underline decoration-primary/50 underline-offset-4 hover:decoration-primary "
          >
            Contact support
          </a>
        </div>
      </CardContent>
    </Card>
  );
}