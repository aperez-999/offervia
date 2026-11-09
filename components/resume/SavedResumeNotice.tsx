import Link from "next/link";
import { FileText } from "@phosphor-icons/react/dist/ssr";

/** Shown in a tool when it's using the account's saved resume. */
export function SavedResumeNotice({ onUseDifferent }: { onUseDifferent: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background/60 p-3">
      <span className="flex items-center gap-2 text-sm text-foreground">
        <FileText className="size-4 shrink-0 text-primary" weight="duotone" aria-hidden />
        Using <span className="font-semibold">My resume</span>
      </span>
      <span className="flex items-center gap-3 text-xs">
        <Link
          href="/profile#my-resume"
          className="rounded font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Edit
        </Link>
        <button
          type="button"
          onClick={onUseDifferent}
          className="rounded font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Use a different one for this job
        </button>
      </span>
    </div>
  );
}

/** Nudge shown under a resume input when nothing is saved yet. */
export function SaveResumeHint() {
  return (
    <p className="mt-1.5 text-xs text-muted-foreground">
      Tired of pasting it?{" "}
      <Link href="/profile#my-resume" className="font-medium text-primary underline-offset-4 hover:underline">
        Save My resume
      </Link>{" "}
      once and every tool starts from it.
    </p>
  );
}
