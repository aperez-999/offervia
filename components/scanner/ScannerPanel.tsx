"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function ScannerPanel() {
  const { toast } = useToast();
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");

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

  async function analyze() {
    const text = jd.trim();
    if (text.length < 20) {
      toast({
        title: "Please paste a longer job description",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/job-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Scan failed");
      const formatted = formatForReadability(String(data.content || ""));
      setResult(formatted);
    } catch {
      toast({
        title: "AI is temporarily unavailable. Try again soon.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function clearAll() {
    setJd("");
    setResult("");
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
        <CardHeader>
          <CardTitle className="text-foreground">Paste Job Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            placeholder="Paste the full job description here..."
            className="min-h-[220px] bg-background/80 text-foreground placeholder:text-foreground/40 border-border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />
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
              {loading ? "Analyzing..." : "Analyze Job Description"}
            </Button>
            <Button
              variant="outline"
              onClick={clearAll}
              disabled={loading && !result}
              className="border-border cursor-pointer text-foreground hover:bg-foreground/[0.05] focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
            >
              Clear Analysis
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
        <CardHeader>
          <CardTitle className="text-foreground">Results</CardTitle>
        </CardHeader>
        <CardContent>
          {result ? (
            <pre className="whitespace-pre-wrap rounded-xl border border-border bg-background/60 p-3 text-sm text-foreground">
              {result}
            </pre>
          ) : (
            <p className="text-sm text-foreground/60">
              No analysis yet. Paste a job description and click Analyze.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}