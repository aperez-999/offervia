"use client";

export default function BetaBanner() {
  return (
    <div className="mx-auto max-w-3xl px-4">
      <div className="rounded-full border border-border bg-muted/60 px-3 py-2 text-center shadow-sm">
        <p className="text-xs font-medium text-muted-foreground">
          Offervia is currently in free Beta — core tools are free while we continue building Pro features.
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Future Pro features coming soon • Feedback welcome
        </p>
      </div>
    </div>
  );
}
