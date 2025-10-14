"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function ScannerPanel() {
  const { toast } = useToast();
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  const exampleJD = `Software Engineer (Frontend)\n\nWe are seeking a Frontend Engineer to build accessible, performant web experiences.\nResponsibilities include implementing UI components, collaborating with design, writing tests, and improving performance.\nRequirements: JavaScript/TypeScript, React, HTML, CSS, REST APIs, testing (Jest/RTL). Bonus: Next.js, accessibility, performance profiling.`;

  function formatForReadability(raw: string): string {
    if (!raw) return "";
    // Ensure a blank line before numbered sections like 1) 2) 3)
    let out = raw.replace(/\n(?=\s*[1-9]\)\s)/g, "\n\n");
    // Also ensure a blank line before common section keywords
    out = out.replace(/\n(?=\s*(Summary|Top required hard skills|Top required soft skills|Missing skills|Keywords|Follow-up))/gi, "\n\n");
    return out.trim();
  }

  async function analyze() {
    const text = jd.trim();
    if (text.length < 20) {
      toast({ title: "Please paste a longer job description", variant: "destructive" });
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
    } catch (e: any) {
      toast({ title: "AI is temporarily unavailable. Try again soon.", variant: "destructive" });
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
      <section>
        <h1 className="text-2xl font-semibold text-gray-900">Job Description Scanner</h1>
        <p className="text-sm text-gray-600 mt-1">Paste a job description and analyze key skills, gaps, and keywords.</p>
      </section>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-gray-900">Paste Job Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            placeholder="Paste the full job description here..."
            className="min-h-[220px]"
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />
          <p className="text-xs text-gray-500">You can paste raw text from PDF, DOCX, or job posting links.</p>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Button onClick={analyze} disabled={loading || jd.trim().length < 20}>
              {loading ? "Analyzing..." : "Analyze Job Description"}
            </Button>
            <Button variant="outline" onClick={clearAll} disabled={loading && !result}>
              Clear Analysis
            </Button>
          </div>
          <button
            type="button"
            className="text-xs text-gray-600 underline hover:text-gray-800"
            onClick={() => setJd(exampleJD)}
          >
            Paste example job description
          </button>
        </CardFooter>
      </Card>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-gray-900">Results</CardTitle>
        </CardHeader>
        <CardContent>
          {result ? (
            <pre className="whitespace-pre-wrap text-sm text-gray-800">{result}</pre>
          ) : (
            <p className="text-sm text-gray-500">No analysis yet. Paste a job description and click Analyze.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
