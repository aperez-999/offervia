// app/(protected)/scanner/page.tsx
"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  ClipboardCopy,
  Download,
  History,
  Trash2,
  Search as SearchIcon,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { postJson } from "@/lib/safe-fetch";
import { getBrowserSupabase } from "@/lib/supabase/client";
import {
  hasMeaningfulJobPacketDraft,
  readJobPacketDraft,
  updateJobPacketDraft,
} from "@/lib/job-packet";
import {
  approxTokens,
  CloudScan,
  detectTechs,
  EXAMPLE_JOB_DESCRIPTION,
  formatScanResultForReadability,
  SCANNER_DRAFT_LS_KEY,
  SCANNER_HISTORY_LS_KEY,
  SCANNER_RESUME_DESIRED_STEP_LS_KEY,
  SCANNER_RESUME_JD_LS_KEY,
  scanResultToText,
  titleFromJD,
  type ScanEntry,
  type ScanResultContent,
} from "@/lib/scanner/utils";

export default function ScannerPanel() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResultContent | null>(null);
  const [legacyResult, setLegacyResult] = useState<string>("");
  const [history, setHistory] = useState<ScanEntry[]>([]);
  const [cloudHistory, setCloudHistory] = useState<CloudScan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmKind, setConfirmKind] = useState<"cloud_all" | "cloud_one" | "local_all" | null>(null);
  const [pendingCloudId, setPendingCloudId] = useState<string | null>(null);

  const hasResult = !!scanResult || !!legacyResult;

  const resultText = scanResult ? scanResultToText(scanResult) : legacyResult;

  const abortRef = useRef<AbortController | null>(null);
  const canceledRef = useRef(false);

  // draft + history bootstrap
  useEffect(() => {
    try {
      const d = localStorage.getItem(SCANNER_DRAFT_LS_KEY);
      if (d) setJd(d);
      const raw = localStorage.getItem(SCANNER_HISTORY_LS_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    const packetDraft = readJobPacketDraft();
    if (!packetDraft || !hasMeaningfulJobPacketDraft(packetDraft)) return;
    setJd((prev) => prev || packetDraft.jobDescription);
  }, []);

  // Cloud scan history (Supabase) — optional; keep local history as primary fallback.
  useEffect(() => {
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user?.id) return;

        const { data, error: qErr } = await supabase
          .from("job_scans")
          .select("id,title,jd_excerpt,match_score,strengths,missing_skills,summary,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);
        if (qErr || !data) return;

        const normalized = (data as Array<Record<string, unknown>>).map((r) => ({
          id: String(r.id),
          title: typeof r.title === "string" ? r.title : "Job scan",
          jd_excerpt: typeof r.jd_excerpt === "string" ? r.jd_excerpt : "",
          match_score: typeof r.match_score === "number" ? r.match_score : Number(r.match_score) || 0,
          strengths: Array.isArray(r.strengths) ? (r.strengths as string[]) : [],
          missing_skills: Array.isArray(r.missing_skills) ? (r.missing_skills as string[]) : [],
          summary: typeof r.summary === "string" ? r.summary : String(r.summary ?? ""),
          created_at: typeof r.created_at === "string" ? r.created_at : String(r.created_at ?? ""),
        }));

        setCloudHistory(normalized);
      } catch {
        // noop
      }
    })();
  }, [supabase]);
  useEffect(() => {
    try {
      localStorage.setItem(SCANNER_DRAFT_LS_KEY, jd);
    } catch {}
  }, [jd]);

  const techs = useMemo(() => detectTechs(jd), [jd]);

  function persistHistory(next: ScanEntry[]) {
    setHistory(next);
    try {
      localStorage.setItem(SCANNER_HISTORY_LS_KEY, JSON.stringify(next));
    } catch {}
  }

  function openConfirm(kind: "cloud_all" | "cloud_one" | "local_all", cloudId?: string) {
    setConfirmKind(kind);
    setPendingCloudId(cloudId ?? null);
    setConfirmOpen(true);
  }

  async function runConfirmDelete() {
    const kind = confirmKind;
    setConfirmOpen(false);

    if (!kind) return;

    if (kind === "local_all") {
      persistHistory([]);
      toast({ title: "Device history cleared" });
      return;
    }

    // Cloud deletes require auth + RLS delete policy
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) {
        toast({ title: "Sign in required", variant: "destructive" });
        return;
      }

      if (kind === "cloud_one" && pendingCloudId) {
        const { error: delErr } = await supabase
          .from("job_scans")
          .delete()
          .eq("id", pendingCloudId)
          .eq("user_id", user.id);
        if (delErr) throw delErr;
        setCloudHistory((prev) => prev.filter((x) => x.id !== pendingCloudId));
        toast({ title: "Deleted cloud scan" });
        return;
      }

      if (kind === "cloud_all") {
        const { error: delErr } = await supabase
          .from("job_scans")
          .delete()
          .eq("user_id", user.id);
        if (delErr) throw delErr;
        setCloudHistory([]);
        toast({ title: "Cloud history cleared" });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[scanner] cloud delete failed", msg);
      toast({ title: "Delete failed", description: "Try again in a moment.", variant: "destructive" });
    } finally {
      setPendingCloudId(null);
      setConfirmKind(null);
    }
  }

  function addToHistory(jdText: string, resPayload: string) {
    const entry: ScanEntry = {
      id: `${Date.now()}`,
      jd: jdText,
      result: resPayload,
      created_at: Date.now(),
      title: titleFromJD(jdText),
      techs: detectTechs(jdText),
    };
    const next = [entry, ...history].slice(0, 10); // keep last 10
    persistHistory(next);
  }

  async function analyze() {
    const text = jd.trim();
    if (text.length < 20) {
      setError("Please paste a longer job description.");
      toast({
        title: "Please paste a longer job description",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setScanResult(null);
    setLegacyResult("");
    setError(null);

    canceledRef.current = false;
    const controller = new AbortController();
    abortRef.current = controller;

    const res = await postJson<{
      content?: ScanResultContent;
      error?: string;
    }>("/api/job-scan", { jd: text }, { timeoutMs: 20000, retries: 0, signal: controller.signal });

    abortRef.current = null;
    setLoading(false);

    // If user canceled during the request
    if (canceledRef.current) {
      setError("Canceled.");
      canceledRef.current = false;
      return;
    }

    if (!res.ok) {
      if (res.status === 429) {
        const msg = res.error || "You've hit today's free limit for scans.";
        setError(msg);
        toast({
          title: "Rate limit reached",
          description: msg,
          variant: "destructive",
        });
        return;
      }

      if (res.status === 403 && res.error === "PLAN_LIMIT_REACHED") {
        const msg =
          "You've reached your monthly job scan limit. Upgrade to Pro to continue.";
        setError(msg);
        toast({
          title: "Limit reached",
          description: msg,
          variant: "upgrade",
          duration: 8000,
          action: (
            <Button
              size="default"
              className="cursor-pointer bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
              onClick={() => router.push("/upgrade")}
            >
              Upgrade to Pro
            </Button>
          ),
        });
        return;
      }

      const friendly =
        res.cause === "timeout"
          ? "The scan timed out. Try again with a shorter JD."
          : res.cause === "network"
          ? "Network error. Check your connection and try again."
          : res.cause === "server"
          ? "Service is having trouble. Try again shortly."
          : res.error || "Scan failed.";
      setError(friendly);
      toast({ title: "Scan failed", description: friendly, variant: "destructive" });
      return;
    }

    const content = res.data?.content;
    if (content && typeof content.match_score === "number" && Array.isArray(content.strengths) && Array.isArray(content.missing_skills) && typeof content.summary === "string") {
      setScanResult(content);
      addToHistory(text, JSON.stringify(content));
      updateJobPacketDraft({
        currentStep: "resume",
        jobDescription: text,
        scanResult: content,
      });
    } else {
      setLegacyResult(formatScanResultForReadability(JSON.stringify(content ?? res.data ?? "")));
      addToHistory(text, JSON.stringify(content ?? res.data ?? ""));
    }
    toast({ title: "Scan complete" });
  }

  function continueToResumeTailor() {
    const text = jd.trim();
    if (text.length < 20) {
      toast({ title: "Paste a longer job description first.", variant: "destructive" });
      return;
    }
    try {
      localStorage.setItem(SCANNER_RESUME_JD_LS_KEY, text);
      // Since we can't carry a File object across routes, land the user on Step 1 (upload),
      // then let ResumeWizard auto-advance to the JD step once a resume is attached.
      localStorage.setItem(SCANNER_RESUME_DESIRED_STEP_LS_KEY, "3");
    } catch {
      // noop
    }
    updateJobPacketDraft({
      currentStep: "resume",
      jobDescription: text,
    });
    router.push("/resume?from=scanner");
  }

  function clearAll() {
    setJd("");
    setScanResult(null);
    setLegacyResult("");
    setError(null);
  }

  function copy(text: string, label = "Copied") {
    navigator.clipboard.writeText(text).then(
      () => toast({ title: label }),
      () => toast({ title: "Copy failed", variant: "destructive" })
    );
  }

  function download(text: string, filename: string) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Heading */}
      <section>
        <h1 className="text-2xl font-semibold text-foreground">
          Job Description Scanner
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste a job description to surface the skills, gaps, and themes you should carry into the rest of your workflow.
        </p>
      </section>

      {/* Input Card */}
      <Card className="max-w-3xl rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-foreground">Paste Job Description</CardTitle>

          {/* Error surface */}
          {error && (
            <div className="mt-2">
              <Alert variant="destructive">
                <AlertTitle>Unable to analyze</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-foreground/60">
            <span>
              Characters: <span className="text-foreground/80">{jd.length}</span>
            </span>
            <span>
              ~Tokens: <span className="text-foreground/80">{approxTokens(jd)}</span>
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-foreground/50" />
            <Textarea
              aria-label="Job description input"
              placeholder="Paste the full job description here..."
              className="min-h-[220px] bg-background/80 text-foreground placeholder:text-foreground/40 border-border pr-8 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
            />
          </div>

          {techs.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-foreground/60">Detected:</span>
              {techs.map((t) => (
                <Badge
                  key={t}
                  variant="outline"
                  className="border-border text-foreground/80"
                  title="Detected keyword"
                >
                  {t}
                </Badge>
              ))}
              <Button
                size="sm"
                variant="outline"
                className="ml-1 h-7 border-border text-foreground hover:bg-foreground/[0.06]"
                onClick={() => copy(techs.join(", "), "Copied keywords")}
              >
                <ClipboardCopy className="mr-1 h-3.5 w-3.5" /> Copy keywords
              </Button>
            </div>
          )}

          <p className="text-xs text-foreground/60">
            You can paste raw text from PDF, DOCX, or job posting links.
          </p>
        </CardContent>

        <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-2">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button
              onClick={analyze}
              disabled={loading || jd.trim().length < 20}
              className="bg-indigo-600 cursor-pointer text-white hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
            >
              {loading ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze Job Description
                </>
              )}
            </Button>

            {loading && (
              <Button
                variant="outline"
                onClick={() => {
                  canceledRef.current = true;
                  abortRef.current?.abort();
                }}
                className="border-border text-foreground hover:bg-foreground/[0.06]"
              >
                Cancel
              </Button>
            )}

            <Button
              variant="outline"
              onClick={clearAll}
              disabled={loading || (!jd && !hasResult)}
              className="border-border cursor-pointer text-foreground hover:bg-foreground/[0.05] focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
            >
              Clear
            </Button>
          </div>

          <button
            type="button"
            className="text-xs text-foreground/70 cursor-pointer underline underline-offset-4 hover:text-foreground"
            onClick={() => setJd(EXAMPLE_JOB_DESCRIPTION)}
          >
            Paste example job description
          </button>
        </CardFooter>
      </Card>

      {/* Results Card */}
      <Card className="max-w-3xl rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-foreground">Results</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-8 bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
              onClick={continueToResumeTailor}
              disabled={loading || jd.trim().length < 20}
              title="Continue to resume tailor using this job description"
            >
              Continue to Resume Tailor
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 border-border text-foreground hover:bg-foreground/[0.06]"
              onClick={() => resultText && copy(resultText, "Copied analysis")}
              disabled={!hasResult}
            >
              <ClipboardCopy className="mr-2 h-4 w-4" /> Copy
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 border-border text-foreground hover:bg-foreground/[0.06]"
              onClick={() =>
                resultText &&
                download(
                  resultText,
                  `offervia-scan-${new Date().toISOString().slice(0, 10)}.txt`
                )
              }
              disabled={!hasResult}
            >
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait" initial={false}>
          {loading ? (
            <div className="space-y-2">
              <div className="h-4 w-2/3 animate-pulse rounded bg-foreground/[0.06]" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-foreground/[0.06]" />
              <div className="h-4 w-3/5 animate-pulse rounded bg-foreground/[0.06]" />
              <div className="mt-2 h-24 animate-pulse rounded bg-foreground/[0.06]" />
            </div>
          ) : scanResult ? (
            <motion.div
              key="scanResult"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="space-y-6"
              aria-label="Scan results"
            >
              <div className="mb-6">
                <p className="text-sm text-muted-foreground">Match Score</p>
                <p className="text-3xl font-semibold text-foreground">
                  {scanResult.match_score}%
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Strengths</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
                  {scanResult.strengths.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Missing Skills</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
                  {scanResult.missing_skills.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Summary</p>
                <p className="mt-2 text-sm text-foreground">{scanResult.summary}</p>
              </div>
            </motion.div>
          ) : legacyResult ? (
            <motion.pre
              key="legacyResult"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              aria-label="Scan results"
              className="whitespace-pre-wrap rounded-xl border border-border bg-background/60 p-3 text-sm text-foreground"
            >
              {legacyResult}
            </motion.pre>
          ) : (
            <motion.p
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="text-sm text-foreground/60"
            >
              No scan yet. Paste a job description, run the analysis, then continue into Resume Tailor when you are ready.
            </motion.p>
          )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* History */}
      <div className="max-w-3xl space-y-4">
        <Card className="rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-foreground/70" />
              <CardTitle className="text-foreground">Across devices</CardTitle>
            </div>
            {cloudHistory.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 border-border text-foreground hover:bg-foreground/[0.06]"
                onClick={() => openConfirm("cloud_all")}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {cloudHistory.length === 0 ? (
              <p className="text-sm text-foreground/60">No cloud scans yet.</p>
            ) : (
              <ul className="space-y-2">
                {cloudHistory.map((h) => (
                  <li key={h.id} className="rounded-md border border-border bg-background/60 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">{h.title}</div>
                        <div className="text-xs text-foreground/70">Match score: {h.match_score}%</div>
                      </div>
                      <div className="text-[11px] text-foreground/60">
                        {h.created_at ? new Date(h.created_at).toLocaleString() : ""}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-foreground/80">
                      {h.summary}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-border text-foreground hover:bg-foreground/[0.06]"
                        onClick={() => {
                          // Always load results. JD excerpt is optional (older scans won't have it).
                          if (h.jd_excerpt) setJd(h.jd_excerpt);
                          setScanResult({
                            match_score: h.match_score,
                            strengths: h.strengths,
                            missing_skills: h.missing_skills,
                            summary: h.summary,
                          });
                          setLegacyResult("");
                          toast({
                            title: h.jd_excerpt ? "Loaded cloud scan" : "Loaded results (legacy scan)",
                            description: h.jd_excerpt
                              ? undefined
                              : "This older scan didn’t save the job description text, but the results are still available.",
                          });
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        Load
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
                        onClick={() => {
                          if (!h.jd_excerpt || h.jd_excerpt.trim().length < 20) {
                            toast({
                              title: "This scan can’t continue yet",
                              description:
                                "This older scan didn’t save job description text. Run a new scan to enable continuing from cloud history.",
                              variant: "destructive",
                            });
                            return;
                          }
                          try {
                            localStorage.setItem(SCANNER_RESUME_JD_LS_KEY, h.jd_excerpt);
                            localStorage.setItem(SCANNER_RESUME_DESIRED_STEP_LS_KEY, "3");
                          } catch {
                            // noop
                          }
                          updateJobPacketDraft({
                            currentStep: "resume",
                            jobDescription: h.jd_excerpt,
                            scanResult: {
                              match_score: h.match_score,
                              strengths: h.strengths,
                              missing_skills: h.missing_skills,
                              summary: h.summary,
                            },
                          });
                          router.push("/resume?from=scanner");
                        }}
                      >
                        Continue to Resume Tailor
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 border-border text-foreground hover:bg-foreground/[0.06]"
                        onClick={() => openConfirm("cloud_one", h.id)}
                        title="Delete this scan"
                        aria-label="Delete this scan"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {h.missing_skills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {h.missing_skills.slice(0, 8).map((t) => (
                          <Badge key={t} variant="outline" className="border-border text-foreground/80">
                            {t}
                          </Badge>
                        ))}
                        {h.missing_skills.length > 8 && (
                          <span className="text-[11px] text-foreground/60">
                            +{h.missing_skills.length - 8} more
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-foreground/70" />
              <CardTitle className="text-foreground">On this device</CardTitle>
            </div>
            {history.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 border-border text-foreground hover:bg-foreground/[0.06]"
                onClick={() => openConfirm("local_all")}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {history.length === 0 ? (
              <p className="text-sm text-foreground/60">No device scans yet.</p>
            ) : (
              <ul className="space-y-3">
                {history.map((h) => (
                  <li
                    key={h.id}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-background/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">
                        {h.title}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        {h.techs.slice(0, 6).map((t) => (
                          <Badge
                            key={t}
                            variant="outline"
                            className="border-border text-foreground/80"
                          >
                            {t}
                          </Badge>
                        ))}
                        {h.techs.length > 6 && (
                          <span className="text-[11px] text-foreground/60">
                            +{h.techs.length - 6} more
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-[11px] text-foreground/60">
                        {new Date(h.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-border text-foreground hover:bg-foreground/[0.06]"
                        onClick={() => {
                          setJd(h.jd);
                          setError(null);
                          try {
                            const parsed = JSON.parse(h.result) as unknown;
                            if (
                              parsed &&
                              typeof parsed === "object" &&
                              "match_score" in parsed &&
                              "strengths" in parsed &&
                              "missing_skills" in parsed &&
                              "summary" in parsed
                            ) {
                              setScanResult(parsed as ScanResultContent);
                              setLegacyResult("");
                            } else {
                              setScanResult(null);
                              setLegacyResult(h.result);
                            }
                          } catch {
                            setScanResult(null);
                            setLegacyResult(h.result);
                          }
                          toast({ title: "Loaded scan" });
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-border text-foreground hover:bg-foreground/[0.06]"
                        onClick={() => {
                          try {
                            const parsed = JSON.parse(h.result) as unknown;
                            if (
                              parsed &&
                              typeof parsed === "object" &&
                              "match_score" in parsed &&
                              "strengths" in parsed
                            ) {
                              copy(scanResultToText(parsed as ScanResultContent), "Copied analysis");
                            } else {
                              copy(h.result, "Copied analysis");
                            }
                          } catch {
                            copy(h.result, "Copied analysis");
                          }
                        }}
                      >
                        <ClipboardCopy className="mr-2 h-4 w-4" /> Copy
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 border-border text-foreground hover:bg-foreground/[0.06]"
                        onClick={() => {
                          const next = history.filter((x) => x.id !== h.id);
                          persistHistory(next);
                        }}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete history?</DialogTitle>
            <DialogDescription>
              {confirmKind === "cloud_all" && "This will permanently delete your cloud scan history across devices."}
              {confirmKind === "cloud_one" && "This will permanently delete this cloud scan entry."}
              {confirmKind === "local_all" && "This will clear scan history stored on this device only."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={runConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
