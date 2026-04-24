"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  ClipboardCopy,
  Link as LinkIcon,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { postJson } from "@/lib/safe-fetch";
import {
  clearJobPacketDraft,
  createEmptyJobPacketDraft,
  hasMeaningfulJobPacketDraft,
  mergeJobPacketDraft,
  readJobPacketDraft,
  type JobPacketDraft,
  type JobPacketScanResult,
  writeJobPacketDraft,
} from "@/lib/job-packet";

const RESUME_JD_LS_KEY = "offervia:resume:jd_v1";
const RESUME_DESIRED_STEP_LS_KEY = "offervia:resume:desiredStep_v1";

type ScanApiResponse = {
  content?: JobPacketScanResult;
  error?: string;
};

const STEP_CONFIG = [
  {
    id: "details",
    number: 1,
    title: "Paste the job once",
    desc: "Add the role details and full job description that will power the whole packet.",
  },
  {
    id: "scan",
    number: 2,
    title: "Run the scan",
    desc: "Surface strengths, gaps, and keyword themes before you tailor anything.",
  },
  {
    id: "resume",
    number: 3,
    title: "Tailor the resume",
    desc: "Carry the same context into Resume Tailor so the upload step is the only thing left.",
  },
  {
    id: "tracker",
    number: 4,
    title: "Track the application",
    desc: "Finish with a prefilled tracker entry and keep your next follow-up visible.",
  },
] as const;

function detectProgress(draft: JobPacketDraft) {
  return {
    details: Boolean(draft.jobDescription.trim()),
    scan: Boolean(draft.scanResult),
    resume: Boolean(draft.tailoredResume.trim()),
    tracker: Boolean(draft.completedAt),
  };
}

function progressPercent(draft: JobPacketDraft) {
  const progress = detectProgress(draft);
  const done = Object.values(progress).filter(Boolean).length;
  return Math.round((done / STEP_CONFIG.length) * 100);
}

export default function JobPacketClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [draft, setDraft] = useState<JobPacketDraft>(createEmptyJobPacketDraft());
  const [hydrated, setHydrated] = useState(false);
  const [loadingScan, setLoadingScan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const existing = readJobPacketDraft();
    if (existing) {
      setDraft(existing);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!hasMeaningfulJobPacketDraft(draft) && !draft.completedAt) {
      clearJobPacketDraft();
      return;
    }
    writeJobPacketDraft(draft);
  }, [draft, hydrated]);

  const progress = useMemo(() => detectProgress(draft), [draft]);
  const pct = useMemo(() => progressPercent(draft), [draft]);
  const canRunScan = draft.jobDescription.trim().length >= 20;
  const trackerDraft = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      company: draft.companyName.trim() || draft.trackerDraft?.company || "",
      position: draft.roleTitle.trim() || draft.trackerDraft?.position || "",
      status: draft.trackerDraft?.status ?? "Applied",
      applied_on: draft.trackerDraft?.applied_on ?? today,
    };
  }, [draft]);

  function updateDraft(updates: Partial<JobPacketDraft>) {
    setDraft((current) => mergeJobPacketDraft(current, updates));
  }

  function copy(text: string, label = "Copied") {
    navigator.clipboard.writeText(text).then(
      () => toast({ title: label }),
      () => toast({ title: "Copy failed", variant: "destructive" })
    );
  }

  async function runScan() {
    const jd = draft.jobDescription.trim();
    if (jd.length < 20 || loadingScan) return;

    setLoadingScan(true);
    setError(null);
    const res = await postJson<ScanApiResponse>("/api/job-scan", { jd });
    setLoadingScan(false);

    if (!res.ok) {
      const message =
        res.status === 429
          ? res.error || "You've hit today's free limit for scans."
          : res.status === 403 && res.error === "PLAN_LIMIT_REACHED"
          ? "You've reached your monthly job scan limit. Upgrade to Pro to continue."
          : res.error || "Scan failed. Try again in a moment.";
      setError(message);
      toast({ title: "Scan failed", description: message, variant: "destructive" });
      return;
    }

    const content = res.data?.content;
    if (!content) {
      const message = "Scan returned an unexpected response.";
      setError(message);
      toast({ title: "Scan failed", description: message, variant: "destructive" });
      return;
    }

    updateDraft({
      scanResult: content,
      currentStep: "resume",
      trackerDraft,
    });
    toast({
      title: "Scan complete",
      description: "Your packet is ready to continue into Resume Tailor with the same job context.",
    });
  }

  function continueToResumeTailor() {
    if (!draft.jobDescription.trim()) {
      toast({
        title: "Add a job description first",
        description: "The packet needs a JD before it can continue into tailoring.",
        variant: "destructive",
      });
      return;
    }

    try {
      localStorage.setItem(RESUME_JD_LS_KEY, draft.jobDescription);
      localStorage.setItem(RESUME_DESIRED_STEP_LS_KEY, "4");
    } catch {
      // noop
    }

    updateDraft({
      currentStep: "resume",
      trackerDraft,
    });
    router.push("/resume?from=job-packet");
  }

  function continueToTracker() {
    if (!trackerDraft.company || !trackerDraft.position) {
      toast({
        title: "Add company and role details",
        description: "The tracker entry needs both a company and a role title.",
        variant: "destructive",
      });
      return;
    }

    updateDraft({
      currentStep: "tracker",
      trackerDraft,
    });

    const params = new URLSearchParams();
    params.set("company", trackerDraft.company);
    params.set("position", trackerDraft.position);
    params.set("status", trackerDraft.status);
    params.set("applied_on", trackerDraft.applied_on);
    params.set("from", "job-packet");
    router.push(`/tracker?${params.toString()}`);
  }

  function resetPacket() {
    clearJobPacketDraft();
    setDraft(createEmptyJobPacketDraft());
    setError(null);
    toast({ title: "Job Packet cleared" });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-4 p-4 sm:space-y-6 sm:p-6"
    >
      <div className="rounded-2xl border border-border bg-card/60 p-4 shadow-sm ring-1 ring-white/5 dark:ring-black/10 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-foreground">
              Flagship workflow
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
              Job Packet
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-foreground/70">
              Paste one job description once, scan it, carry the same context into Resume Tailor,
              then finish with a prefilled tracker entry and a clear next step.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={resetPacket}
              disabled={!hasMeaningfulJobPacketDraft(draft)}
              className="border-border text-foreground hover:bg-foreground/[0.06]"
            >
              Clear packet
            </Button>
            <Button asChild className="bg-indigo-600 text-white hover:bg-indigo-500">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-foreground/60">
            <span>Packet progress</span>
            <span>{pct}% complete</span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>

        {draft.completedAt && (
          <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-foreground">
            This packet already made it into your tracker. Reopen Resume Tailor if you want another pass,
            or start a fresh packet for the next role.
          </div>
        )}
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {STEP_CONFIG.map((step) => {
          const done =
            step.id === "details"
              ? progress.details
              : step.id === "scan"
              ? progress.scan
              : step.id === "resume"
              ? progress.resume
              : progress.tracker;

          return (
            <Card
              key={step.id}
              className="rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="border-border text-foreground/80">
                    Step {step.number}
                  </Badge>
                  {done && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                </div>
                <CardTitle className="text-base text-foreground">{step.title}</CardTitle>
                <CardDescription className="text-foreground/70">{step.desc}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.85fr)]">
        <Card className="rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground">1. Job context</CardTitle>
            <CardDescription className="text-foreground/70">
              The packet stores these details once and reuses them through the rest of the flow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Building2 className="h-4 w-4" />
                  Company name
                </label>
                <Input
                  placeholder="e.g. Stripe"
                  value={draft.companyName}
                  onChange={(event) => updateDraft({ companyName: event.target.value })}
                  className="border-border bg-background/80 text-foreground placeholder:text-foreground/40"
                />
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Briefcase className="h-4 w-4" />
                  Role title
                </label>
                <Input
                  placeholder="e.g. Frontend Engineer"
                  value={draft.roleTitle}
                  onChange={(event) => updateDraft({ roleTitle: event.target.value })}
                  className="border-border bg-background/80 text-foreground placeholder:text-foreground/40"
                />
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <MapPin className="h-4 w-4" />
                  Location
                </label>
                <Input
                  placeholder="e.g. New York, NY (Hybrid)"
                  value={draft.location}
                  onChange={(event) => updateDraft({ location: event.target.value })}
                  className="border-border bg-background/80 text-foreground placeholder:text-foreground/40"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <LinkIcon className="h-4 w-4" />
                  Company / team page
                </label>
                <Input
                  placeholder="https://example.com/team"
                  value={draft.companyUrl}
                  onChange={(event) => updateDraft({ companyUrl: event.target.value })}
                  className="border-border bg-background/80 text-foreground placeholder:text-foreground/40"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Job description</label>
              <Textarea
                value={draft.jobDescription}
                onChange={(event) =>
                  updateDraft({
                    jobDescription: event.target.value,
                    currentStep: event.target.value.trim() ? "scan" : "details",
                  })
                }
                placeholder="Paste the full job description here..."
                className="min-h-[260px] border-border bg-background/80 text-foreground placeholder:text-foreground/40 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
              />
              <div className="text-xs text-foreground/60">
                {draft.jobDescription.length} characters
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => void runScan()}
                disabled={!canRunScan || loadingScan}
                className="bg-indigo-600 text-white hover:bg-indigo-500"
              >
                {loadingScan ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                    Running scan…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Run scan
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={continueToResumeTailor}
                disabled={!canRunScan}
                className="border-border text-foreground hover:bg-foreground/[0.06]"
              >
                Continue to Resume Tailor <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground">2. Scan summary</CardTitle>
              <CardDescription className="text-foreground/70">
                Review the packet scan before you tailor the resume.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Scan unavailable</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {draft.scanResult ? (
                <>
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                      Match score
                    </div>
                    <div className="mt-1 text-3xl font-semibold text-foreground">
                      {draft.scanResult.match_score}%
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                      Strengths
                    </div>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
                      {draft.scanResult.strengths.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                      Missing skills
                    </div>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
                      {draft.scanResult.missing_skills.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                      Summary
                    </div>
                    <p className="mt-2 text-sm text-foreground/80">{draft.scanResult.summary}</p>
                  </div>
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-foreground">
                    Next step: open Resume Tailor to apply these themes to your current resume draft.
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-background/40 p-4 text-sm text-foreground/60">
                  Run the packet scan to surface strengths, gaps, and the themes your tailored resume
                  should emphasize next.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground">3. Resume + tracker handoff</CardTitle>
              <CardDescription className="text-foreground/70">
                The packet carries company, role, location, and JD context into the next tools.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-border bg-background/50 p-3 text-sm text-foreground/80">
                <div className="font-medium text-foreground">
                  {draft.companyName || "Company not added yet"}
                </div>
                <div className="mt-1 text-xs text-foreground/60">
                  {draft.roleTitle || "Role title pending"}
                  {draft.location ? ` • ${draft.location}` : ""}
                </div>
              </div>

              {draft.tailoredResume ? (
                <div className="space-y-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                  <div className="text-sm font-medium text-foreground">
                    Tailored resume ready
                  </div>
                  <p className="line-clamp-5 whitespace-pre-wrap text-xs text-foreground/70">
                    {draft.tailoredResume}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copy(draft.tailoredResume, "Copied tailored resume")}
                      className="border-border text-foreground hover:bg-foreground/[0.06]"
                    >
                      <ClipboardCopy className="mr-2 h-4 w-4" />
                      Copy draft
                    </Button>
                    <Button
                      size="sm"
                      onClick={continueToTracker}
                      className="bg-emerald-600 text-white hover:bg-emerald-500"
                    >
                      Send to tracker
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-background/40 p-4 text-sm text-foreground/60">
                  Resume Tailor will open with this job context already loaded. Upload your resume,
                  generate a draft, then come back here or jump straight into the tracker.
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={continueToResumeTailor}
                  className="bg-indigo-600 text-white hover:bg-indigo-500"
                >
                  {draft.tailoredResume ? "Refine in Resume Tailor" : "Open Resume Tailor"}
                </Button>
                <Button
                  variant="outline"
                  onClick={continueToTracker}
                  disabled={!trackerDraft.company || !trackerDraft.position}
                  className="border-border text-foreground hover:bg-foreground/[0.06]"
                >
                  Open Tracker
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </motion.div>
  );
}
