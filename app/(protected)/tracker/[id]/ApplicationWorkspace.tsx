"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  FileText,
  Loader2,
  PenLine,
  Printer,
  Save,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { patchJson, deleteJson } from "@/lib/safe-fetch";
import { printAsPdf } from "@/lib/print-pdf";
import { TRACKER_STATUS_OPTIONS } from "@/lib/tracker/utils";

export type WorkspaceApp = {
  id: string;
  company: string;
  position: string;
  status: string;
  applied_on: string;
  follow_up_date: string;
  notes: string;
};

export type WorkspaceDoc = {
  id: string;
  kind: "cover_letter" | "resume";
  title: string;
  content: string;
  created_at: string;
};

export type WorkspaceScan = {
  id: string;
  title: string | null;
  match_score: number | null;
  missing_skills: string[] | null;
  strengths: string[] | null;
  summary: string | null;
  created_at: string;
};

function toDateInput(value: string) {
  if (!value) return "";
  return value.slice(0, 10);
}

export default function ApplicationWorkspace({
  app,
  documents,
  scans,
}: {
  app: WorkspaceApp;
  documents: WorkspaceDoc[];
  scans: WorkspaceScan[];
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [company, setCompany] = useState(app.company);
  const [position, setPosition] = useState(app.position);
  const [status, setStatus] = useState(app.status || "Applied");
  const [appliedOn, setAppliedOn] = useState(toDateInput(app.applied_on));
  const [followUp, setFollowUp] = useState(toDateInput(app.follow_up_date));
  const [notes, setNotes] = useState(app.notes || "");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const dirty =
    company !== app.company ||
    position !== app.position ||
    status !== (app.status || "Applied") ||
    appliedOn !== toDateInput(app.applied_on) ||
    followUp !== toDateInput(app.follow_up_date) ||
    notes !== (app.notes || "");

  const save = useCallback(async () => {
    if (!company.trim()) {
      toast({ title: "Company is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload: Record<string, string> = {
      company: company.trim(),
      position: position.trim(),
      status,
      notes,
    };
    if (appliedOn) payload.applied_on = appliedOn;
    if (followUp) payload.follow_up_date = followUp;

    const res = await patchJson(`/api/tracker?id=${encodeURIComponent(app.id)}`, payload);
    setSaving(false);
    if (!res.ok) {
      toast({
        title: "Could not save",
        description: res.error || "Try again.",
        variant: "destructive",
      });
      return;
    }
    toast({ variant: "success", title: "Saved" });
    router.refresh();
  }, [app.id, company, position, status, appliedOn, followUp, notes, toast, router]);

  const remove = useCallback(async () => {
    setDeleting(true);
    const res = await deleteJson(`/api/tracker?id=${encodeURIComponent(app.id)}`);
    if (!res.ok) {
      setDeleting(false);
      setConfirmOpen(false);
      toast({ title: "Could not delete", variant: "destructive" });
      return;
    }
    toast({ variant: "success", title: "Application deleted" });
    router.push("/tracker");
  }, [app.id, toast, router]);

  const copyDoc = useCallback(
    (content: string) => {
      navigator.clipboard.writeText(content).then(
        () => toast({ variant: "success", title: "Copied to clipboard" }),
        () => toast({ title: "Copy failed", variant: "destructive" }),
      );
    },
    [toast],
  );

  const roleQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (position.trim()) params.set("role", position.trim());
    if (company.trim()) params.set("company", company.trim());
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [position, company]);

  const bestScan = scans[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="text-foreground/70">
          <Link href="/tracker">
            <ArrowLeft className="size-4" /> Back to tracker
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirmOpen(true)}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" /> Delete
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: details form */}
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-border bg-card/70 p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Application details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="ws-company" className="mb-1.5 block text-sm font-medium text-foreground">
                  Company
                </label>
                <Input
                  id="ws-company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Inc."
                />
              </div>
              <div>
                <label htmlFor="ws-position" className="mb-1.5 block text-sm font-medium text-foreground">
                  Position
                </label>
                <Input
                  id="ws-position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Senior Product Designer"
                />
              </div>
            </div>

            <div className="mt-4">
              <span className="mb-2 block text-sm font-medium text-foreground">Status</span>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Status">
                {TRACKER_STATUS_OPTIONS.map((s) => {
                  const active = status === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setStatus(s)}
                      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                        active
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border bg-background/50 text-foreground/70 hover:bg-foreground/[0.04]"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="ws-applied" className="mb-1.5 block text-sm font-medium text-foreground">
                  Applied on
                </label>
                <Input
                  id="ws-applied"
                  type="date"
                  value={appliedOn}
                  onChange={(e) => setAppliedOn(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="ws-followup" className="mb-1.5 block text-sm font-medium text-foreground">
                  Follow-up date
                </label>
                <Input
                  id="ws-followup"
                  type="date"
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="ws-notes" className="mb-1.5 block text-sm font-medium text-foreground">
                Notes
              </label>
              <Textarea
                id="ws-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Recruiter name, interview stages, links, anything worth remembering…"
                className="min-h-[120px] resize-y"
              />
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Button onClick={save} disabled={!dirty || saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Save changes
              </Button>
              {dirty ? (
                <span className="text-xs text-foreground/50">Unsaved changes</span>
              ) : null}
            </div>
          </section>

          {/* Related documents */}
          <section className="rounded-2xl border border-border bg-card/70 p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Related documents</h2>
              <Button asChild variant="ghost" size="sm" className="text-foreground/60">
                <Link href="/documents">All documents</Link>
              </Button>
            </div>
            {documents.length === 0 ? (
              <p className="text-sm text-foreground/55">
                No documents matched this role yet. Generate one below and it will show up here.
              </p>
            ) : (
              <ul className="space-y-2">
                {documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-background/50 p-3"
                  >
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-lg ${
                        doc.kind === "cover_letter"
                          ? "bg-primary/10 text-primary"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {doc.kind === "cover_letter" ? (
                        <PenLine className="size-4" />
                      ) : (
                        <FileText className="size-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {doc.title}
                      </span>
                      <span className="block text-xs text-foreground/50">
                        {doc.kind === "cover_letter" ? "Cover Letter" : "Resume"}
                      </span>
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => copyDoc(doc.content)}>
                      <Copy className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => printAsPdf(doc.title, doc.content)}
                    >
                      <Printer className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Right: insights + actions */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card/70 p-6 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Generate for this role</h2>
            <div className="flex flex-col gap-2">
              <Button asChild variant="outline" className="justify-start">
                <Link href={`/resume${roleQuery}`}>
                  <FileText className="size-4" /> Tailor a resume
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href={`/cover-letter${roleQuery}`}>
                  <PenLine className="size-4" /> Write a cover letter
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href={`/scanner${roleQuery}`}>
                  <Target className="size-4" /> Scan against the job
                </Link>
              </Button>
            </div>
          </section>

          {bestScan ? (
            <section className="rounded-2xl border border-border bg-card/70 p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Latest scan match</h2>
              </div>
              {typeof bestScan.match_score === "number" ? (
                <div className="mb-3 flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold text-foreground">{bestScan.match_score}</span>
                  <span className="text-sm text-foreground/50">/ 100 match</span>
                </div>
              ) : null}
              {bestScan.missing_skills && bestScan.missing_skills.length > 0 ? (
                <div className="mt-3">
                  <p className="mb-1.5 text-xs font-medium text-foreground/70">Skills to add</p>
                  <div className="flex flex-wrap gap-1.5">
                    {bestScan.missing_skills.slice(0, 8).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-400"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete application?</DialogTitle>
            <DialogDescription>
              This removes {company || "this application"} from your tracker. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={remove} disabled={deleting}>
              {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
