// app/(protected)/scanner/page.tsx
"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { postJson } from "@/lib/safe-fetch";

type ScanEntry = {
  id: string;
  jd: string;
  result: string;
  created_at: number;
  title: string;
  techs: string[];
};

const LS_HISTORY_KEY = "offervia:scannerHistory_v1";
const LS_DRAFT_KEY = "offervia:scannerDraft_v1";

// naïve tech/keyword detection (fast + client-only)
const TECH_DICT = [
  "react","next.js","typescript","javascript","node","node.js","graphql","rest","api","html","css","tailwind","redux","jest","rtl","cypress","testing","vitest","playwright","webpack","vite","rollup","aws","gcp","azure","docker","kubernetes","sql","postgres","mysql","mongodb","python","go","java","c++","a11y","accessibility","performance",
];

function detectTechs(text: string): string[] {
  const hay = text.toLowerCase();
  const set = new Set<string>();
  for (const t of TECH_DICT) {
    const rx =
      t === "c++"
        ? /\bc\+\+\b/i
        : new RegExp(`(^|[^a-z0-9])${t.replace(".", "\\.")}([^a-z0-9]|$)`, "i");
    if (rx.test(hay)) set.add(t);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function titleFromJD(text: string): string {
  const first =
    (text || "").split("\n").map((s) => s.trim()).find(Boolean) ||
    "Untitled scan";
  return first.length > 90 ? first.slice(0, 87) + "…" : first;
}

function approxTokens(s: string) {
  // rough heuristic (4 chars ≈ 1 token)
  return Math.max(1, Math.round((s || "").length / 4));
}

export default function ScannerPanel() {
  const { toast } = useToast();
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [history, setHistory] = useState<ScanEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const canceledRef = useRef(false);

  // draft + history bootstrap
  useEffect(() => {
    try {
      const d = localStorage.getItem(LS_DRAFT_KEY);
      if (d) setJd(d);
      const raw = localStorage.getItem(LS_HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(LS_DRAFT_KEY, jd);
    } catch {}
  }, [jd]);

  const techs = useMemo(() => detectTechs(jd), [jd]);

  const exampleJD = `Software Engineer (Frontend)

We are seeking a Frontend Engineer to build accessible, performant web experiences.
Responsibilities include implementing UI components, collaborating with design, writing tests, and improving performance.
Requirements: JavaScript/TypeScript, React, HTML, CSS, REST APIs, testing (Jest/RTL). Bonus: Next.js, accessibility, performance profiling.`;

  function formatForReadability(raw: string): string {
    if (!raw) return "";
    let out = raw.replace(/\n(?=\s*[1-9]\)\s)/g, "\n\n");
    out = out.replace(
      /\n(?=\s*(Summary|Top required hard skills|Top required soft skills|Missing skills|Keywords|Follow-up))/gi,
      "\n\n"
    );
    return out.trim();
  }

  function persistHistory(next: ScanEntry[]) {
    setHistory(next);
    try {
      localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(next));
    } catch {}
  }

  function addToHistory(jdText: string, resText: string) {
    const entry: ScanEntry = {
      id: `${Date.now()}`,
      jd: jdText,
      result: resText,
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
    setResult("");
    setError(null);

    canceledRef.current = false;
    const controller = new AbortController();
    abortRef.current = controller;

    const res = await postJson<{ content?: string; error?: string }>(
      "/api/job-scan",
      { jd: text },
      { timeoutMs: 20000, retries: 0, signal: controller.signal }
    );

    abortRef.current = null;
    setLoading(false);

    // If user canceled during the request
    if (canceledRef.current) {
      setError("Canceled.");
      canceledRef.current = false;
      return;
    }

    if (!res.ok) {
      // NEW: clear rate-limit UX
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

    const formatted = formatForReadability(String((res.data as any)?.content || ""));
    setResult(formatted);
    addToHistory(text, formatted);
    toast({ title: "Scan complete" });
  }

  function clearAll() {
    setJd("");
    setResult("");
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
          Paste a job description and analyze key skills, gaps, and keywords.
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

        <CardFooter className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
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
              disabled={loading || (!jd && !result)}
              className="border-border cursor-pointer text-foreground hover:bg-foreground/[0.05] focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
            >
              Clear
            </Button>
          </div>

          <button
            type="button"
            className="text-xs text-foreground/70 cursor-pointer underline underline-offset-4 hover:text-foreground"
            onClick={() => setJd(exampleJD)}
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
              variant="outline"
              className="h-8 border-border text-foreground hover:bg-foreground/[0.06]"
              onClick={() => result && copy(result, "Copied analysis")}
              disabled={!result}
            >
              <ClipboardCopy className="mr-2 h-4 w-4" /> Copy
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 border-border text-foreground hover:bg-foreground/[0.06]"
              onClick={() =>
                result &&
                download(
                  result,
                  `offervia-scan-${new Date().toISOString().slice(0, 10)}.txt`
                )
              }
              disabled={!result}
            >
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <div className="h-4 w-2/3 animate-pulse rounded bg-foreground/[0.06]" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-foreground/[0.06]" />
              <div className="h-4 w-3/5 animate-pulse rounded bg-foreground/[0.06]" />
              <div className="mt-2 h-24 animate-pulse rounded bg-foreground/[0.06]" />
            </div>
          ) : result ? (
            <pre
              aria-label="Scan results"
              className="whitespace-pre-wrap rounded-xl border border-border bg-background/60 p-3 text-sm text-foreground"
            >
              {result}
            </pre>
          ) : (
            <p className="text-sm text-foreground/60">
              No analysis yet. Paste a job description and click Analyze.
            </p>
          )}
        </CardContent>
      </Card>

      {/* History */}
      <Card className="max-w-3xl rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-foreground/70" />
            <CardTitle className="text-foreground">Recent scans</CardTitle>
          </div>
          {history.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 border-border text-foreground hover:bg-foreground/[0.06]"
              onClick={() => persistHistory([])}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear history
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {history.length === 0 ? (
            <p className="text-sm text-foreground/60">No scans yet.</p>
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
                        setResult(h.result);
                        setError(null);
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
                      onClick={() => copy(h.result, "Copied analysis")}
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
  );
}